-- =============================================================================
-- Job diário que mantém os compromissos sem prazo (assinaturas, contas fixas)
-- sempre com 12 meses de lançamentos gerados à frente.
-- Compromissos com prazo já têm todas as parcelas geradas na criação.
-- =============================================================================

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.gerar_lancamentos_recorrentes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id    uuid;
  v_total integer := 0;
begin
  for v_id in
    select id from public.compromissos
     where status = 'ativo' and total_parcelas is null
  loop
    v_total := v_total + public.gerar_lancamentos(v_id);
  end loop;
  return v_total;
end;
$$;

-- Atua sobre todos os usuários: só o próprio banco (cron) pode executar.
revoke execute on function public.gerar_lancamentos_recorrentes() from public, anon, authenticated;

select cron.schedule(
  'finview-gerar-recorrentes',
  '0 6 * * *', -- todo dia às 06:00 UTC (03:00 em Brasília)
  $$ select public.gerar_lancamentos_recorrentes(); $$
);
