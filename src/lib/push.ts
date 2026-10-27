import "server-only";
import webpush from "web-push";

export type InscricaoPush = { endpoint: string; p256dh: string; auth: string };

export type MensagemPush = {
  titulo: string;
  corpo: string;
  /** Página aberta ao tocar na notificação. */
  url: string;
  /** Notificações com a mesma tag se substituem em vez de empilhar. */
  tag: string;
};

let configurado = false;
function configurar() {
  if (configurado) return;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) throw new Error("Chaves VAPID não configuradas");
  // Contato do remetente exigido pelo protocolo (o mesmo canal público da Política de Privacidade).
  // Precisa ser mailto: ou https real: os servidores da Apple recusam "localhost".
  webpush.setVapidDetails("mailto:otavioscamattig@gmail.com", publica, privada);
  configurado = true;
}

/**
 * Envia para um navegador. Devolve "expirada" quando o navegador cancelou a inscrição
 * (o registro deve ser apagado), "ok" ou "falha" (erro temporário; tenta de novo outro dia).
 */
export async function enviarPush(inscricao: InscricaoPush, mensagem: MensagemPush): Promise<"ok" | "expirada" | "falha"> {
  configurar();
  try {
    await webpush.sendNotification(
      { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
      JSON.stringify(mensagem),
      // Lembrete de vencimento perde o sentido depois de um dia.
      { TTL: 60 * 60 * 24, urgency: "normal" },
    );
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "expirada" : "falha";
  }
}
