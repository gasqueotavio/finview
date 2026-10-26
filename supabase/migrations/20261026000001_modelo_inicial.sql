-- =============================================================================
-- FinView — modelo inicial
--
-- Convenções:
--   * Valores monetários em numeric(14,2) (nunca float).
--   * Colunas terminadas em _enc guardam texto cifrado pela aplicação
--     (AES-256-GCM, formato "v1.<iv>.<tag>.<dados>"). O banco nunca vê o texto puro.
--   * Toda tabela tem user_id + RLS: cada usuário só enxerga as próprias linhas.
--   * FKs compostas (id, user_id) impedem apontar para registro de outro usuário.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.tipo_compromisso as enum (
  'financiamento', 'emprestimo', 'parcelamento', 'consorcio', 'assinatura', 'fixo'
);

create type public.frequencia as enum (
  'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'
);

create type public.status_compromisso as enum ('ativo', 'quitado', 'cancelado');

-- 'atrasado' não é armazenado: é derivado (pendente + vencimento no passado).
create type public.status_lancamento as enum ('pendente', 'pago', 'cancelado');

-- avulso   = gasto pontual, sem compromisso
-- parcela  = ocorrência gerada a partir de um compromisso
-- quitacao = pagamento antecipado que encerra um compromisso
create type public.tipo_lancamento as enum ('avulso', 'parcela', 'quitacao');

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create or replace function public.meses_da_frequencia(f public.frequencia)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case f
    when 'mensal'     then 1
    when 'bimestral'  then 2
    when 'trimestral' then 3
    when 'semestral'  then 6
    when 'anual'      then 12
  end;
$$;

-- -----------------------------------------------------------------------------
-- categorias
-- -----------------------------------------------------------------------------
create table public.categorias (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome_enc      text not null check (nome_enc like 'v1.%'),
  cor           text not null default '#64748b' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  icone         text,
  arquivada     boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, user_id)
);

create index categorias_user_idx on public.categorias (user_id);

-- -----------------------------------------------------------------------------
-- compromissos: a "regra" de um gasto recorrente
-- (financiamento, parcelamento, consórcio, assinatura, conta fixa...)
-- -----------------------------------------------------------------------------
create table public.compromissos (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria_id            uuid,
  tipo                    public.tipo_compromisso not null,
  descricao_enc           text not null check (descricao_enc like 'v1.%'),
  observacao_enc          text check (observacao_enc like 'v1.%'),
  valor_parcela           numeric(14,2) not null check (valor_parcela > 0),
  -- null = sem prazo definido (assinaturas, contas fixas)
  total_parcelas          integer check (total_parcelas > 0),
  -- permite cadastrar um financiamento já em andamento (ex.: começa na parcela 25 de 60)
  primeira_parcela        integer not null default 1 check (primeira_parcela >= 1),
  frequencia              public.frequencia not null default 'mensal',
  -- vencimento de primeira_parcela; os demais são calculados a partir dele
  data_vencimento_inicial date not null,
  status                  public.status_compromisso not null default 'ativo',
  encerrado_em            date,
  criado_em               timestamptz not null default now(),
  atualizado_em           timestamptz not null default now(),

  unique (id, user_id),
  foreign key (categoria_id, user_id)
    references public.categorias (id, user_id) on delete set null (categoria_id),

  check (total_parcelas is null or primeira_parcela <= total_parcelas),
  -- só assinaturas e contas fixas podem ser sem prazo
  check (total_parcelas is not null or tipo in ('assinatura', 'fixo')),
  check ((status = 'ativo') = (encerrado_em is null))
);

create index compromissos_user_idx on public.compromissos (user_id, status);

-- -----------------------------------------------------------------------------
-- lancamentos: cada gasto efetivo (avulso ou parcela de um compromisso)
-- -----------------------------------------------------------------------------
create table public.lancamentos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo            public.tipo_lancamento not null default 'avulso',
  compromisso_id  uuid,
  categoria_id    uuid,
  descricao_enc   text not null check (descricao_enc like 'v1.%'),
  observacao_enc  text check (observacao_enc like 'v1.%'),
  valor           numeric(14,2) not null check (valor > 0),
  data_vencimento date not null,
  numero_parcela  integer check (numero_parcela >= 1),
  status          public.status_lancamento not null default 'pendente',
  data_pagamento  date,
  valor_pago      numeric(14,2) check (valor_pago >= 0),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),

  foreign key (compromisso_id, user_id)
    references public.compromissos (id, user_id) on delete cascade,
  foreign key (categoria_id, user_id)
    references public.categorias (id, user_id) on delete set null (categoria_id),
  unique (compromisso_id, numero_parcela),

  check ((tipo = 'avulso') = (compromisso_id is null)),
  check ((tipo = 'parcela') = (numero_parcela is not null)),
  check ((status = 'pago') = (data_pagamento is not null and valor_pago is not null))
);

