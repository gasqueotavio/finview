import { z } from "zod";
import { FREQUENCIAS, TIPOS_COMPROMISSO, type Frequencia, type TipoCompromisso } from "@/lib/catalogo";

const opcional = (v: unknown) => (v === "" || v === null ? undefined : v);

// Aceita "1.234,56", "1234,56", "1.234" (milhar) e "1234.56".
export const paraNumero = (s: string) => {
  if (s.includes(",") || /^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s);
};

// Como valorEmReais, mas aceita zero (saldo devedor já quitado).
export const saldoEmReais = z
  .string()
  .trim()
  .min(1, "Informe o saldo")
  .transform(paraNumero)
  .pipe(z.number({ error: "Valor inválido" }).min(0, "O saldo não pode ser negativo").max(999_999_999_999))
  .transform((n) => Math.round(n * 100) / 100);

export const TAXA_OBRIGATORIA = "Informe a taxa de juros ao mês (está no contrato ou no app do banco). Sem juros? Digite 0.";

// Taxa de juros ao mês, em %: aceita "1,49", "1.49" ou "1,49%".
export const taxaMensal = z
  .string()
  .trim()
  .transform((s) => Number(s.replace("%", "").replace(",", ".")))
  .pipe(z.number({ error: "Taxa inválida" }).min(0, "A taxa não pode ser negativa").max(20, "Confira a taxa: use o valor ao mês (ex.: 1,49)"));

export const valorEmReais = z
  .string()
  .trim()
  .min(1, "Informe o valor")
  .transform(paraNumero)
  .pipe(z.number({ error: "Valor inválido" }).positive("O valor deve ser maior que zero").max(999_999_999_999))
  .transform((n) => Math.round(n * 100) / 100);

export const compromissoSchema = z
  .object({
    modelo: z.preprocess(opcional, z.string().max(64).optional()),
    descricao: z.string().trim().min(1, "Informe uma descrição").max(120),
    categoriaId: z.preprocess(opcional, z.uuid().optional()),
    tipo: z.enum(Object.keys(TIPOS_COMPROMISSO) as [TipoCompromisso, ...TipoCompromisso[]]),
    frequencia: z.enum(Object.keys(FREQUENCIAS) as [Frequencia, ...Frequencia[]]),
    valor: valorEmReais,
    valorVariavel: z.preprocess((v) => v === "on", z.boolean()),
    totalParcelas: z.preprocess(opcional, z.coerce.number().int().min(1).max(600).optional()),
    primeiraParcela: z.preprocess(opcional, z.coerce.number().int().min(1).max(600).default(1)),
    parcelasPorAno: z.preprocess(opcional, z.coerce.number().int().min(1).max(12).default(1)),
    dataVencimentoInicial: z.iso.date("Informe a data do vencimento"),
    observacao: z.preprocess(opcional, z.string().trim().max(500).optional()),
    // Saldo que o banco informa hoje (financiamento, consórcio...). Opcional.
    saldoDevedor: z.preprocess(opcional, saldoEmReais.optional()),
    taxaJuros: z.preprocess(opcional, taxaMensal.optional()),
  })
  .superRefine((d, ctx) => {
    if (TIPOS_COMPROMISSO[d.tipo].exigeTaxa && d.taxaJuros === undefined) {
      ctx.addIssue({ code: "custom", path: ["taxaJuros"], message: TAXA_OBRIGATORIA });
    }
    if (!TIPOS_COMPROMISSO[d.tipo].temPrazo) return;
    if (!d.totalParcelas) {
      // Sem o total, dá para estimar pelo saldo; sem nenhum dos dois, não.
      if (d.saldoDevedor === undefined) {
        ctx.addIssue({ code: "custom", path: ["totalParcelas"], message: "Informe o total de parcelas ou o saldo devedor" });
      }
    } else if (d.primeiraParcela > d.totalParcelas) {
      ctx.addIssue({ code: "custom", path: ["primeiraParcela"], message: "Não pode ser maior que o total de parcelas" });
    }
  });

// Plano de um ano de conta anual (o carnê chegou: cota única ou parcelado).
const basePlano = {
  compromissoId: z.uuid(),
  ano: z.coerce.number().int().min(2000).max(2200),
};

export const planoAnoSchema = z
  .discriminatedUnion("escolha", [
    z.object({
      ...basePlano,
      escolha: z.literal("cota_unica"),
      valorCotaUnica: valorEmReais,
      dataCotaUnica: z.iso.date("Informe o vencimento"),
    }),
    z.object({
      ...basePlano,
      escolha: z.literal("parcelado"),
      valorParcelado: valorEmReais,
      parcelas: z.coerce.number().int().min(2, "Mínimo de 2 parcelas").max(12, "Máximo de 12 parcelas"),
      dataPrimeiraParcela: z.iso.date("Informe o vencimento"),
    }),
  ])
  .superRefine((d, ctx) => {
    const [campo, data] =
      d.escolha === "cota_unica" ? ["dataCotaUnica", d.dataCotaUnica] : ["dataPrimeiraParcela", d.dataPrimeiraParcela];
    if (Number(data.slice(0, 4)) !== d.ano) {
      ctx.addIssue({ code: "custom", path: [campo], message: `O vencimento precisa ser em ${d.ano}` });
    }
  });

// Edição: só o que não mexe no cronograma. Conta anual não manda "valor" (tem planejamento por ano).
export const edicaoCompromissoSchema = z.object({
  id: z.uuid(),
  descricao: z.string().trim().min(1, "Informe uma descrição").max(120),
  categoriaId: z.preprocess(opcional, z.uuid().optional()),
  valor: z.preprocess(opcional, valorEmReais.optional()),
  valorVariavel: z.preprocess((v) => v === "on", z.boolean()),
  observacao: z.preprocess(opcional, z.string().trim().max(500).optional()),
  saldoDevedor: z.preprocess(opcional, saldoEmReais.optional()),
  // Valor mostrado no formulário ao abrir: só grava se a pessoa mudou.
  saldoOriginal: z.preprocess(opcional, saldoEmReais.optional()),
  taxaJuros: z.preprocess(opcional, taxaMensal.optional()),
  taxaOriginal: z.preprocess(opcional, taxaMensal.optional()),
});
