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

// ---------------------------------------------------------------------------
// Tabela Price (parcela fixa): saldo = parcela × (1 − (1 + i)^−n) / i

/** Valor presente de n parcelas iguais à taxa i (ao mês, em fração: 0,015 = 1,5%). */
export function valorPresente(parcela: number, n: number, i: number) {
  return i === 0 ? parcela * n : (parcela * (1 - (1 + i) ** -n)) / i;
}

/**
 * Taxa mensal (em %) que faz n parcelas de `parcela` quitarem exatamente `saldo`.
 * Null quando não há juros a estimar (o saldo é maior ou igual à soma das parcelas).
 */
export function taxaImplicita(saldo: number, parcela: number, n: number): number | null {
  if (saldo <= 0 || parcela <= 0 || n <= 0 || saldo >= parcela * n) return null;
  // O valor presente cai conforme a taxa sobe: busca binária entre 0% e 20% ao mês.
  let baixo = 0;
  let alto = 0.2;
  if (valorPresente(parcela, n, alto) > saldo) return null; // juros acima de 20% a.m.: dado inconsistente
  for (let k = 0; k < 100; k++) {
    const meio = (baixo + alto) / 2;
    if (valorPresente(parcela, n, meio) > saldo) baixo = meio;
    else alto = meio;
  }
  return Math.round(((baixo + alto) / 2) * 100 * 100_000) / 100_000;
}

/** Quantas parcelas faltam para quitar `saldo` à taxa mensal (em %). Arredonda para cima. */
export function parcelasParaQuitar(saldo: number, parcela: number, taxaPercentual: number): number | null {
  if (saldo <= 0) return 0;
  const i = taxaPercentual / 100;
  if (i === 0) return Math.ceil(saldo / parcela - 1e-3);
  // Só os juros já consomem a parcela inteira: nunca quita.
  if (saldo * i >= parcela) return null;
  // Tolerância: centavos de arredondamento no saldo não devem criar uma parcela extra.
  return Math.ceil(-Math.log(1 - (saldo * i) / parcela) / Math.log(1 + i) - 1e-3);
}
