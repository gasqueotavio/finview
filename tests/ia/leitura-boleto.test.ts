import { ApiError } from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { classificarErro, lerBoleto } from "@/lib/ia/boleto";
import { criarClienteGemini, iaConfigurada, modeloConfigurado } from "@/lib/ia/gemini";
import type { ClienteGemini } from "@/lib/ia/gemini";

// O que o teste confere do pedido enviado ao Gemini.
type Pedido = {
  model: string;
  contents: { inlineData?: { mimeType: string; data: string } }[];
  config: { responseMimeType: string; responseJsonSchema: unknown; systemInstruction: string };
};

// Nenhum teste chama o Gemini de verdade: o cliente é sempre um objeto falso.
function clienteFalso(resposta: () => Promise<{ text?: string }>) {
  const generateContent = vi.fn<(pedido: Pedido) => Promise<{ text?: string }>>(() => resposta());
  return { cliente: { models: { generateContent } } as unknown as ClienteGemini, generateContent };
}

const PDF = { bytes: new TextEncoder().encode("%PDF-1.7 boleto"), tipo: "application/pdf" as const };
const leitura = {
  descricao: "Copel",
  valor: 186.4,
  vencimento: "2026-11-10",
  categoria: "contas_consumo",
  linha_digitavel: null,
  parece_recorrente: true,
  confianca: "alta",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("leitura de boleto com o Gemini (cliente simulado)", () => {
  it("envia o arquivo com saída estruturada e devolve os dados validados", async () => {
    const { cliente, generateContent } = clienteFalso(async () => ({ text: JSON.stringify(leitura) }));
    const r = await lerBoleto(PDF, { cliente, modelo: "modelo-teste" });

    expect(r).toEqual({ ok: true, dados: leitura });
    const pedido = generateContent.mock.calls[0][0];
    expect(pedido.model).toBe("modelo-teste");
    expect(pedido.config.responseMimeType).toBe("application/json");
    expect(pedido.config.responseJsonSchema).toMatchObject({ type: "object" });
    expect(pedido.config.systemInstruction).toMatch(/Nunca invente/);
    // O arquivo vai inline, em base64, com o tipo detectado.
    expect(pedido.contents[0].inlineData).toEqual({ mimeType: "application/pdf", data: Buffer.from(PDF.bytes).toString("base64") });
  });

  it("resposta fora do schema vira 'não consegui ler'", async () => {
    const { cliente } = clienteFalso(async () => ({ text: JSON.stringify({ ...leitura, valor: -10 }) }));
    expect(await lerBoleto(PDF, { cliente, modelo: "m" })).toEqual({ ok: false, motivo: "ilegivel" });
  });

  it("JSON quebrado ou resposta vazia vira 'não consegui ler'", async () => {
    for (const text of ["{descricao: Copel", "", undefined]) {
      const { cliente } = clienteFalso(async () => ({ text }));
      expect(await lerBoleto(PDF, { cliente, modelo: "m" })).toEqual({ ok: false, motivo: "ilegivel" });
    }
  });

  it("documento sem quem cobra, valor e vencimento vira 'não consegui ler'", async () => {
    const vazio = { ...leitura, descricao: null, valor: null, vencimento: null, confianca: "baixa" };
    const { cliente } = clienteFalso(async () => ({ text: JSON.stringify(vazio) }));
    expect(await lerBoleto(PDF, { cliente, modelo: "m" })).toEqual({ ok: false, motivo: "ilegivel" });
  });

  it("cota esgotada (429) no Gemini", async () => {
    const { cliente } = clienteFalso(async () => {
      throw new ApiError({ message: "Resource exhausted", status: 429 });
    });
    expect(await lerBoleto(PDF, { cliente, modelo: "m" })).toEqual({ ok: false, motivo: "cota" });
  });

  it("classifica tempo esgotado, chave inválida e indisponibilidade", () => {
    expect(classificarErro(Object.assign(new Error("This operation was aborted"), { name: "AbortError" }))).toBe("tempo");
    expect(classificarErro(new ApiError({ message: "Deadline exceeded", status: 504 }))).toBe("tempo");
    expect(classificarErro(new ApiError({ message: "API key not valid. Please pass a valid API key.", status: 400 }))).toBe("chave");
    expect(classificarErro(new ApiError({ message: "Permission denied", status: 403 }))).toBe("chave");
    expect(classificarErro(new ApiError({ message: "Unable to process input image", status: 400 }))).toBe("ilegivel");
    expect(classificarErro(new ApiError({ message: "Internal error", status: 500 }))).toBe("indisponivel");
    expect(classificarErro("algo estranho")).toBe("indisponivel");
  });
});

describe("configuração", () => {
  it("sem GEMINI_API_KEY a leitura fica desligada", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(iaConfigurada()).toBe(false);
    expect(criarClienteGemini()).toBeNull();
  });

  it("GEMINI_MODEL troca o modelo; vazio usa o padrão", () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-teste-flash");
    expect(modeloConfigurado()).toBe("gemini-teste-flash");
    vi.stubEnv("GEMINI_MODEL", "  ");
    expect(modeloConfigurado()).toMatch(/flash/);
  });
});
