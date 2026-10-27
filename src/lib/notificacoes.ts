import { formatarMoeda } from "@/lib/formato";
import type { MensagemPush } from "@/lib/push";

export type TipoAviso = "atrasada" | "no_dia" | "um_dia" | "tres_dias";

export type ContaAvisada = {
  descricao: string;
  valor: number;
  estimado: boolean;
  vencimento: string; // AAAA-MM-DD
  tipo: TipoAviso;
};

const ORDEM: TipoAviso[] = ["atrasada", "no_dia", "um_dia", "tres_dias"];
const QUANDO: Record<TipoAviso, string> = {
  atrasada: "Atrasada",
  no_dia: "Hoje",
  um_dia: "Amanhã",
  tres_dias: "Em 3 dias",
};

const valor = (c: ContaAvisada) => `${c.estimado ? "≈ " : ""}${formatarMoeda(c.valor)}`;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Uma notificação por pessoa por dia, juntando todas as contas (evita uma enxurrada de avisos).
 * O título fala da mais urgente; o corpo lista as demais.
 */
export function montarMensagem(contas: ContaAvisada[], mostrarDetalhes: boolean): MensagemPush {
  const ordenadas = [...contas].sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo) || a.vencimento.localeCompare(b.vencimento));
  const urgente = ordenadas[0];
  const mes = urgente.vencimento.slice(0, 7);
  const base = { url: `/dashboard?mes=${mes}`, tag: "finview-vencimentos" };

  if (!mostrarDetalhes) {
    const partes = ORDEM.map((t) => [t, ordenadas.filter((c) => c.tipo === t).length] as const)
      .filter(([, n]) => n > 0)
      .map(([t, n]) => `${n} ${t === "atrasada" ? (n === 1 ? "atrasada" : "atrasadas") : QUANDO[t].toLowerCase()}`);
    return {
      ...base,
      titulo: `Você tem ${plural(ordenadas.length, "conta", "contas")} para pagar`,
      corpo: `${partes.join(" · ")}. Toque para ver.`,
    };
  }

  if (ordenadas.length === 1) {
    const frase: Record<TipoAviso, string> = {
      atrasada: "está atrasada",
      no_dia: "vence hoje",
      um_dia: "vence amanhã",
      tres_dias: "vence em 3 dias",
    };
    return { ...base, titulo: `${urgente.descricao} ${frase[urgente.tipo]}`, corpo: valor(urgente) };
  }

  const atrasadas = ordenadas.filter((c) => c.tipo === "atrasada").length;
  const aVencer = ordenadas.length - atrasadas;
  const titulo =
    atrasadas === 0
      ? `${plural(aVencer, "conta", "contas")} para pagar`
      : aVencer === 0
        ? plural(atrasadas, "conta atrasada", "contas atrasadas")
        : `${plural(atrasadas, "conta atrasada", "contas atrasadas")} e ${aVencer} a vencer`;

  // Notificações cortam texto longo: até 4 linhas e um "e mais N".
  const linhas = ordenadas.slice(0, 4).map((c) => `${QUANDO[c.tipo]}: ${c.descricao} · ${valor(c)}`);
  if (ordenadas.length > 4) linhas.push(`e mais ${ordenadas.length - 4}`);
  return { ...base, titulo, corpo: linhas.join("\n") };
}
