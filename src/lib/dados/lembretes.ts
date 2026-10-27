import "server-only";
import { getUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PreferenciasNotificacao = {
  noDia: boolean;
  umDiaAntes: boolean;
  tresDiasAntes: boolean;
  atrasadas: boolean;
  mostrarDetalhes: boolean;
};

export type Aparelho = { endpoint: string; dispositivo: string | null; criadoEm: string };

export type Lembretes = {
  preferencias: PreferenciasNotificacao;
  aparelhos: Aparelho[];
  /** Data em que o link de agenda atual foi criado; null se não há link ativo. */
  agendaCriadaEm: string | null;
};

export async function obterLembretes(): Promise<Lembretes> {
  await getUsuario();
  const supabase = await createClient();

  const [prefs, aparelhos, agenda] = await Promise.all([
    supabase.from("notificacao_preferencias").select("no_dia, um_dia_antes, tres_dias_antes, atrasadas, mostrar_detalhes").maybeSingle(),
    supabase.from("push_inscricoes").select("endpoint, dispositivo, criado_em").order("criado_em"),
    supabase.from("agenda_links").select("criado_em").maybeSingle(),
  ]);
  if (prefs.error) throw prefs.error;
  if (aparelhos.error) throw aparelhos.error;
  if (agenda.error) throw agenda.error;

  const p = prefs.data;
  return {
    // Sem registro ainda: os padrões do banco (tudo ligado).
    preferencias: {
      noDia: p?.no_dia ?? true,
      umDiaAntes: p?.um_dia_antes ?? true,
      tresDiasAntes: p?.tres_dias_antes ?? true,
      atrasadas: p?.atrasadas ?? true,
      mostrarDetalhes: p?.mostrar_detalhes ?? true,
    },
    aparelhos: aparelhos.data.map((a) => ({ endpoint: a.endpoint, dispositivo: a.dispositivo, criadoEm: a.criado_em })),
    agendaCriadaEm: agenda.data?.criado_em ?? null,
  };
}
