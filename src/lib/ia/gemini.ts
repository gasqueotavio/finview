import "server-only";
import { GoogleGenAI } from "@google/genai";

// Modelo "flash" do plano gratuito do Google AI Studio. Pode ser trocado por GEMINI_MODEL
// quando o Google lançar outro (lista atual: https://aistudio.google.com/docs/models).
export const MODELO_PADRAO = "gemini-3.6-flash";

/** A leitura com IA só existe quando a chave está configurada (o botão nem aparece sem ela). */
export function iaConfigurada() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function modeloConfigurado() {
  return process.env.GEMINI_MODEL?.trim() || MODELO_PADRAO;
}

/** Só a parte do SDK que o app usa: facilita trocar por um cliente falso nos testes. */
export type ClienteGemini = Pick<GoogleGenAI, "models">;

export function criarClienteGemini(): ClienteGemini | null {
  const apiKey = process.env.GEMINI_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}