create index lancamentos_user_venc_idx on public.lancamentos (user_id, data_vencimento);
create index lancamentos_compromisso_idx on public.lancamentos (compromisso_id);

-- -----------------------------------------------------------------------------
-- Triggers de atualizado_em
-- -----------------------------------------------------------------------------
create trigger categorias_atualizado_em before update on public.categorias
  for each row execute function public.tocar_atualizado_em();
create trigger compromissos_atualizado_em before update on public.compromissos
  for each row execute function public.tocar_atualizado_em();
create trigger lancamentos_atualizado_em before update on public.lancamentos
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.categorias   enable row level security;
alter table public.compromissos enable row level security;
alter table public.lancamentos  enable row level security;

create policy "dono gerencia suas categorias" on public.categorias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono gerencia seus compromissos" on public.compromissos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono gerencia seus lancamentos" on public.lancamentos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Visitantes não autenticados não tocam em nada.
revoke all on public.categorias, public.compromissos, public.lancamentos from anon;

-- -----------------------------------------------------------------------------
-- gerar_lancamentos: materializa as parcelas de um compromisso.
--   * Com prazo: gera todas as parcelas de primeira_parcela até total_parcelas.
--   * Sem prazo: gera até p_horizonte (padrão: 12 meses à frente).
-- Idempotente: parcelas já existentes não são duplicadas nem alteradas.
-- Roda com as permissões de quem chama (RLS se aplica).
-- -----------------------------------------------------------------------------
create or replace function public.gerar_lancamentos(
  p_compromisso_id uuid,
  p_horizonte date default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c            public.compromissos;
  v_meses      integer;
  v_horizonte  date;
  v_decorridos interval;
  v_ultima     integer;
  v_inseridos  integer;
begin
  select * into c from public.compromissos where id = p_compromisso_id;
  if not found then
    raise exception 'Compromisso % não encontrado', p_compromisso_id;
  end if;

  if c.status <> 'ativo' then
    return 0;
  end if;

  v_meses := public.meses_da_frequencia(c.frequencia);

  if c.total_parcelas is not null then
    v_ultima := c.total_parcelas;
  else
    v_horizonte  := coalesce(p_horizonte, (current_date + interval '12 months')::date);
    v_decorridos := age(v_horizonte, c.data_vencimento_inicial);
    v_ultima := c.primeira_parcela
      + floor((extract(year from v_decorridos) * 12 + extract(month from v_decorridos)) / v_meses)::integer;
  end if;

  insert into public.lancamentos (
    user_id, tipo, compromisso_id, categoria_id, descricao_enc,
    valor, data_vencimento, numero_parcela
  )
  select
    c.user_id, 'parcela', c.id, c.categoria_id, c.descricao_enc,
    c.valor_parcela,
    -- calculado sempre a partir da data inicial para não acumular desvio de fim de mês
    (c.data_vencimento_inicial + make_interval(months => (n - c.primeira_parcela) * v_meses))::date,
    n
  from generate_series(c.primeira_parcela, v_ultima) as n
  on conflict (compromisso_id, numero_parcela) do nothing;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;

-- -----------------------------------------------------------------------------
-- quitar_compromisso: encerra um compromisso antecipadamente.
-- Cancela as parcelas pendentes e registra um lançamento único de quitação
-- (com o valor negociado, que pode ter desconto de juros).
-- -----------------------------------------------------------------------------
create or replace function public.quitar_compromisso(
  p_compromisso_id uuid,
  p_data           date,
  p_valor          numeric,
  p_descricao_enc  text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c         public.compromissos;
  v_lanc_id uuid;
begin
  select * into c from public.compromissos where id = p_compromisso_id for update;
  if not found then
    raise exception 'Compromisso % não encontrado', p_compromisso_id;
  end if;
  if c.status <> 'ativo' then
    raise exception 'Compromisso não está ativo (status: %)', c.status;
  end if;

  update public.lancamentos
     set status = 'cancelado'
   where compromisso_id = c.id
     and status = 'pendente';

  insert into public.lancamentos (
    user_id, tipo, compromisso_id, categoria_id, descricao_enc,
    valor, data_vencimento, status, data_pagamento, valor_pago
  )
  values (
    c.user_id, 'quitacao', c.id, c.categoria_id, p_descricao_enc,
    p_valor, p_data, 'pago', p_data, p_valor
  )
  returning id into v_lanc_id;

  update public.compromissos
     set status = 'quitado', encerrado_em = p_data
   where id = c.id;

  return v_lanc_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- cancelar_compromisso: encerra sem pagar (ex.: assinatura cancelada).
-- Parcelas pendentes com vencimento a partir de p_data são canceladas.
-- -----------------------------------------------------------------------------
create or replace function public.cancelar_compromisso(
  p_compromisso_id uuid,
  p_data           date default current_date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.compromissos
     set status = 'cancelado', encerrado_em = p_data
   where id = p_compromisso_id
     and status = 'ativo';
  if not found then
    raise exception 'Compromisso % não encontrado ou não está ativo', p_compromisso_id;
  end if;

  update public.lancamentos
     set status = 'cancelado'
   where compromisso_id = p_compromisso_id
     and status = 'pendente'
     and data_vencimento >= p_data;
end;
$$;

revoke execute on function public.gerar_lancamentos(uuid, date) from public, anon;
revoke execute on function public.quitar_compromisso(uuid, date, numeric, text) from public, anon;
revoke execute on function public.cancelar_compromisso(uuid, date) from public, anon;
grant execute on function public.gerar_lancamentos(uuid, date) to authenticated;
grant execute on function public.quitar_compromisso(uuid, date, numeric, text) to authenticated;
grant execute on function public.cancelar_compromisso(uuid, date) to authenticated;

-- -----------------------------------------------------------------------------
-- Views (security_invoker: respeitam o RLS de quem consulta)
-- -----------------------------------------------------------------------------
create view public.vw_lancamentos
with (security_invoker = true)
as
select
  l.*,
  case
    when l.status = 'pendente' and l.data_vencimento < current_date then 'atrasado'
    else l.status::text
  end as situacao
from public.lancamentos l;

create view public.vw_compromissos_resumo
with (security_invoker = true)
as
select
  c.*,
  -- parcelas anteriores a primeira_parcela já estavam pagas antes do cadastro
  (c.primeira_parcela - 1)
    + count(l.id) filter (where l.tipo = 'parcela' and l.status = 'pago')       as parcelas_pagas,
  count(l.id) filter (where l.status = 'pendente')                               as parcelas_pendentes,
  count(l.id) filter (where l.status = 'pendente' and l.data_vencimento < current_date) as parcelas_atrasadas,
  coalesce(sum(l.valor_pago) filter (where l.status = 'pago'), 0)                as total_pago,
  case when c.total_parcelas is not null and c.status = 'ativo'
    then coalesce(sum(l.valor) filter (where l.status = 'pendente'), 0)
  end                                                                            as saldo_devedor,
  min(l.data_vencimento) filter (where l.status = 'pendente')                    as proximo_vencimento
from public.compromissos c
left join public.lancamentos l on l.compromisso_id = c.id
group by c.id;

create view public.vw_resumo_mensal
with (security_invoker = true)
as
select
  user_id,
  date_trunc('month', data_vencimento)::date                                     as mes,
  sum(valor) filter (where status <> 'cancelado')                                as total_previsto,
  coalesce(sum(valor_pago) filter (where status = 'pago'), 0)                    as total_pago,
  coalesce(sum(valor) filter (where status = 'pendente'), 0)                     as total_pendente,
  coalesce(sum(valor) filter (where status = 'pendente' and data_vencimento < current_date), 0) as total_atrasado
from public.lancamentos
group by user_id, date_trunc('month', data_vencimento);

revoke all on public.vw_lancamentos, public.vw_compromissos_resumo, public.vw_resumo_mensal from anon;
