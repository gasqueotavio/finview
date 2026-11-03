-- =============================================================================
-- Leitura de boletos com IA (Gemini): consentimento e limite diário de uso.
--
-- ia_consentimentos  o usuário aceitou enviar documentos ao Google Gemini (uma vez)
-- ia_uso             quantas leituras cada usuário fez em cada dia (fuso de Brasília)
--
-- O contador só muda pelas funções abaixo: o usuário pode ler o próprio uso, mas não
-- alterá-lo. O limite fica fixo aqui dentro (não é parâmetro), senão bastaria chamar a
-- função pela API com um limite maior.
-- =============================================================================

create table public.ia_consentimentos (
  user_id   uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  aceito_em timestamptz not null default now()
);

create table public.ia_uso (
  user_id  uuid not null references auth.users (id) on delete cascade,
  dia      date not null,
  leituras integer not null default 0 check (leituras >= 0),
  primary key (user_id, dia)
);

alter table public.ia_consentimentos enable row level security;
alter table public.ia_uso enable row level security;

create policy "dono vê seu consentimento" on public.ia_consentimentos
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono registra seu consentimento" on public.ia_consentimentos
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "dono retira seu consentimento" on public.ia_consentimentos
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono vê seu uso" on public.ia_uso
  for select to authenticated using ((select auth.uid()) = user_id);

revoke truncate, references, trigger on public.ia_consentimentos, public.ia_uso from authenticated, anon;
revoke update on public.ia_consentimentos from authenticated, anon;
revoke insert, update, delete on public.ia_uso from authenticated, anon;

-- Reserva uma leitura de hoje para o usuário logado.
-- Devolve quantas ainda restam depois desta, ou -1 se o limite do dia já foi atingido.
create or replace function public.consumir_leitura_ia()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_limite constant integer := 10;
  v_id     uuid := auth.uid();
  v_hoje   date := (now() at time zone 'America/Sao_Paulo')::date;
  v_total  integer;
begin
  if v_id is null then
    raise exception 'Sessão inválida';
  end if;

  insert into public.ia_uso (user_id, dia, leituras) values (v_id, v_hoje, 1)
  on conflict (user_id, dia) do update
    set leituras = public.ia_uso.leituras + 1
    where public.ia_uso.leituras < c_limite
  returning leituras into v_total;

  -- Sem linha devolvida: o "do update" foi barrado pelo where (limite atingido).
  if v_total is null then
    return -1;
  end if;
  return c_limite - v_total;
end;
$$;

revoke execute on function public.consumir_leitura_ia() from public, anon;
grant execute on function public.consumir_leitura_ia() to authenticated;

-- Devolve a leitura de hoje quando a falha foi do provedor (cota esgotada, tempo
-- esgotado). Só o servidor (service_role) chama: o usuário não pode zerar o contador.
create or replace function public.devolver_leitura_ia(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ia_uso
     set leituras = leituras - 1
   where user_id = p_user_id
     and dia = (now() at time zone 'America/Sao_Paulo')::date
     and leituras > 0;
$$;

revoke execute on function public.devolver_leitura_ia(uuid) from public, anon, authenticated;
grant execute on function public.devolver_leitura_ia(uuid) to service_role;
