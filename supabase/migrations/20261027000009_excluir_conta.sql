-- =============================================================================
-- LGPD (art. 18, VI): o titular pode excluir a própria conta a qualquer momento.
--
-- Apagar o usuário em auth.users remove em cascata categorias, compromissos e
-- lançamentos (todas as tabelas têm user_id ... references auth.users on delete cascade),
-- além das sessões e identidades (Google) do próprio Supabase Auth.
--
-- security definer: o usuário logado não tem permissão sobre o schema auth; a função
-- roda como dona (postgres), mas só consegue apagar o registro de quem a chamou.
-- =============================================================================

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null then
    raise exception 'Sessão inválida';
  end if;

  delete from auth.users where id = v_id;
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
