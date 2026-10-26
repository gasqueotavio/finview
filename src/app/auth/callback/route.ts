import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { garantirCategoriasPadrao } from "@/lib/dados/categorias";
import { createClient } from "@/lib/supabase/server";

// Volta do login com Google: troca o código de autorização pela sessão.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await garantirCategoriasPadrao(supabase, data.user.id);
      redirect("/dashboard");
    }
  }

  redirect("/login?erro=google");
}
