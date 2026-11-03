import { z } from "zod";
import { CATEGORIAS_PADRAO, type ChaveCategoria } from "@/lib/catalogo";

export const CHAVES_CATEGORIA = CATEGORIAS_PADRAO.map((c) => c.chave) as [ChaveCategoria, ...ChaveCategoria[]];

/**
 * Resposta da IA ao ler um boleto ou conta. O Gemini já recebe um schema equivalente
 * (saída estruturada), mas a resposta é validada de novo aqui: se algo não bater,
 * a leitura é tratada como "não consegui ler" em vez de chegar errada ao formulário.
 */
export const leituraBoletoSchema = z
  .object({
    // Beneficiário ou empresa que cobra.
    descricao: z.string().trim().min(1).max(120).nullable(),
    // Em reais. Boleto de valor zero ou negativo não faz sentido para pagar.
    valor: z.number().positive().max(999_999_999).nullable(),
    vencimento: z.iso.date().nullable(),
    categoria: z.enum(CHAVES_CATEGORIA).nullable(),
    // Até 48 dígitos, com pontos e espaços do jeito que vem impresso.
    linha_digitavel: z.string().trim().min(1).max(80).nullable(),
    parece_recorrente: z.boolean(),
    confianca: z.enum(["alta", "media", "baixa"]),
  })
  .strict();

export type LeituraBoleto = z.infer<typeof leituraBoletoSchema>;
