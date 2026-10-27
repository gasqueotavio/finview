"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { novoTokenAgenda } from "@/lib/agenda";
import { getUsuario } from "@/lib/auth";
import { enviarPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";

export type Resultado = { ok?: boolean; mensagem?: string };

// Formato de PushSubscription.toJSON() no navegador.
const inscricaoSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

export async function ativarNotificacoes(inscricao: unknown, dispositivo: string): Promise<Resultado> {
  await getUsuario();
  const parsed = inscricaoSchema.safeParse(inscricao);
  if (!parsed.success) return { mensagem: "Este navegador devolveu uma inscrição inválida." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_push", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
    p_dispositivo: dispositivo.slice(0, 120),
  });
  if (error) return { mensagem: "Não foi possível ativar as notificações." };

  refresh();
  return { ok: true };
}

export async function desativarNotificacoes(endpoint: string): Promise<Resultado> {
  await getUsuario();
  const supabase = await createClient();
  const { error } = await supabase.from("push_inscricoes").delete().eq("endpoint", endpoint);
  if (error) return { mensagem: "Não foi possível desativar." };
  refresh();
  return { ok: true };
}

export async function salvarPreferencias(_prev: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await getUsuario();
  const marcado = (campo: string) => formData.get(campo) === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("notificacao_preferencias").upsert({
    user_id: usuario.id,
    no_dia: marcado("no_dia"),
    um_dia_antes: marcado("um_dia_antes"),
    tres_dias_antes: marcado("tres_dias_antes"),
    atrasadas: marcado("atrasadas"),
    mostrar_detalhes: marcado("mostrar_detalhes"),
  });
  if (error) return { mensagem: "Não foi possível salvar." };

  refresh();
  return { ok: true };
}

/** Manda uma notificação de exemplo para todos os aparelhos ativados desta conta. */
export async function enviarTeste(): Promise<Resultado> {
  await getUsuario();
  const supabase = await createClient();
  const { data: inscricoes, error } = await supabase.from("push_inscricoes").select("id, endpoint, p256dh, auth");
  if (error) return { mensagem: "Não foi possível buscar seus aparelhos." };
  if (inscricoes.length === 0) return { mensagem: "Nenhum aparelho com notificações ativadas." };

  let entregues = 0;
  for (const inscricao of inscricoes) {
    const r = await enviarPush(inscricao, {
      titulo: "Tudo certo com as notificações",
      corpo: "É assim que o FinView vai lembrar você das contas a pagar.",
      url: "/dashboard",
      tag: "finview-teste",
    });
    if (r === "ok") entregues++;
    if (r === "expirada") await supabase.from("push_inscricoes").delete().eq("id", inscricao.id);
  }
  return entregues > 0
    ? { ok: true, mensagem: `Enviada para ${entregues} ${entregues === 1 ? "aparelho" : "aparelhos"}.` }
    : { mensagem: "Não foi possível entregar. Desative e ative de novo neste aparelho." };
}

/** Cria (ou troca) o link secreto da agenda. O token só aparece aqui, uma vez. */
export async function gerarLinkAgenda(): Promise<{ url?: string; mensagem?: string }> {
  const usuario = await getUsuario();
  const { token, hash } = novoTokenAgenda();

  const supabase = await createClient();
  const { error } = await supabase
    .from("agenda_links")
    .upsert({ user_id: usuario.id, token_hash: hash, criado_em: new Date().toISOString() });
  if (error) return { mensagem: "Não foi possível gerar o link." };

  refresh();
  return { url: `${process.env.NEXT_PUBLIC_SITE_URL}/agenda/${token}.ics` };
}

export async function desativarLinkAgenda(): Promise<Resultado> {
  const usuario = await getUsuario();
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_links").delete().eq("user_id", usuario.id);
  if (error) return { mensagem: "Não foi possível desativar o link." };
  refresh();
  return { ok: true };
}
