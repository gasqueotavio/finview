-- =============================================================================
-- Contas anuais: cada ano gera seu próprio "ciclo" de 1 (cota única) a 12 parcelas.
--   * compromissos.valor_anual / parcelas_por_ano: plano padrão para os próximos anos.
--   * lancamentos.ano_referencia: a qual ano a parcela pertence (numero_parcela reinicia a cada ano).
--   * Anos futuros nascem como estimativa (o valor muda todo ano). Quando o carnê chega,
--     replanejar_ano grava o plano real escolhido (cota única ou parcelado).
-- =============================================================================

alter table public.compromissos
  add column valor_anual     numeric(14,2) check (valor_anual > 0),
  add column parcelas_por_ano integer check (parcelas_por_ano between 1 and 12);

-- compromissos_check1 = "total_parcelas is not null or tipo in ('assinatura', 'fixo')" (migration inicial)
alter table public.compromissos drop constraint compromissos_check1;
alter table public.compromissos
  add constraint compromissos_prazo_check
    check (total_parcelas is not null or tipo in ('assinatura', 'fixo', 'anual')),
  add constraint compromissos_anual_check
    check (
      case when tipo = 'anual'
        then frequencia = 'anual' and total_parcelas is null
             and valor_anual is not null and parcelas_por_ano is not null
        else valor_anual is null and parcelas_por_ano is null
      end
    );

alter table public.lancamentos
  add column ano_referencia integer check (ano_referencia between 2000 and 2200),
  add constraint lancamentos_ano_so_em_parcela check (ano_referencia is null or tipo = 'parcela');

-- Numeração passa a ser única por ano nas contas anuais.
alter table public.lancamentos drop constraint lancamentos_compromisso_id_numero_parcela_key;
create unique index lancamentos_parcela_unica
  on public.lancamentos (compromisso_id, numero_parcela) where ano_referencia is null;
create unique index lancamentos_parcela_anual_unica
  on public.lancamentos (compromisso_id, ano_referencia, numero_parcela) where ano_referencia is not null;

-- -----------------------------------------------------------------------------
-- Valor da parcela j de n: divide o total e joga a diferença dos centavos na 1ª.
-- Ex.: 1000 em 3x = 333,34 + 333,33 + 333,33
-- -----------------------------------------------------------------------------
create or replace function public.valor_da_parcela(p_total numeric, p_parcelas integer, p_numero integer)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_numero = 1 then p_total - trunc(p_total / p_parcelas, 2) * (p_parcelas - 1)
    else trunc(p_total / p_parcelas, 2)
  end;
$$;

