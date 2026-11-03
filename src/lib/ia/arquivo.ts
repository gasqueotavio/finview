import "server-only";

// Arquivos aceitos para a leitura com IA. O tipo é conferido pelos primeiros bytes do
// conteúdo ("magic bytes"), não pela extensão nem pelo tipo que o navegador informa,
// que são fáceis de falsificar.

export const TIPOS_ACEITOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export type TipoAceito = (typeof TIPOS_ACEITOS)[number];

export const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

const comeca = (bytes: Uint8Array, assinatura: number[], deslocamento = 0) =>
  bytes.length >= deslocamento + assinatura.length && assinatura.every((b, i) => bytes[deslocamento + i] === b);

const ascii = (texto: string) => [...texto].map((c) => c.charCodeAt(0));

/** Descobre o tipo real pelo conteúdo. Null se não for um dos aceitos. */
export function detectarTipo(bytes: Uint8Array): TipoAceito | null {
  if (comeca(bytes, ascii("%PDF-"))) return "application/pdf";
  if (comeca(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (comeca(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP: "RIFF" + 4 bytes de tamanho + "WEBP"
  if (comeca(bytes, ascii("RIFF")) && comeca(bytes, ascii("WEBP"), 8)) return "image/webp";
  return null;
}

export type ArquivoValidado = { ok: true; tipo: TipoAceito } | { ok: false; mensagem: string };

export function validarArquivo(bytes: Uint8Array): ArquivoValidado {
  if (bytes.length === 0) return { ok: false, mensagem: "O arquivo está vazio." };
  if (bytes.length > TAMANHO_MAXIMO) return { ok: false, mensagem: "O arquivo passa de 5 MB. Envie uma foto ou um PDF menor." };
  const tipo = detectarTipo(bytes);
  if (!tipo) return { ok: false, mensagem: "Formato não aceito. Envie um PDF ou uma foto (JPG, PNG ou WebP)." };
  return { ok: true, tipo };
}
