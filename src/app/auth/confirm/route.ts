import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { garantirCategoriasPadrao } from "@/lib/dados/categorias";
import { createClient } from "@/lib/supabase/server";

// Destino do link de confirmação de e-mail.
// O template de e-mail no Supabase deve apontar para:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && data.user) {
      await garantirCategoriasPadrao(supabase, data.user.id);
      redirect("/dashboard");
    }
  }

  redirect("/login?erro=confirmacao");
}
