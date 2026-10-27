import { z } from "zod";
import { valorEmReais } from "@/lib/validations/compromisso";

const opcional = (v: unknown) => (v === "" || v === null ? undefined : v);

export const pagamentoSchema = z.object({
  id: z.uuid(),
  valorPago: valorEmReais,
  dataPagamento: z.iso.date("Informe a data do pagamento"),
});

export const valorRealSchema = z.object({
  id: z.uuid(),
  valor: valorEmReais,
});

export const avulsoSchema = z
  .object({
    descricao: z.string().trim().min(1, "Informe uma descrição").max(120),
    categoriaId: z.preprocess(opcional, z.uuid().optional()),
    valor: valorEmReais,
    dataVencimento: z.iso.date("Informe a data"),
    jaPago: z.preprocess((v) => v === "on", z.boolean()),
    dataPagamento: z.preprocess(opcional, z.iso.date().optional()),
    observacao: z.preprocess(opcional, z.string().trim().max(500).optional()),
  })
  .transform((d) => ({ ...d, dataPagamento: d.jaPago ? (d.dataPagamento ?? d.dataVencimento) : undefined }));

export const quitacaoSchema = z.object({
  compromissoId: z.uuid(),
  valor: valorEmReais,
  data: z.iso.date("Informe a data da quitação"),
});

export const edicaoAvulsoSchema = z.object({
  id: z.uuid(),
  descricao: z.string().trim().min(1, "Informe uma descrição").max(120),
  categoriaId: z.preprocess(opcional, z.uuid().optional()),
  valor: valorEmReais,
  data: z.iso.date("Informe a data"),
  observacao: z.preprocess(opcional, z.string().trim().max(500).optional()),
});
