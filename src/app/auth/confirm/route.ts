import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { garantirCategoriasPadrao } from "@/lib/dados/categorias";
import { createClient } from "@/lib/supabase/server";

// Destino dos links enviados por e-mail (confirmação de cadastro e recuperação de senha).
// Aceita os dois formatos do Supabase:
//  - template personalizado: /auth/confirm?token_hash={{ .TokenHash }}&type=email|recovery
//    (funciona mesmo abrindo o link em outro aparelho);
//  - template padrão (PKCE): /auth/confirm?code=...  (precisa abrir no mesmo navegador que pediu).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const destino = destinoSeguro(searchParams.get("next"), type);

  const supabase = await createClient();
  let userId: string | null = null;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) userId = data.user.id;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user.id;
  }

  if (userId) {
    await garantirCategoriasPadrao(supabase, userId);
    redirect(destino);
  }

  redirect(destino === "/redefinir-senha" ? "/esqueci-senha?erro=link" : "/login?erro=confirmacao");
}

// Só caminhos internos conhecidos (evita usar o link como redirecionamento aberto para outro site).
function destinoSeguro(next: string | null, type: EmailOtpType | null) {
  if (type === "recovery" || next === "/redefinir-senha") return "/redefinir-senha";
  return "/dashboard";
}
