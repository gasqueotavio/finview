import "server-only";
import { getUsuario } from "@/lib/auth";
import { decifrar, decifrarOpcional } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import type { LinhaLancamento } from "@/types/views";

export type Situacao = "pendente" | "pago" | "cancelado" | "atrasado";

export type Lancamento = {
  id: string;
  tipo: "avulso" | "parcela" | "quitacao";
  compromissoId: string | null;
  categoriaId: string | null;
  descricao: string;
  observacao: string | null;
  valor: number;
  valorEstimado: boolean;
  valorPago: number | null;
  dataVencimento: string;
  dataPagamento: string | null;
  numeroParcela: number | null;
  /** Total de parcelas do compromisso (financiamentos, parcelamentos...); null se não tem prazo. */
  totalParcelas: number | null;
  /** Só em contas anuais: a parcela pertence a este ano. */
  anoReferencia: number | null;
  situacao: Situacao;
};

export type ResumoMensal = {
  totalPrevisto: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
};

function intervaloDoMes(ano: number, mes: number) {
  const inicio = new Date(Date.UTC(ano, mes - 1, 1)).toISOString().slice(0, 10);
  const fim = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 10);
  return { inicio, fim };
}

export async function listarLancamentosDoMes(ano: number, mes: number): Promise<Lancamento[]> {
  const usuario = await getUsuario();
  const supabase = await createClient();
  const { inicio, fim } = intervaloDoMes(ano, mes);

  const { data, error } = await supabase
    .from("vw_lancamentos")
    .select("id, tipo, compromisso_id, categoria_id, descricao_enc, observacao_enc, valor, valor_estimado, valor_pago, data_vencimento, data_pagamento, numero_parcela, ano_referencia, situacao")
    .gte("data_vencimento", inicio)
    .lt("data_vencimento", fim)
    .neq("status", "cancelado")
    .order("data_vencimento");

  if (error) throw error;
  const linhas = data as LinhaLancamento[];

  // Total de parcelas para exibir "3/10".
  const idsCompromissos = [...new Set(linhas.map((l) => l.compromisso_id).filter((id): id is string => id !== null))];
  const totais = new Map<string, number | null>();
  if (idsCompromissos.length > 0) {
    const { data: compromissos, error: erroCompromissos } = await supabase
      .from("compromissos")
      .select("id, total_parcelas")
      .in("id", idsCompromissos);
    if (erroCompromissos) throw erroCompromissos;
    for (const c of compromissos) totais.set(c.id, c.total_parcelas);
  }

  return linhas.map((l) => ({
    id: l.id,
    tipo: l.tipo,
    compromissoId: l.compromisso_id,
    categoriaId: l.categoria_id,
    descricao: decifrar(l.descricao_enc, usuario.id),
    observacao: decifrarOpcional(l.observacao_enc, usuario.id),
    valor: Number(l.valor),
    valorEstimado: l.valor_estimado,
    valorPago: l.valor_pago === null ? null : Number(l.valor_pago),
    dataVencimento: l.data_vencimento,
    dataPagamento: l.data_pagamento,
    numeroParcela: l.numero_parcela,
    totalParcelas: l.compromisso_id ? (totais.get(l.compromisso_id) ?? null) : null,
    anoReferencia: l.ano_referencia,
    situacao: l.situacao as Situacao,
  }));
}

export async function resumoDoMes(ano: number, mes: number): Promise<ResumoMensal> {
  await getUsuario();
  const supabase = await createClient();
  const { inicio } = intervaloDoMes(ano, mes);

  const { data, error } = await supabase
    .from("vw_resumo_mensal")
    .select("total_previsto, total_pago, total_pendente, total_atrasado")
    .eq("mes", inicio)
    .maybeSingle();

  if (error) throw error;

  return {
    totalPrevisto: Number(data?.total_previsto ?? 0),
    totalPago: Number(data?.total_pago ?? 0),
    totalPendente: Number(data?.total_pendente ?? 0),
    totalAtrasado: Number(data?.total_atrasado ?? 0),
  };
}
