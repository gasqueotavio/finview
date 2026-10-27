-- =============================================================================
-- Lembretes de vencimento por notificação push e link de agenda (.ics).
--
-- push_inscricoes        um registro por navegador/aparelho que aceitou notificações
-- notificacao_preferencias  quando avisar e se mostra nome/valor na tela de bloqueio
-- notificacoes_enviadas  evita avisar duas vezes a mesma conta no mesmo dia
-- agenda_links           hash do token secreto do link .ics (o token em si não é guardado)
-- =============================================================================

create table public.notificacao_preferencias (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  no_dia           boolean not null default true,
  um_dia_antes     boolean not null default true,
  tres_dias_antes  boolean not null default true,
  atrasadas        boolean not null default true,
  mostrar_detalhes boolean not null default true,
  atualizado_em    timestamptz not null default now()
);

create trigger notificacao_preferencias_atualizado_em before update on public.notificacao_preferencias
  for each row execute function public.tocar_atualizado_em();

create table public.push_inscricoes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Um navegador pertence a uma conta por vez (ver registrar_push).
  endpoint    text not null unique check (endpoint like 'https://%' and length(endpoint) <= 1000),
  p256dh      text not null check (length(p256dh) <= 200),
  auth        text not null check (length(auth) <= 100),
  dispositivo text check (length(dispositivo) <= 120),
  criado_em   timestamptz not null default now()
);
create index push_inscricoes_user_id_idx on public.push_inscricoes (user_id);

create table public.notificacoes_enviadas (
  lancamento_id uuid not null references public.lancamentos (id) on delete cascade,
  tipo          text not null check (tipo in ('tres_dias', 'um_dia', 'no_dia', 'atrasada')),
  dia           date not null,
  user_id       uuid not null references auth.users (id) on delete cascade,
  primary key (lancamento_id, tipo, dia)
);

create table public.agenda_links (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  criado_em  timestamptz not null default now()
);

-- RLS -------------------------------------------------------------------------

alter table public.notificacao_preferencias enable row level security;
alter table public.push_inscricoes enable row level security;
alter table public.notificacoes_enviadas enable row level security;
alter table public.agenda_links enable row level security;

create policy "dono gerencia suas preferências" on public.notificacao_preferencias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Inserção só via registrar_push (que tira o navegador de outra conta, se for o caso).
create policy "dono vê suas inscrições" on public.push_inscricoes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "dono remove suas inscrições" on public.push_inscricoes
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "dono gerencia seu link de agenda" on public.agenda_links
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- notificacoes_enviadas: sem políticas; só o envio agendado (service_role) mexe.

revoke truncate, references, trigger on
  public.notificacao_preferencias, public.push_inscricoes, public.notificacoes_enviadas, public.agenda_links
  from authenticated, anon;
revoke all on public.notificacoes_enviadas from authenticated, anon;
revoke insert, update on public.push_inscricoes from authenticated, anon;

-- Funções ---------------------------------------------------------------------

-- Associa este navegador à conta logada. Se o mesmo navegador estava com outra conta
-- (computador compartilhado), ela deixa de receber os avisos aqui.
create or replace function public.registrar_push(
  p_endpoint    text,
  p_p256dh      text,
  p_auth        text,
  p_dispositivo text default null
)
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

  delete from public.push_inscricoes where endpoint = p_endpoint;
  insert into public.push_inscricoes (user_id, endpoint, p256dh, auth, dispositivo)
  values (v_id, p_endpoint, p_p256dh, p_auth, p_dispositivo);

  insert into public.notificacao_preferencias (user_id) values (v_id)
  on conflict (user_id) do nothing;
end;
$$;

revoke execute on function public.registrar_push(text, text, text, text) from public, anon;
grant execute on function public.registrar_push(text, text, text, text) to authenticated;

-- Contas a avisar hoje, ainda não avisadas. Usada só pelo envio agendado (service_role).
create or replace function public.notificacoes_do_dia(p_hoje date)
returns table (
  user_id          uuid,
  lancamento_id    uuid,
  descricao_enc    text,
  valor            numeric,
  valor_estimado   boolean,
  data_vencimento  date,
  tipo             text,
  mostrar_detalhes boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with candidatos as (
    select
      l.user_id, l.id, l.descricao_enc, l.valor, l.valor_estimado, l.data_vencimento,
      case
        when l.data_vencimento = p_hoje     then 'no_dia'
        when l.data_vencimento = p_hoje + 1 then 'um_dia'
        when l.data_vencimento = p_hoje + 3 then 'tres_dias'
        else 'atrasada'
      end as tipo,
      p.no_dia, p.um_dia_antes, p.tres_dias_antes, p.atrasadas, p.mostrar_detalhes
    from public.lancamentos l
    join public.notificacao_preferencias p on p.user_id = l.user_id
    where l.status = 'pendente'
      and (l.data_vencimento in (p_hoje, p_hoje + 1, p_hoje + 3)
           or l.data_vencimento between p_hoje - 3 and p_hoje - 1)
      and exists (select 1 from public.push_inscricoes s where s.user_id = l.user_id)
  )
  select c.user_id, c.id, c.descricao_enc, c.valor, c.valor_estimado, c.data_vencimento, c.tipo, c.mostrar_detalhes
  from candidatos c
  where case c.tipo
          when 'no_dia'    then c.no_dia
          when 'um_dia'    then c.um_dia_antes
          when 'tres_dias' then c.tres_dias_antes
          else c.atrasadas
        end
    and not exists (
      select 1 from public.notificacoes_enviadas e
      where e.lancamento_id = c.id and e.tipo = c.tipo and e.dia = p_hoje
    )
  order by c.user_id, c.data_vencimento;
$$;

revoke execute on function public.notificacoes_do_dia(date) from public, anon, authenticated;
grant execute on function public.notificacoes_do_dia(date) to service_role;

-- Lançamentos do link de agenda. Quem tem o link (token) vê as contas daquela conta:
-- o token tem 256 bits e só o hash fica no banco.
create or replace function public.feed_agenda(p_token_hash text)
returns table (
  user_id         uuid,
  lancamento_id   uuid,
  descricao_enc   text,
  valor           numeric,
  valor_estimado  boolean,
  valor_pago      numeric,
  data_vencimento date,
  status          public.status_lancamento
)
language sql
stable
security definer
set search_path = ''
as $$
  select l.user_id, l.id, l.descricao_enc, l.valor, l.valor_estimado, l.valor_pago, l.data_vencimento, l.status
  from public.agenda_links a
  join public.lancamentos l on l.user_id = a.user_id
  where a.token_hash = p_token_hash
    and l.status <> 'cancelado'
    and l.data_vencimento between current_date - 90 and current_date + 400
  order by l.data_vencimento;
$$;

revoke execute on function public.feed_agenda(text) from public;
grant execute on function public.feed_agenda(text) to anon, authenticated;
