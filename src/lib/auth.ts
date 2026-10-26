import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Usuario = {
  id: string;
  email: string;
};

// Data Access Layer: único ponto que valida a sessão no servidor.
// getClaims() verifica a assinatura do JWT; getSession() não deve ser usado para autorização.
export async function getUsuario(): Promise<Usuario> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");
  return { id: data.claims.sub, email: String(data.claims.email ?? "") };
}
