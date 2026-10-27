"use server";

import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EstadoExclusao = { mensagem?: string };

const CONFIRMACAO = "EXCLUIR";

/** LGPD, art. 18, VI: apaga a conta e, em cascata, todos os dados do usuário. */
export async function excluirConta(_prev: EstadoExclusao, formData: FormData): Promise<EstadoExclusao> {
  await getUsuario();
  if (String(formData.get("confirmacao") ?? "").trim().toUpperCase() !== CONFIRMACAO) {
    return { mensagem: `Digite ${CONFIRMACAO} para confirmar.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) return { mensagem: "Não foi possível excluir a conta. Tente novamente." };

  // O usuário já não existe; só limpa os cookies de sessão deste navegador.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?conta=excluida");
}
