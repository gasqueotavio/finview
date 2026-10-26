import "server-only";
import { getUsuario } from "@/lib/auth";
import { decifrar } from "@/lib/crypto";
import type { Situacao } from "@/lib/dados/lancamentos";
import { createClient } from "@/lib/supabase/server";

export type CicloAnual = {
  compromissoId: string;
  descricao: string;
  ano: number;
  parcelas: { numero: number; data: string; valor: number; situacao: Situacao }[];
  total: number;
  estimado: boolean;
  /** Com alguma parcela paga o plano do ano não pode mais mudar. */
  algumaPaga: boolean;
  primeiroVencimento: string;
};

type Linha = {
  compromisso_id: string;
  ano_referencia: number;
  numero_parcela: number;
  data_vencimento: string;
  valor: number;
  valor_estimado: boolean;
  situacao: Situacao;
};

function agruparCiclos(linhas: Linha[], descricoes: Map<string, string>): CicloAnual[] {
  const ciclos = new Map<string, CicloAnual>();
  for (const l of linhas) {
    const chave = `${l.compromisso_id}:${l.ano_referencia}`;
    let ciclo = ciclos.get(chave);
    if (!ciclo) {
      ciclo = {
        compromissoId: l.compromisso_id,
        descricao: descricoes.get(l.compromisso_id) ?? "",
        ano: l.ano_referencia,
        parcelas: [],
        total: 0,
        estimado: false,
        algumaPaga: false,
        primeiroVencimento: l.data_vencimento,
      };
      ciclos.set(chave, ciclo);
    }
    const valor = Number(l.valor);
    ciclo.parcelas.push({ numero: l.numero_parcela, data: l.data_vencimento, valor, situacao: l.situacao });
    ciclo.total = Math.round((ciclo.total + valor) * 100) / 100;
    ciclo.estimado ||= l.valor_estimado;
    ciclo.algumaPaga ||= l.situacao === "pago";
  }
  return [...ciclos.values()];
}

async function buscarCiclos(filtro: { compromissoId?: string; ano?: number }) {
  const usuario = await getUsuario();
  const supabase = await createClient();

  let consultaCompromissos = supabase.from("compromissos").select("id, descricao_enc").eq("tipo", "anual");
  if (filtro.compromissoId) consultaCompromissos = consultaCompromissos.eq("id", filtro.compromissoId);
  else consultaCompromissos = consultaCompromissos.eq("status", "ativo");
  const { data: compromissos, error } = await consultaCompromissos;
  if (error) throw error;
  if (compromissos.length === 0) return [];

  const descricoes = new Map(compromissos.map((c) => [c.id, decifrar(c.descricao_enc, usuario.id)]));

  let consultaParcelas = supabase
    .from("vw_lancamentos")
    .select("compromisso_id, ano_referencia, numero_parcela, data_vencimento, valor, valor_estimado, situacao")
    .in("compromisso_id", [...descricoes.keys()])
    .not("ano_referencia", "is", null)
    .neq("status", "cancelado")
    .order("data_vencimento");
  if (filtro.ano) consultaParcelas = consultaParcelas.eq("ano_referencia", filtro.ano);
  const { data: linhas, error: erroParcelas } = await consultaParcelas;
  if (erroParcelas) throw erroParcelas;

  return agruparCiclos(linhas as Linha[], descricoes);
}

/** Para cada conta anual ativa, o próximo ano que ainda tem algo a pagar. */
export async function listarProximosCiclosAnuais(): Promise<CicloAnual[]> {
  const ciclos = await buscarCiclos({});
  const proximo = new Map<string, CicloAnual>();
  for (const ciclo of ciclos.sort((a, b) => a.ano - b.ano)) {
    const temPendente = ciclo.parcelas.some((p) => p.situacao === "pendente" || p.situacao === "atrasado");
    if (temPendente && !proximo.has(ciclo.compromissoId)) proximo.set(ciclo.compromissoId, ciclo);
  }
  return [...proximo.values()].sort((a, b) => a.primeiroVencimento.localeCompare(b.primeiroVencimento));
}

export async function obterCicloAnual(compromissoId: string, ano: number): Promise<CicloAnual | null> {
  const [ciclo] = await buscarCiclos({ compromissoId, ano });
  return ciclo ?? null;
}
