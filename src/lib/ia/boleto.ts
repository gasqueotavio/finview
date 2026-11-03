import "server-only";
import { ApiError, createPartFromBase64 } from "@google/genai";
import { CHAVES_CATEGORIA, leituraBoletoSchema, type LeituraBoleto } from "@/lib/validations/boleto";
import type { TipoAceito } from "./arquivo";
import type { ClienteGemini } from "./gemini";

const INSTRUCOES = `Você lê boletos, faturas e contas brasileiras (luz, água, internet, aluguel, condomínio, cartão, impostos, escola, plano de saúde etc.) e extrai os dados para um app de controle financeiro.

Regras:
- Extraia só o que está escrito no documento. Nunca invente, estime ou complete valores, datas ou nomes.
- Se um campo não aparecer ou não estiver legível, devolva null nesse campo.
- descricao: o nome de quem cobra (beneficiário, cedente ou empresa), curto, como "Copel" ou "Condomínio Ed. Aurora".
- valor: o valor a pagar ("valor do documento" ou "total a pagar"), em reais, como número com ponto decimal (ex.: 1234.56). Não use o valor de juros, multa ou desconto isolados.
- vencimento: a data de vencimento no formato AAAA-MM-DD.
- categoria: escolha a chave que melhor descreve a conta: ${CHAVES_CATEGORIA.join(", ")}. Use null se nenhuma servir.
- linha_digitavel: a linha digitável ou o código de barras numérico, exatamente como impresso; null se não houver.
- parece_recorrente: true para contas que chegam todo mês (luz, água, gás, internet, telefone, aluguel, condomínio, mensalidade, plano, assinatura, fatura de cartão); false para cobranças avulsas.
- confianca: "alta" se o documento estava nítido e os campos principais foram lidos com certeza; "media" se algum campo estava difícil de ler; "baixa" se o documento não parece um boleto ou conta, ou se quase nada foi lido.`;

// Mesmo formato do leituraBoletoSchema, no subconjunto de JSON Schema aceito pela
// saída estruturada do Gemini (campos que podem faltar aceitam null).
const SCHEMA_RESPOSTA = {
  type: "object",
  properties: {
    descricao: { type: ["string", "null"], description: "Beneficiário ou empresa que cobra" },
    valor: { type: ["number", "null"], description: "Valor a pagar, em reais" },
    vencimento: { type: ["string", "null"], format: "date", description: "Data de vencimento (AAAA-MM-DD)" },
    categoria: { anyOf: [{ type: "string", enum: CHAVES_CATEGORIA }, { type: "null" }] },
    linha_digitavel: { type: ["string", "null"] },
    parece_recorrente: { type: "boolean" },
    confianca: { type: "string", enum: ["alta", "media", "baixa"] },
  },
  required: ["descricao", "valor", "vencimento", "categoria", "linha_digitavel", "parece_recorrente", "confianca"],
  additionalProperties: false,
};

/** Por que a leitura falhou: cada motivo vira uma mensagem diferente para o usuário. */
export type MotivoFalha = "cota" | "tempo" | "chave" | "ilegivel" | "indisponivel";

export type ResultadoLeitura = { ok: true; dados: LeituraBoleto } | { ok: false; motivo: MotivoFalha };

const TEMPO_POR_TENTATIVA_MS = 25_000;
const TEMPO_TOTAL_MS = 45_000;

export async function lerBoleto(
  arquivo: { bytes: Uint8Array; tipo: TipoAceito },
  opcoes: { cliente: ClienteGemini; modelo: string },
): Promise<ResultadoLeitura> {
  let texto: string | undefined;
  try {
    const resposta = await opcoes.cliente.models.generateContent({
      model: opcoes.modelo,
      contents: [
        createPartFromBase64(Buffer.from(arquivo.bytes).toString("base64"), arquivo.tipo),
        { text: "Extraia os dados deste documento." },
      ],
      config: {
        systemInstruction: INSTRUCOES,
        responseMimeType: "application/json",
        responseJsonSchema: SCHEMA_RESPOSTA,
        temperature: 0,
        abortSignal: AbortSignal.timeout(TEMPO_TOTAL_MS),
        httpOptions: {
          timeout: TEMPO_POR_TENTATIVA_MS,
          // Só repete falhas passageiras do servidor; cota esgotada (429) não adianta repetir.
          retryOptions: { attempts: 2, httpStatusCodes: [500, 502, 503, 504] },
        },
      },
    });
    texto = resposta.text;
  } catch (erro) {
    return { ok: false, motivo: classificarErro(erro) };
  }

  return interpretarResposta(texto);
}

/** Valida o JSON devolvido pelo modelo. Exportada para os testes. */
export function interpretarResposta(texto: string | undefined): ResultadoLeitura {
  if (!texto) return { ok: false, motivo: "ilegivel" };
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: "ilegivel" };
  }

  const parsed = leituraBoletoSchema.safeParse(json);
  if (!parsed.success) return { ok: false, motivo: "ilegivel" };

  // Sem quem cobra, quanto e quando, não há o que preencher.
  const d = parsed.data;
  if (d.descricao === null && d.valor === null && d.vencimento === null) return { ok: false, motivo: "ilegivel" };
  return { ok: true, dados: d };
}

export function classificarErro(erro: unknown): MotivoFalha {
  if (erro instanceof ApiError) {
    if (erro.status === 429) return "cota";
    if (erro.status === 408 || erro.status === 504) return "tempo";
    if (erro.status === 401 || erro.status === 403) return "chave";
    if (erro.status === 400 && /api key/i.test(erro.message)) return "chave";
    // Arquivo que o modelo não consegue processar (PDF corrompido, protegido por senha...).
    if (erro.status === 400) return "ilegivel";
    return "indisponivel";
  }
  if (erro instanceof Error && (erro.name === "AbortError" || erro.name === "TimeoutError" || /abort|timed? ?out/i.test(erro.message))) {
    return "tempo";
  }
  return "indisponivel";
}

export const MENSAGENS: Record<MotivoFalha, string> = {
  cota: "A leitura com IA está sobrecarregada agora (limite gratuito do Google). Tente de novo em alguns minutos.",
  tempo: "A leitura demorou demais. Tente de novo; se continuar, envie uma foto mais nítida ou um PDF menor.",
  chave: "A leitura com IA não está configurada corretamente. Avise o suporte.",
  ilegivel: "Não consegui ler esse documento. Confira se é um boleto ou conta e se a foto está nítida, ou preencha à mão.",
  indisponivel: "A leitura com IA não respondeu. Tente de novo em instantes.",
};
