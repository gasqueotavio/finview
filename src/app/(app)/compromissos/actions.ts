"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { TIPOS_COMPROMISSO } from "@/lib/catalogo";
import { cifrar, cifrarOpcional, decifrar } from "@/lib/crypto";
import { parcelasParaQuitar, taxaImplicita } from "@/lib/financeiro";
import { hojeEmBrasilia } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { TAXA_OBRIGATORIA, compromissoSchema, edicaoCompromissoSchema, planoAnoSchema } from "@/lib/validations/compromisso";
import { quitacaoSchema } from "@/lib/validations/lancamento";

export type EstadoForm = {
  mensagem?: string;
  erros?: Record<string, string[] | undefined>;
  // Devolvidos para o formulário não perder o que foi digitado quando há erro.
  valores?: Record<string, string>;
};

export async function criarCompromisso(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await getUsuario();
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = compromissoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;
  const temPrazo = TIPOS_COMPROMISSO[d.tipo].temPrazo;
  // Conta anual: "valor" é o total do ano, dividido em parcelas_por_ano (1 = cota única).
  const anual = d.tipo === "anual";
  const saldo = temPrazo ? d.saldoDevedor : undefined;
  const comJuros = Boolean(TIPOS_COMPROMISSO[d.tipo].comJuros);
  let taxa = comJuros ? d.taxaJuros : undefined;
  let taxaEstimada = false;
  let totalParcelas = d.totalParcelas;

  if (temPrazo && saldo !== undefined) {
    if (!totalParcelas) {
      // Só o saldo: estima quantas parcelas faltam (com juros, se a taxa foi informada).
      const restantes = parcelasParaQuitar(saldo, d.valor, taxa ?? 0);
      if (restantes === null) {
        return { erros: { taxaJuros: ["Com essa taxa, a parcela não cobre nem os juros do mês. Confira o saldo, a parcela e a taxa."] }, valores };
      }
      totalParcelas = d.primeiraParcela - 1 + Math.max(1, restantes);
    } else if (comJuros && taxa === undefined) {
      // Saldo + parcelas que faltam: dá para descobrir a taxa embutida.
      const estimada = taxaImplicita(saldo, d.valor, totalParcelas - d.primeiraParcela + 1);
      if (estimada !== null) {
        taxa = estimada;
        taxaEstimada = true;
      }
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compromissos")
    .insert({
      user_id: usuario.id,
      categoria_id: d.categoriaId ?? null,
      tipo: d.tipo,
      frequencia: anual ? "anual" : d.frequencia,
      descricao_enc: cifrar(d.descricao, usuario.id),
      observacao_enc: cifrarOpcional(d.observacao, usuario.id),
      modelo_enc: cifrarOpcional(d.modelo, usuario.id),
      valor_parcela: anual ? Math.round((d.valor / d.parcelasPorAno) * 100) / 100 : d.valor,
      valor_anual: anual ? d.valor : null,
      parcelas_por_ano: anual ? d.parcelasPorAno : null,
      valor_variavel: d.valorVariavel,
      total_parcelas: temPrazo ? totalParcelas : null,
      // Parcelas pagas depois de hoje são descontadas deste saldo (ver vw_compromissos_resumo).
      ...(saldo !== undefined && { saldo_informado: saldo, saldo_informado_em: hojeEmBrasilia() }),
      taxa_juros_mensal: taxa ?? null,
      taxa_estimada: taxaEstimada,
      primeira_parcela: temPrazo ? d.primeiraParcela : 1,
      data_vencimento_inicial: d.dataVencimentoInicial,
    })
    .select("id")
    .single();

  if (error) return { mensagem: "Não foi possível salvar o compromisso.", valores };

  const { error: erroGeracao } = await supabase.rpc("gerar_lancamentos", { p_compromisso_id: data.id });
  if (erroGeracao) {
    await supabase.from("compromissos").delete().eq("id", data.id);
    return { mensagem: "Não foi possível gerar as parcelas. Tente novamente.", valores };
  }

  redirect("/dashboard");
}

export async function replanejarAno(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await getUsuario();
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = planoAnoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;

  const plano =
    d.escolha === "cota_unica"
      ? { p_parcelas: 1, p_valor_total: d.valorCotaUnica, p_primeiro_vencimento: d.dataCotaUnica }
      : { p_parcelas: d.parcelas, p_valor_total: d.valorParcelado, p_primeiro_vencimento: d.dataPrimeiraParcela };

  const supabase = await createClient();
  const { error } = await supabase.rpc("replanejar_ano", {
    p_compromisso_id: d.compromissoId,
    p_ano: d.ano,
    ...plano,
  });

  if (error) {
    const jaPago = error.message.includes("parcela paga");
    return {
      mensagem: jaPago
        ? "Já existe parcela paga neste ano; o plano não pode mais mudar."
        : "Não foi possível salvar o plano.",
      valores,
    };
  }

  redirect("/dashboard");
}

export async function quitarCompromisso(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await getUsuario();
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = quitacaoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: compromisso, error: erroBusca } = await supabase
    .from("compromissos")
    .select("descricao_enc")
    .eq("id", d.compromissoId)
    .single();
  if (erroBusca) return { mensagem: "Compromisso não encontrado.", valores };

  const descricao = `Quitação: ${decifrar(compromisso.descricao_enc, usuario.id)}`;
  const { error } = await supabase.rpc("quitar_compromisso", {
    p_compromisso_id: d.compromissoId,
    p_data: d.data,
    p_valor: d.valor,
    p_descricao_enc: cifrar(descricao, usuario.id),
  });
  if (error) return { mensagem: "Não foi possível quitar o compromisso.", valores };

  refresh();
  return {};
}

export async function cancelarCompromisso(formData: FormData) {
  await getUsuario();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_compromisso", { p_compromisso_id: id });
  if (error) throw new Error("Não foi possível cancelar o compromisso.");
  refresh();
}

export async function editarCompromisso(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await getUsuario();
  const valores = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
  const parsed = edicaoCompromissoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: atual, error: erroBusca } = await supabase
    .from("compromissos")
    .select("tipo, status, valor_parcela, taxa_estimada, taxa_juros_mensal")
    .eq("id", d.id)
    .single();
  if (erroBusca) return { mensagem: "Compromisso não encontrado.", valores };
  // Financiamento/empréstimo ativo precisa da taxa (o campo aparece no formulário).
  if (TIPOS_COMPROMISSO[atual.tipo].exigeTaxa && atual.status === "ativo" && d.taxaJuros === undefined) {
    return { erros: { taxaJuros: [TAXA_OBRIGATORIA] }, valores };
  }
  // O campo de valor só aparece para compromisso ativo e que não é conta anual.
  if (atual.tipo !== "anual" && atual.status === "ativo" && d.valor === undefined) {
    return { erros: { valor: ["Informe o valor"] }, valores };
  }

  const { error } = await supabase.rpc("editar_compromisso", {
    p_compromisso_id: d.id,
    p_descricao_enc: cifrar(d.descricao, usuario.id),
    p_valor_parcela: d.valor ?? Number(atual.valor_parcela),
    p_valor_variavel: d.valorVariavel,
    p_categoria_id: d.categoriaId,
    p_observacao_enc: cifrarOpcional(d.observacao, usuario.id) ?? undefined,
  });
  if (error) return { mensagem: "Não foi possível salvar as alterações.", valores };

  const saldoMudou = d.saldoDevedor !== undefined && d.saldoDevedor !== d.saldoOriginal;
  const taxaMudou = d.taxaJuros !== d.taxaOriginal;
  const atualizacao: Database["public"]["Tables"]["compromissos"]["Update"] = {};

  // Saldo do banco atualizado: vira o novo ponto de partida (parcelas pagas depois de hoje são descontadas).
  if (saldoMudou) Object.assign(atualizacao, { saldo_informado: d.saldoDevedor, saldo_informado_em: hojeEmBrasilia() });

  if (taxaMudou) {
    // Taxa digitada (do contrato) vale mais que a estimada; apagar o campo = sem juros.
    Object.assign(atualizacao, { taxa_juros_mensal: d.taxaJuros ?? null, taxa_estimada: false });
  } else if (saldoMudou && TIPOS_COMPROMISSO[atual.tipo].comJuros && (atual.taxa_estimada || atual.taxa_juros_mensal === null)) {
    // Saldo novo e taxa não informada: recalcula a taxa com as parcelas que ainda faltam.
    const { count } = await supabase
      .from("lancamentos")
      .select("id", { count: "exact", head: true })
      .eq("compromisso_id", d.id)
      .eq("status", "pendente");
    const estimada = count ? taxaImplicita(d.saldoDevedor!, d.valor ?? Number(atual.valor_parcela), count) : null;
    Object.assign(atualizacao, { taxa_juros_mensal: estimada, taxa_estimada: estimada !== null });
  }

  if (Object.keys(atualizacao).length > 0) {
    const { error: erroSaldo } = await supabase.from("compromissos").update(atualizacao).eq("id", d.id);
    if (erroSaldo) return { mensagem: "Alterações salvas, mas não foi possível atualizar o saldo e os juros.", valores };
  }

  redirect("/compromissos");
}

/** Exclui o compromisso e todas as parcelas, inclusive o histórico pago (para manter o histórico, use Cancelar). */
export async function excluirCompromisso(formData: FormData) {
  await getUsuario();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { data, error } = await supabase.from("compromissos").delete().eq("id", id).select("id");
  if (error || data.length === 0) throw new Error("Não foi possível excluir o compromisso.");
  redirect("/compromissos");
}
