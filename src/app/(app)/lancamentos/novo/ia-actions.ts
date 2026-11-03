"use server";

import { getUsuario } from "@/lib/auth";
import { listarCategorias } from "@/lib/dados/categorias";
import { consentiuLeituraIA } from "@/lib/dados/ia";
import { TAMANHO_MAXIMO, validarArquivo } from "@/lib/ia/arquivo";
import { MENSAGENS, lerBoleto, type MotivoFalha } from "@/lib/ia/boleto";
import { criarClienteGemini, iaConfigurada, modeloConfigurado } from "@/lib/ia/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SugestaoIA } from "./sugestao";

export type ResultadoLeituraIA =
  | { ok: true; sugestao: SugestaoIA; restantes: number }
  | { ok: false; mensagem: string; precisaConsentimento?: boolean };

/** Registra o aceite do aviso de envio ao Google Gemini (uma vez por conta). */
export async function aceitarLeituraIA(): Promise<{ ok: boolean }> {
  const usuario = await getUsuario();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ia_consentimentos")
    .upsert({ user_id: usuario.id }, { onConflict: "user_id", ignoreDuplicates: true });
  return { ok: !error };
}

// Falhas do lado do provedor não devem gastar a cota diária do usuário.
const FALHAS_DO_PROVEDOR: MotivoFalha[] = ["cota", "tempo", "indisponivel", "chave"];

/**
 * Lê um boleto/conta com o Gemini e devolve os campos para o formulário.
 * Nada é gravado aqui: a pessoa confere e salva pelo fluxo normal (com criptografia).
 * O arquivo fica só na memória desta requisição; não vai para o Storage, disco nem log.
 */
export async function lerBoletoComIA(formData: FormData): Promise<ResultadoLeituraIA> {
  const usuario = await getUsuario();
  if (!iaConfigurada()) return { ok: false, mensagem: "A leitura com IA não está disponível." };
  if (!(await consentiuLeituraIA())) {
    return { ok: false, mensagem: "Antes, aceite o aviso sobre o envio ao Google Gemini.", precisaConsentimento: true };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) return { ok: false, mensagem: "Escolha um arquivo para ler." };
  // Confere o tamanho antes de carregar o conteúdo na memória.
  if (arquivo.size > TAMANHO_MAXIMO) return { ok: false, mensagem: "O arquivo passa de 5 MB. Envie uma foto ou um PDF menor." };

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const validado = validarArquivo(bytes);
  if (!validado.ok) return { ok: false, mensagem: validado.mensagem };

  const cliente = criarClienteGemini();
  if (!cliente) return { ok: false, mensagem: MENSAGENS.chave };

  const supabase = await createClient();
  const { data: restantes, error: erroCota } = await supabase.rpc("consumir_leitura_ia");
  if (erroCota) return { ok: false, mensagem: "Não foi possível verificar seu limite de leituras. Tente de novo." };
  if (restantes < 0) return { ok: false, mensagem: "Você já usou as 10 leituras com IA de hoje. Amanhã libera de novo." };

  const resultado = await lerBoleto({ bytes, tipo: validado.tipo }, { cliente, modelo: modeloConfigurado() });

  if (!resultado.ok) {
    if (FALHAS_DO_PROVEDOR.includes(resultado.motivo)) await devolverLeitura(usuario.id);
    return { ok: false, mensagem: MENSAGENS[resultado.motivo] };
  }

  const d = resultado.dados;
  const categoria = d.categoria ? (await listarCategorias()).find((c) => c.chave === d.categoria) : undefined;

  return {
    ok: true,
    restantes,
    sugestao: {
      descricao: d.descricao,
      valor: d.valor,
      vencimento: d.vencimento,
      categoriaId: categoria?.id ?? null,
      linhaDigitavel: d.linha_digitavel,
      pareceRecorrente: d.parece_recorrente,
      confianca: d.confianca,
    },
  };
}

// Precisa da chave secreta (a função só aceita o servidor). Sem ela, a leitura
// simplesmente fica contada: melhor do que falhar a resposta ao usuário.
async function devolverLeitura(userId: string) {
  try {
    await createAdminClient().rpc("devolver_leitura_ia", { p_user_id: userId });
  } catch {
    // SUPABASE_SECRET_KEY ausente: ignora.
  }
}
