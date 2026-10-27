import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { decifrar } from "@/lib/crypto";
import { hojeEmBrasilia } from "@/lib/formato";
import { montarMensagem, type ContaAvisada, type TipoAviso } from "@/lib/notificacoes";
import { enviarPush } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

// Envio diário dos lembretes de vencimento. Chamado pelo cron da Vercel (vercel.json),
// que manda "Authorization: Bearer <CRON_SECRET>". Pode rodar mais de uma vez no dia:
// notificacoes_enviadas garante que a mesma conta não é avisada duas vezes.

function autorizado(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  const recebido = request.headers.get("authorization") ?? "";
  if (!segredo) return false;
  const esperado = Buffer.from(`Bearer ${segredo}`);
  const atual = Buffer.from(recebido);
  return atual.length === esperado.length && timingSafeEqual(atual, esperado);
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) return new Response("Não autorizado", { status: 401 });

  const hoje = hojeEmBrasilia();
  const supabase = createAdminClient();

  const { data: pendentes, error } = await supabase.rpc("notificacoes_do_dia", { p_hoje: hoje });
  if (error) return Response.json({ erro: "Falha ao buscar contas" }, { status: 500 });

  // Agrupa por pessoa: uma notificação por dia com todas as contas.
  const porUsuario = new Map<string, typeof pendentes>();
  for (const p of pendentes) porUsuario.set(p.user_id, [...(porUsuario.get(p.user_id) ?? []), p]);

  let enviadas = 0;
  let expiradas = 0;
  let falhas = 0;

  for (const [userId, contas] of porUsuario) {
    const { data: inscricoes, error: erroInscricoes } = await supabase
      .from("push_inscricoes")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (erroInscricoes || inscricoes.length === 0) continue;

    let avisos: ContaAvisada[];
    try {
      avisos = contas.map((c) => ({
        descricao: decifrar(c.descricao_enc, userId),
        valor: Number(c.valor),
        estimado: c.valor_estimado,
        vencimento: c.data_vencimento,
        tipo: c.tipo as TipoAviso,
      }));
    } catch {
      falhas++;
      continue;
    }
    const mensagem = montarMensagem(avisos, contas[0].mostrar_detalhes);

    let algumEntregue = false;
    for (const inscricao of inscricoes) {
      const resultado = await enviarPush(inscricao, mensagem);
      if (resultado === "ok") {
        algumEntregue = true;
        enviadas++;
      } else if (resultado === "expirada") {
        expiradas++;
        await supabase.from("push_inscricoes").delete().eq("id", inscricao.id);
      } else {
        falhas++;
      }
    }

    // Só marca como avisado se chegou em pelo menos um aparelho (senão tenta na próxima execução).
    if (algumEntregue) {
      await supabase.from("notificacoes_enviadas").upsert(
        contas.map((c) => ({ lancamento_id: c.lancamento_id, tipo: c.tipo, dia: hoje, user_id: userId })),
        { onConflict: "lancamento_id,tipo,dia", ignoreDuplicates: true },
      );
    }
  }

  // Histórico de avisos só serve para o dia; guarda 30 dias por segurança e limpa o resto.
  const limite = new Date(`${hoje}T00:00:00Z`);
  limite.setUTCDate(limite.getUTCDate() - 30);
  await supabase.from("notificacoes_enviadas").delete().lt("dia", limite.toISOString().slice(0, 10));

  return Response.json({ dia: hoje, pessoas: porUsuario.size, enviadas, expiradas, falhas });
}
