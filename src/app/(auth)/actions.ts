"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { garantirCategoriasPadrao } from "@/lib/dados/categorias";
import { createClient } from "@/lib/supabase/server";
import { cadastroSchema, esqueciSenhaSchema, loginSchema, novaSenhaSchema } from "@/lib/validations/auth";

export type EstadoForm = {
  mensagem?: string;
  sucesso?: boolean;
  erros?: Record<string, string[] | undefined>;
};

export async function entrar(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });

  if (error) {
    // Mensagem genérica para não revelar se o e-mail existe.
    if (error.code === "email_not_confirmed") {
      return { mensagem: "Confirme seu e-mail antes de entrar." };
    }
    return { mensagem: "E-mail ou senha inválidos." };
  }

  await garantirCategoriasPadrao(supabase, data.user.id);
  redirect("/dashboard");
}

export async function cadastrar(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = cadastroSchema.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.senha,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { mensagem: "Senha fraca ou já exposta em vazamentos. Escolha outra." };
    }
    return { mensagem: "Não foi possível criar a conta. Tente novamente." };
  }

  // Mesmo retorno para e-mail novo ou já cadastrado (evita enumeração de contas).
  return { sucesso: true, mensagem: "Enviamos um link de confirmação para o seu e-mail." };
}

// Login com Google (OAuth/PKCE). Na volta, /auth/callback troca o código pela sessão.
// Se já existir conta com o mesmo e-mail verificado, o Supabase vincula as duas formas de login.
export async function entrarComGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // sempre mostra o seletor de contas do Google
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?erro=google");
  redirect(data.url);
}

export async function pedirNovaSenha(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = esqueciSenhaSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/redefinir-senha`,
  });

  if (error?.code === "over_email_send_rate_limit") {
    return { mensagem: "Muitos pedidos seguidos. Aguarde alguns minutos e tente de novo." };
  }

  // Mesmo retorno exista ou não a conta (evita revelar quais e-mails estão cadastrados).
  return {
    sucesso: true,
    mensagem: "Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Abra-o neste mesmo navegador.",
  };
}

export async function definirNovaSenha(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const parsed = novaSenhaSchema.safeParse({
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) return { erros: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });

  if (error) {
    if (error.code === "weak_password") return { mensagem: "Senha fraca ou já exposta em vazamentos. Escolha outra." };
    if (error.code === "same_password") return { mensagem: "A nova senha precisa ser diferente da atual." };
    if (error.code === "reauthentication_needed" || error.code === "session_not_found") {
      return { mensagem: "O link expirou. Peça um novo em “Esqueci minha senha”." };
    }
    return { mensagem: "Não foi possível trocar a senha. Tente novamente." };
  }

  // Encerra as sessões nos outros aparelhos: quem pediu a troca pode ter perdido o controle da senha antiga.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/dashboard?senha=alterada");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
