import { describe, expect, it } from "vitest";
import { TAMANHO_MAXIMO, detectarTipo, validarArquivo } from "@/lib/ia/arquivo";

const bytes = (...partes: (number[] | string)[]) =>
  new Uint8Array(partes.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

const PDF = bytes("%PDF-1.7\n", [0, 1, 2]);
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], [0, 0, 0, 13]);
const WEBP = bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 ");

describe("validação do arquivo enviado", () => {
  it("reconhece PDF, JPEG, PNG e WebP pelo conteúdo", () => {
    expect(detectarTipo(PDF)).toBe("application/pdf");
    expect(detectarTipo(JPEG)).toBe("image/jpeg");
    expect(detectarTipo(PNG)).toBe("image/png");
    expect(detectarTipo(WEBP)).toBe("image/webp");
  });

  it("recusa outros formatos, mesmo que tenham extensão de PDF", () => {
    // Um .exe renomeado para boleto.pdf começa com "MZ"
    expect(validarArquivo(bytes("MZ", [0x90, 0, 3, 0])).ok).toBe(false);
    expect(validarArquivo(bytes("GIF89a")).ok).toBe(false);
    expect(validarArquivo(bytes("<html><script>")).ok).toBe(false);
    // "RIFF" de áudio WAV não é WebP
    expect(validarArquivo(bytes("RIFF", [0x24, 0, 0, 0], "WAVEfmt ")).ok).toBe(false);
  });

  it("recusa arquivo vazio", () => {
    expect(validarArquivo(new Uint8Array()).ok).toBe(false);
  });

  it("aceita até 5 MB e recusa acima disso", () => {
    const noLimite = new Uint8Array(TAMANHO_MAXIMO);
    noLimite.set(PDF);
    expect(validarArquivo(noLimite)).toEqual({ ok: true, tipo: "application/pdf" });

    const grande = new Uint8Array(TAMANHO_MAXIMO + 1);
    grande.set(PDF);
    const r = validarArquivo(grande);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.mensagem).toMatch(/5 MB/);
  });
});
