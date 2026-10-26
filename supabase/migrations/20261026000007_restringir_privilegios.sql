-- O Supabase concede por padrão todos os privilégios ao papel authenticated.
-- Mantemos só o que o app usa:
--   * tabelas: SELECT, INSERT, UPDATE, DELETE (sempre filtrados pelo RLS)
--   * views: só SELECT
-- TRUNCATE em particular ignora o RLS e apagaria a tabela de todos os usuários.

revoke truncate, references, trigger
  on public.categorias, public.compromissos, public.lancamentos
  from authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.vw_lancamentos, public.vw_compromissos_resumo, public.vw_resumo_mensal
  from authenticated;

-- Funções internas, chamadas só por outras funções ou triggers.
revoke execute on function public.tocar_atualizado_em() from public, anon, authenticated;
revoke execute on function public.confirmar_valor_estimado() from public, anon, authenticated;
