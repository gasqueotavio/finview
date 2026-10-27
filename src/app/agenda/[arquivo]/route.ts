import type { NextRequest } from "next/server";
import { gerarIcs, hashDoToken } from "@/lib/agenda";
import { decifrar } from "@/lib/crypto";
import { createPublicClient } from "@/lib/supabase/publico";

// Link de agenda (.ics) assinado pelo Google Agenda, Apple Calendar, Outlook...
// Não usa sessão: quem tem o link vê as contas, por isso o token é longo e pode ser trocado.
export async function GET(_request: NextRequest, { params }: RouteContext<"/agenda/[arquivo]">) {
  const { arquivo } = await params;
  const token = /^([A-Za-z0-9_-]{43})\.ics$/.exec(arquivo)?.[1];
  if (!token) return new Response("Não encontrado", { status: 404 });

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("feed_agenda", { p_token_hash: hashDoToken(token) });
  if (error) return new Response("Erro ao gerar a agenda", { status: 500 });
  // Link trocado/desativado e conta sem lançamentos dão a mesma agenda vazia:
  // a resposta não revela se um token existe.

  const ics = gerarIcs(
    data.map((l) => ({
      id: l.lancamento_id,
      descricao: decifrar(l.descricao_enc, l.user_id),
      valor: Number(l.status === "pago" && l.valor_pago !== null ? l.valor_pago : l.valor),
      estimado: l.valor_estimado,
      paga: l.status === "pago",
      vencimento: l.data_vencimento,
    })),
    { siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "" },
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="finview.ics"',
      // Dado pessoal: sem cache compartilhado (CDN); o app de agenda pode guardar por 1h.
      "Cache-Control": "private, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
