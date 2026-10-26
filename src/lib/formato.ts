const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export function formatarMoeda(valor: number): string {
  return moeda.format(valor);
}

/** Data de hoje no fuso de Brasília, em "AAAA-MM-DD" (o servidor da Vercel roda em UTC). */
export function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Datas do banco chegam como "AAAA-MM-DD"; interpretamos em UTC para não mudar o dia.
export function formatarData(iso: string): string {
  return data.format(new Date(`${iso}T00:00:00Z`));
}

const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** Diferença em dias entre duas datas "AAAA-MM-DD" (positivo = `ate` no futuro). */
export function diasEntre(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000);
}

/** "Hoje", "Amanhã", "Ontem" ou "qui., 12 de nov." */
export function rotuloDoDia(iso: string, hoje: string): string {
  const d = diasEntre(hoje, iso);
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d === -1) return "Ontem";
  return diaDaSemana.format(new Date(`${iso}T00:00:00Z`)).replace(/\.,/, ",");
}

/** "Atrasada há 3 dias", "Vence hoje", "Vence em 5 dias"... */
export function prazoRelativo(vencimento: string, hoje: string): string {
  const d = diasEntre(hoje, vencimento);
  if (d < -1) return `Atrasada há ${-d} dias`;
  if (d === -1) return "Atrasada desde ontem";
  if (d === 0) return "Vence hoje";
  if (d === 1) return "Vence amanhã";
  if (d <= 7) return `Vence em ${d} dias`;
  return `Vence ${vencimento.slice(8, 10)}/${vencimento.slice(5, 7)}`;
}
