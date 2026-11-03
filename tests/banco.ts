import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

// Postgres em memória com todas as migrations do projeto, para testar regras do banco
// (RLS, funções, limites) sem tocar no Supabase de verdade.

const PASTA = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));

export const USUARIO_1 = "11111111-1111-1111-1111-111111111111";
export const USUARIO_2 = "22222222-2222-2222-2222-222222222222";

export async function criarBanco() {
  const db = new PGlite();
  // O mínimo do ambiente do Supabase que as migrations usam: papéis, auth.users e auth.uid().
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
    alter default privileges in schema public grant all on tables to authenticated, anon, service_role;
    insert into auth.users values ('${USUARIO_1}'), ('${USUARIO_2}');
  `);
  for (const arquivo of readdirSync(PASTA).filter((f) => f.endsWith(".sql")).sort()) {
    // pg_cron não existe no PGlite.
    if (arquivo.includes("cron")) continue;
    await db.exec(readFileSync(PASTA + arquivo, "utf8"));
  }

  /** Executa como um papel do Supabase (authenticated, anon, service_role) e, opcionalmente, um usuário logado. */
  async function como<T = Record<string, unknown>>(papel: string, userId: string | null, sql: string, params: unknown[] = []) {
    await db.exec(`set role ${papel}; select set_config('request.jwt.claim.sub', '${userId ?? ""}', false);`);
    try {
      return (await db.query<T>(sql, params)).rows;
    } finally {
      await db.exec("reset role;");
    }
  }

  return { db, como };
}
