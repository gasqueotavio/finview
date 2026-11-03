import { describe, expect, it } from "vitest";
import { leituraBoletoSchema } from "@/lib/validations/boleto";

const valida = {
  descricao: "Copel",
  valor: 186.4,
  vencimento: "2026-11-10",
  categoria: "contas_consumo",
  linha_digitavel: "83640000001 1 86400097000 0 12345678901 2 34567890123 4",
  parece_recorrente: true,
  confianca: "alta",
};

describe("schema da leitura de boleto", () => {
  it("aceita uma leitura completa", () => {
    expect(leituraBoletoSchema.safeParse(valida).success).toBe(true);
  });

  it("aceita campos não encontrados como null", () => {
    const r = leituraBoletoSchema.safeParse({ ...valida, valor: null, vencimento: null, categoria: null, linha_digitavel: null });
    expect(r.success).toBe(true);
  });

  it("recusa valor negativo ou zero", () => {
    expect(leituraBoletoSchema.safeParse({ ...valida, valor: -50 }).success).toBe(false);
    expect(leituraBoletoSchema.safeParse({ ...valida, valor: 0 }).success).toBe(false);
  });

  it("recusa data inválida ou fora do formato AAAA-MM-DD", () => {
    for (const vencimento of ["2026-13-40", "2026-02-30", "10/11/2026", "amanhã"]) {
      expect(leituraBoletoSchema.safeParse({ ...valida, vencimento }).success, vencimento).toBe(false);
    }
  });

  it("recusa categoria que não existe no catálogo", () => {
    expect(leituraBoletoSchema.safeParse({ ...valida, categoria: "cassino" }).success).toBe(false);
  });

  it("recusa confiança fora das opções e campos a mais", () => {
    expect(leituraBoletoSchema.safeParse({ ...valida, confianca: "total" }).success).toBe(false);
    expect(leituraBoletoSchema.safeParse({ ...valida, cpf: "123" }).success).toBe(false);
  });

  it("recusa campos obrigatórios ausentes", () => {
    const semRecorrente: Partial<typeof valida> = { ...valida };
    delete semRecorrente.parece_recorrente;
    expect(leituraBoletoSchema.safeParse(semRecorrente).success).toBe(false);
  });
});