-- -----------------------------------------------------------------------------
-- Insere as parcelas de um ano de uma conta anual (parcelas mensais a partir de p_primeiro).
-- -----------------------------------------------------------------------------
create or replace function public.inserir_parcelas_do_ano(
  p_compromisso_id uuid,
  p_ano            integer,
  p_primeiro       date,
  p_parcelas       integer,
  p_valor_total    numeric,
  p_estimado       boolean
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inseridos integer;
begin
  insert into public.lancamentos (
    user_id, tipo, compromisso_id, categoria_id, descricao_enc,
    valor, valor_estimado, data_vencimento, numero_parcela, ano_referencia
  )
  select
    c.user_id, 'parcela', c.id, c.categoria_id, c.descricao_enc,
    public.valor_da_parcela(p_valor_total, p_parcelas, j), p_estimado,
    (p_primeiro + make_interval(months => j - 1))::date, j, p_ano
  from public.compromissos c
  cross join generate_series(1, p_parcelas) as j
  where c.id = p_compromisso_id
  on conflict (compromisso_id, ano_referencia, numero_parcela) where ano_referencia is not null do nothing;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;

-- -----------------------------------------------------------------------------
-- gerar_lancamentos: agora também trata contas anuais.
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
  v_ano_ini    integer;
  v_ano        integer;
  v_primeiro   date;
begin
  select * into c from public.compromissos where id = p_compromisso_id;
  if not found then
    raise exception 'Compromisso % não encontrado', p_compromisso_id;
  end if;

  if c.status <> 'ativo' then
    return 0;
  end if;

  v_horizonte := coalesce(p_horizonte, (current_date + interval '12 months')::date);

  -- Contas anuais: um ciclo por ano, até o horizonte. Ano já gerado não é tocado
  -- (pode ter sido replanejado para cota única ou outro número de parcelas).
  if c.tipo = 'anual' then
    v_inseridos := 0;
    v_ano_ini := extract(year from c.data_vencimento_inicial)::integer;
    for v_ano in v_ano_ini .. extract(year from v_horizonte)::integer loop
      v_primeiro := (c.data_vencimento_inicial + make_interval(years => v_ano - v_ano_ini))::date;
      exit when v_primeiro > v_horizonte;
      continue when exists (
        select 1 from public.lancamentos where compromisso_id = c.id and ano_referencia = v_ano
      );
      v_inseridos := v_inseridos + public.inserir_parcelas_do_ano(
        c.id, v_ano, v_primeiro, c.parcelas_por_ano, c.valor_anual,
        -- o valor do próprio ano informado pode ser exato; os seguintes são sempre estimativa
        c.valor_variavel or v_ano > v_ano_ini
      );
    end loop;
    return v_inseridos;
  end if;

  v_meses := public.meses_da_frequencia(c.frequencia);

  if c.total_parcelas is not null then
    v_ultima := c.total_parcelas;
  else
    v_decorridos := age(v_horizonte, c.data_vencimento_inicial);
    v_ultima := c.primeira_parcela
      + floor((extract(year from v_decorridos) * 12 + extract(month from v_decorridos)) / v_meses)::integer;
  end if;

  insert into public.lancamentos (
    user_id, tipo, compromisso_id, categoria_id, descricao_enc,
    valor, valor_estimado, data_vencimento, numero_parcela
  )
  select
    c.user_id, 'parcela', c.id, c.categoria_id, c.descricao_enc,
    c.valor_parcela, c.valor_variavel,
    -- calculado sempre a partir da data inicial para não acumular desvio de fim de mês
    (c.data_vencimento_inicial + make_interval(months => (n - c.primeira_parcela) * v_meses))::date,
    n
  from generate_series(c.primeira_parcela, v_ultima) as n
  on conflict (compromisso_id, numero_parcela) where ano_referencia is null do nothing;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;

-- -----------------------------------------------------------------------------
-- replanejar_ano: grava o plano real de um ano (o carnê chegou e a pessoa escolheu
-- entre cota única e parcelado). O plano vira o padrão para os próximos anos.
-- -----------------------------------------------------------------------------
create or replace function public.replanejar_ano(
  p_compromisso_id      uuid,
  p_ano                 integer,
  p_parcelas            integer,
  p_valor_total         numeric,
  p_primeiro_vencimento date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c public.compromissos;
begin
  select * into c from public.compromissos where id = p_compromisso_id for update;
  if not found then
    raise exception 'Compromisso % não encontrado', p_compromisso_id;
  end if;
  if c.tipo <> 'anual' or c.status <> 'ativo' then
    raise exception 'Só é possível replanejar contas anuais ativas';
  end if;
  if p_parcelas not between 1 and 12 or p_valor_total <= 0 then
    raise exception 'Plano inválido';
  end if;
  if extract(year from p_primeiro_vencimento) <> p_ano then
    raise exception 'O primeiro vencimento precisa ser no ano %', p_ano;
  end if;
  if exists (
    select 1 from public.lancamentos
     where compromisso_id = c.id and ano_referencia = p_ano and status = 'pago'
  ) then
    raise exception 'Já existe parcela paga em %; o plano desse ano não pode mais mudar', p_ano;
  end if;

  delete from public.lancamentos where compromisso_id = c.id and ano_referencia = p_ano;

  update public.compromissos
     set valor_anual = p_valor_total,
         parcelas_por_ano = p_parcelas,
         valor_parcela = round(p_valor_total / p_parcelas, 2),
         data_vencimento_inicial = p_primeiro_vencimento
   where id = c.id;

  return public.inserir_parcelas_do_ano(c.id, p_ano, p_primeiro_vencimento, p_parcelas, p_valor_total, false);
end;
$$;

revoke execute on function public.inserir_parcelas_do_ano(uuid, integer, date, integer, numeric, boolean) from public, anon;
revoke execute on function public.replanejar_ano(uuid, integer, integer, numeric, date) from public, anon;
grant execute on function public.inserir_parcelas_do_ano(uuid, integer, date, integer, numeric, boolean) to authenticated;
grant execute on function public.replanejar_ano(uuid, integer, integer, numeric, date) to authenticated;

-- -----------------------------------------------------------------------------
-- Views: recriar para incluir as colunas novas (l.* / c.* são expandidos na criação).
-- -----------------------------------------------------------------------------
drop view public.vw_lancamentos;
drop view public.vw_compromissos_resumo;

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

revoke all on public.vw_lancamentos, public.vw_compromissos_resumo from anon;
