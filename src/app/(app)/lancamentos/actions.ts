"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { cifrar, cifrarOpcional } from "@/lib/crypto";
import { hojeEmBrasilia } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { avulsoSchema, edicaoAvulsoSchema, pagamentoSchema, valorRealSchema } from "@/lib/validations/lancamento";

export type EstadoAcao = {
  mensagem?: string;
  erros?: Record<string, string[] | undefined>;
  valores?: Record<string, string>;
  ok?: boolean;
};

function valoresDo(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
}

export async function pagarLancamento(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  await getUsuario();
  const parsed = pagamentoSchema.safeParse(valoresDo(formData));
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.rpc("pagar_lancamento", {
    p_lancamento_id: parsed.data.id,
    p_valor_pago: parsed.data.valorPago,
    p_data: parsed.data.dataPagamento,
  });
  if (error) return { mensagem: "Não foi possível registrar o pagamento." };

  refresh();
  return { ok: true };
}

export async function informarValorReal(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  await getUsuario();
  const parsed = valorRealSchema.safeParse(valoresDo(formData));
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .update({ valor: parsed.data.valor })
    .eq("id", parsed.data.id)
    .eq("status", "pendente")
    .select("id");
  if (error || data.length === 0) return { mensagem: "Não foi possível atualizar o valor." };

  refresh();
  return { ok: true };
}

export async function desfazerPagamento(id: string): Promise<EstadoAcao> {
  await getUsuario();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { mensagem: "Lançamento inválido." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("desfazer_pagamento", { p_lancamento_id: parsed.data });
  if (error) return { mensagem: "Não foi possível desfazer o pagamento." };

  refresh();
  return { ok: true };
}

/** Pagamento em um toque: valor previsto, data de hoje. Só para valores que não são estimativa. */
export async function pagarAgora(id: string): Promise<EstadoAcao> {
  await getUsuario();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { mensagem: "Lançamento inválido." };

  const supabase = await createClient();
  const { data: lancamento, error: erroBusca } = await supabase
    .from("lancamentos")
    .select("valor, valor_estimado")
    .eq("id", parsed.data)
    .eq("status", "pendente")
    .single();
  if (erroBusca) return { mensagem: "Lançamento não encontrado ou já pago." };
  if (lancamento.valor_estimado) return { mensagem: "Informe o valor real antes de pagar." };

  const { error } = await supabase.rpc("pagar_lancamento", {
    p_lancamento_id: parsed.data,
    p_valor_pago: lancamento.valor,
    p_data: hojeEmBrasilia(),
  });
  if (error) return { mensagem: "Não foi possível registrar o pagamento." };

  refresh();
  return { ok: true };
}

export async function criarLancamentoAvulso(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await getUsuario();
  const valores = valoresDo(formData);
  const parsed = avulsoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("lancamentos").insert({
    user_id: usuario.id,
    tipo: "avulso",
    categoria_id: d.categoriaId ?? null,
    descricao_enc: cifrar(d.descricao, usuario.id),
    observacao_enc: cifrarOpcional(d.observacao, usuario.id),
    valor: d.valor,
    data_vencimento: d.dataVencimento,
    ...(d.dataPagamento && { status: "pago", data_pagamento: d.dataPagamento, valor_pago: d.valor }),
  });
  if (error) return { mensagem: "Não foi possível salvar o gasto.", valores };

  redirect(`/dashboard?mes=${d.dataVencimento.slice(0, 7)}`);
}

/** Edita um gasto avulso. Se já estava pago, o pagamento acompanha o novo valor e a nova data. */
export async function editarLancamentoAvulso(_prev: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const usuario = await getUsuario();
  const valores = valoresDo(formData);
  const parsed = edicaoAvulsoSchema.safeParse(valores);
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors, valores };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: atual, error: erroBusca } = await supabase
    .from("lancamentos")
    .select("status")
    .eq("id", d.id)
    .eq("tipo", "avulso")
    .single();
  if (erroBusca) return { mensagem: "Gasto não encontrado.", valores };

  const { error } = await supabase
    .from("lancamentos")
    .update({
      descricao_enc: cifrar(d.descricao, usuario.id),
      observacao_enc: cifrarOpcional(d.observacao, usuario.id),
      categoria_id: d.categoriaId ?? null,
      valor: d.valor,
      data_vencimento: d.data,
      ...(atual.status === "pago" && { valor_pago: d.valor, data_pagamento: d.data }),
    })
    .eq("id", d.id)
    .eq("tipo", "avulso");
  if (error) return { mensagem: "Não foi possível salvar as alterações.", valores };

  refresh();
  return { ok: true };
}

/** Exclui um gasto avulso. Parcelas de compromisso não são excluídas uma a uma (use editar/cancelar o compromisso). */
export async function excluirLancamentoAvulso(id: string): Promise<EstadoAcao> {
  await getUsuario();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { mensagem: "Gasto inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("lancamentos").delete().eq("id", parsed.data).eq("tipo", "avulso").select("id");
  if (error || data.length === 0) return { mensagem: "Não foi possível excluir o gasto." };

  refresh();
  return { ok: true };
}
