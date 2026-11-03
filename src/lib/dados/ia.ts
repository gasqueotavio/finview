import "server-only";
import { getUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** O usuário já aceitou enviar documentos ao Google Gemini para leitura? */
export async function consentiuLeituraIA(): Promise<boolean> {
  await getUsuario();
  const supabase = await createClient();
  const { data, error } = await supabase.from("ia_consentimentos").select("aceito_em").maybeSingle();
  if (error) throw error;
  return data !== null;
}
