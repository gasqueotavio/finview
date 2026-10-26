// Cálculos financeiros puros (rodam no servidor e no navegador).

export type Pagamento = { data: string; valor: number };

const MS_DIA = 86_400_000;

function paraData(iso: string) {
  return new Date(`${iso}T00:00:00Z`);
}

function dias(de: string, ate: string) {
  return Math.round((paraData(ate).getTime() - paraData(de).getTime()) / MS_DIA);
}

/** Soma meses a uma data "AAAA-MM-DD", ajustando para o último dia do mês (31/01 + 1 = 28/02), como o Postgres. */
export function somarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

/** Mesma divisão de public.valor_da_parcela: a diferença dos centavos vai para a 1ª parcela. */
export function dividirEmParcelas(total: number, parcelas: number, primeiroVencimento: string): Pagamento[] {
  const totalCentavos = Math.round(total * 100);
  const base = Math.trunc(totalCentavos / parcelas);
  return Array.from({ length: parcelas }, (_, i) => ({
    data: somarMeses(primeiroVencimento, i),
    valor: (i === 0 ? totalCentavos - base * (parcelas - 1) : base) / 100,
  }));
}

export type ComparacaoCotaUnica = {
  /** Quanto as parcelas valem hoje (na data da cota única), descontando o que o dinheiro renderia. */
  valorPresenteParcelado: number;
  /** Positivo: a cota única economiza esse valor. Negativo: parcelar é melhor. */
  economiaCotaUnica: number;
  melhor: "cota_unica" | "parcelado" | "empate";
};

/**
 * Compara pagar à vista com desconto contra parcelar e deixar o dinheiro rendendo
 * até cada vencimento. rendimentoAnual em % ao ano (líquido de IR, idealmente).
 */
export function compararCotaUnica(
  cotaUnica: Pagamento,
  parcelas: Pagamento[],
  rendimentoAnual: number,
): ComparacaoCotaUnica {
  const taxaDia = Math.pow(1 + rendimentoAnual / 100, 1 / 365) - 1;
  const valorPresenteParcelado = parcelas.reduce(
    (soma, p) => soma + p.valor / Math.pow(1 + taxaDia, dias(cotaUnica.data, p.data)),
    0,
  );
  const economiaCotaUnica = Math.round((valorPresenteParcelado - cotaUnica.valor) * 100) / 100;
  const melhor = Math.abs(economiaCotaUnica) < 1 ? "empate" : economiaCotaUnica > 0 ? "cota_unica" : "parcelado";
  return { valorPresenteParcelado: Math.round(valorPresenteParcelado * 100) / 100, economiaCotaUnica, melhor };
}

/** Quanto separar por mês, a partir de hoje, para ter o valor no vencimento. */
export function provisaoMensal(total: number, hoje: string, vencimento: string): { meses: number; porMes: number } {
  const [a1, m1] = hoje.split("-").map(Number);
  const [a2, m2] = vencimento.split("-").map(Number);
  const meses = Math.max(1, (a2 - a1) * 12 + (m2 - m1));
  return { meses, porMes: Math.ceil((total / meses) * 100) / 100 };
}
