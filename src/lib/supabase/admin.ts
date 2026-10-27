import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Cliente com a chave secreta: ignora o RLS. Use só em tarefas do servidor que
// precisam ver todos os usuários (o envio agendado de notificações), nunca a partir
// de algo que o usuário controle diretamente.
export function createAdminClient() {
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!chave) throw new Error("SUPABASE_SECRET_KEY não configurada");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
