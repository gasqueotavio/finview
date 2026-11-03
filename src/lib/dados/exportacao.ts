import "server-only";
import { getUsuario } from "@/lib/auth";
import { decifrar, decifrarOpcional } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";

// O PostgREST devolve no máximo 1000 linhas por consulta; busca em páginas até acabar.
const PAGINA = 1000;

async function todas<T>(buscar: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const linhas: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await buscar(de, de + PAGINA - 1);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return linhas;
  }
}

/**
 * Portabilidade (LGPD, art. 18, V): todos os dados do usuário, já decifrados, em formato legível.
 * Valores em reais como número; datas em "AAAA-MM-DD".
 */
export async function exportarMeusDados() {
  const usuario = await getUsuario();
  const supabase = await createClient();

  const [
    { data: preferencias, error: erroPreferencias },
    { data: aparelhos, error: erroAparelhos },
    { data: aceiteIA, error: erroAceite },
    { data: usoIA, error: erroUso },
  ] = await Promise.all([
    supabase.from("notificacao_preferencias").select("no_dia, um_dia_antes, tres_dias_antes, atrasadas, mostrar_detalhes").maybeSingle(),
    supabase.from("push_inscricoes").select("dispositivo, criado_em").order("criado_em"),
    supabase.from("ia_consentimentos").select("aceito_em").maybeSingle(),
    supabase.from("ia_uso").select("dia, leituras").order("dia"),
  ]);
  if (erroPreferencias) throw erroPreferencias;
  if (erroAparelhos) throw erroAparelhos;
  if (erroAceite) throw erroAceite;
  if (erroUso) throw erroUso;

  const [categorias, compromissos, lancamentos] = await Promise.all([
    todas((de, ate) =>
      supabase.from("categorias").select("id, chave, nome_enc, cor, arquivada, criado_em").order("criado_em").range(de, ate),
    ),
    todas((de, ate) =>
      supabase
        .from("compromissos")
        .select(
          "id, categoria_id, tipo, frequencia, descricao_enc, observacao_enc, modelo_enc, valor_parcela, valor_anual, parcelas_por_ano, valor_variavel, total_parcelas, primeira_parcela, data_vencimento_inicial, saldo_informado, saldo_informado_em, taxa_juros_mensal, taxa_estimada, status, encerrado_em, criado_em",
        )
        .order("criado_em")
        .range(de, ate),
    ),
    todas((de, ate) =>
      supabase
        .from("lancamentos")
        .select(
          "id, compromisso_id, categoria_id, tipo, descricao_enc, observacao_enc, valor, valor_estimado, valor_pago, data_vencimento, data_pagamento, numero_parcela, ano_referencia, status, criado_em",
        )
        .order("data_vencimento")
        .order("id")
        .range(de, ate),
    ),
  ]);

  const id = usuario.id;
  return {
    sobre: "Exportação dos seus dados no FinView (LGPD, art. 18, V). Valores em reais; datas no formato AAAA-MM-DD.",
    gerado_em: new Date().toISOString(),
    conta: { email: usuario.email },
    notificacoes: {
      preferencias,
      aparelhos: aparelhos.map((a) => ({ aparelho: a.dispositivo, ativado_em: a.criado_em })),
    },
    leitura_com_ia: {
      aceite_em: aceiteIA?.aceito_em ?? null,
      leituras_por_dia: usoIA,
    },
    categorias: categorias.map((c) => ({
      id: c.id,
      nome: decifrar(c.nome_enc, id),
      cor: c.cor,
      padrao_do_catalogo: c.chave !== null,
      arquivada: c.arquivada,
      criada_em: c.criado_em,
    })),
    compromissos: compromissos.map((c) => ({
      id: c.id,
      descricao: decifrar(c.descricao_enc, id),
      observacao: decifrarOpcional(c.observacao_enc, id),
      item_do_catalogo: decifrarOpcional(c.modelo_enc, id),
      categoria_id: c.categoria_id,
      tipo: c.tipo,
      frequencia: c.frequencia,
      valor_por_cobranca: Number(c.valor_parcela),
      valor_anual: c.valor_anual === null ? null : Number(c.valor_anual),
      parcelas_por_ano: c.parcelas_por_ano,
      valor_variavel: c.valor_variavel,
      total_parcelas: c.total_parcelas,
      primeira_parcela: c.primeira_parcela,
      primeiro_vencimento: c.data_vencimento_inicial,
      saldo_devedor_informado: c.saldo_informado === null ? null : Number(c.saldo_informado),
      saldo_informado_em: c.saldo_informado_em,
      juros_ao_mes_percentual: c.taxa_juros_mensal === null ? null : Number(c.taxa_juros_mensal),
      juros_estimados_pelo_app: c.taxa_estimada,
      status: c.status,
      encerrado_em: c.encerrado_em,
      criado_em: c.criado_em,
    })),
    lancamentos: lancamentos.map((l) => ({
      id: l.id,
      descricao: decifrar(l.descricao_enc, id),
      observacao: decifrarOpcional(l.observacao_enc, id),
      compromisso_id: l.compromisso_id,
      categoria_id: l.categoria_id,
      tipo: l.tipo,
      valor: Number(l.valor),
      valor_estimado: l.valor_estimado,
      valor_pago: l.valor_pago === null ? null : Number(l.valor_pago),
      vencimento: l.data_vencimento,
      pago_em: l.data_pagamento,
      numero_parcela: l.numero_parcela,
      ano_referencia: l.ano_referencia,
      status: l.status,
      criado_em: l.criado_em,
    })),
  };
}
