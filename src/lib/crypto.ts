import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// Criptografia de campos sensíveis (descrições, observações, nomes de categoria).
//
// - AES-256-GCM: confidencialidade + integridade (qualquer alteração no texto cifrado é detectada).
// - Uma chave por usuário, derivada via HKDF da chave mestra + user_id: um texto cifrado
//   copiado para a conta de outro usuário não decifra.
// - Formato: "v1.<iv>.<tag>.<dados>" em base64url. O prefixo de versão permite rotacionar
//   a chave mestra no futuro sem quebrar os dados antigos.

const VERSAO = "v1";
const IV_BYTES = 12;

function chaveMestra(): Buffer {
  const raw = process.env.FINVIEW_ENCRYPTION_KEY;
  if (!raw) throw new Error("FINVIEW_ENCRYPTION_KEY não configurada");
  const chave = Buffer.from(raw, "base64");
  if (chave.length !== 32) {
    throw new Error("FINVIEW_ENCRYPTION_KEY deve ter 32 bytes codificados em base64");
  }
  return chave;
}

function chaveDoUsuario(userId: string): Buffer {
  return Buffer.from(hkdfSync("sha256", chaveMestra(), userId, `finview:${VERSAO}`, 32));
}

export function cifrar(texto: string, userId: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", chaveDoUsuario(userId), iv);
  const dados = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSAO, iv.toString("base64url"), tag.toString("base64url"), dados.toString("base64url")].join(".");
}

export function decifrar(cifrado: string, userId: string): string {
  const [versao, iv, tag, dados] = cifrado.split(".");
  if (versao !== VERSAO || !iv || !tag || dados === undefined) {
    throw new Error("Texto cifrado em formato inválido");
  }
  const decipher = createDecipheriv("aes-256-gcm", chaveDoUsuario(userId), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dados, "base64url")), decipher.final()]).toString("utf8");
}

export function cifrarOpcional(texto: string | null | undefined, userId: string): string | null {
  return texto ? cifrar(texto, userId) : null;
}

export function decifrarOpcional(cifrado: string | null | undefined, userId: string): string | null {
  return cifrado ? decifrar(cifrado, userId) : null;
}
