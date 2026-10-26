import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUsuario } from "@/lib/auth";
import { CATEGORIAS_PADRAO } from "@/lib/catalogo";
import { cifrar, decifrar } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";

export type Categoria = {
  id: string;
  chave: string | null;
  nome: string;
  cor: string;
};

// Cria as categorias do catálogo que o usuário ainda não tem. Idempotente.
// Os nomes precisam ser cifrados com a chave do usuário, por isso não dá para fazer via trigger no banco.
export async function garantirCategoriasPadrao(supabase: SupabaseClient, userId: string) {
  const { data: existentes, error } = await supabase.from("categorias").select("chave").not("chave", "is", null);
  if (error) throw error;

  const jaTem = new Set(existentes.map((c) => c.chave));
  const faltando = CATEGORIAS_PADRAO.filter((c) => !jaTem.has(c.chave)).map((c) => ({
    user_id: userId,
    chave: c.chave,
    nome_enc: cifrar(c.nome, userId),
    cor: c.cor,
  }));
  if (faltando.length === 0) return;

  const { error: erroInsert } = await supabase
    .from("categorias")
    .upsert(faltando, { onConflict: "user_id,chave", ignoreDuplicates: true });
  if (erroInsert) throw erroInsert;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const usuario = await getUsuario();
  const supabase = await createClient();

  const { data, error } = await supabase.from("categorias").select("id, chave, nome_enc, cor").eq("arquivada", false);
  if (error) throw error;

  return data
    .map((c) => ({ id: c.id, chave: c.chave, nome: decifrar(c.nome_enc, usuario.id), cor: c.cor }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
