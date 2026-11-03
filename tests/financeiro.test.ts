import { describe, expect, it } from "vitest";
import { parcelasParaQuitar, taxaImplicita, valorPresente } from "@/lib/financeiro";

describe("Tabela Price", () => {
  it("valor presente de 12 parcelas de 1.000 a 1% a.m.", () => {
    expect(valorPresente(1000, 12, 0.01)).toBeCloseTo(11255.08, 2);
  });

  it("descobre a taxa embutida a partir do saldo, da parcela e do prazo", () => {
    expect(taxaImplicita(11255.08, 1000, 12)).toBeCloseTo(1, 3);
  });

  it("sem juros quando o saldo é igual à soma das parcelas", () => {
    expect(taxaImplicita(5000, 500, 10)).toBeNull();
  });

  it("calcula quantas parcelas faltam, com e sem juros", () => {
    expect(parcelasParaQuitar(11255.08, 1000, 1)).toBe(12);
    expect(parcelasParaQuitar(40000, 1200, 0)).toBe(34);
    expect(parcelasParaQuitar(40000, 1200, 1.2)).toBe(43);
  });

  it("não quita quando a parcela não cobre nem os juros do mês", () => {
    expect(parcelasParaQuitar(100000, 1000, 1.5)).toBeNull();
  });
});
