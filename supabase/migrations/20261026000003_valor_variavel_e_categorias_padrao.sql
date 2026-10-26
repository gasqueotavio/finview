-- =============================================================================
-- 1. Contas de valor variável (luz, água, fatura do cartão...): o lançamento nasce
--    como estimativa e deixa de ser estimado quando o valor real é informado ou pago.
-- 2. Categorias padrão: "chave" identifica as categorias do catálogo (src/lib/catalogo.ts).
--    Como todo usuário recebe o mesmo conjunto, a chave em texto puro não revela nada.
-- 3. Compromissos lembram de qual item do catálogo vieram (para o checklist).
-- =============================================================================

alter table public.categorias
  add column chave text check (chave ~ '^[a-z_]+$'),
  add constraint categorias_user_chave_key unique (user_id, chave);

alter table public.compromissos
  add column valor_variavel boolean not null default false,
  -- item do catálogo de origem, cifrado ("tem plano de saúde" já é informação pessoal)
  add column modelo_enc text check (modelo_enc like 'v1.%');

alter table public.lancamentos
  add column valor_estimado boolean not null default false;

-- Informar o valor real ou pagar confirma o lançamento.
create or replace function public.confirmar_valor_estimado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.valor_estimado and (new.valor <> old.valor or new.status = 'pago') then
    new.valor_estimado := false;
  end if;
  return new;
end;
$$;

create trigger lancamentos_confirmar_valor before update on public.lancamentos
  for each row execute function public.confirmar_valor_estimado();

-- gerar_lancamentos passa a propagar valor_variavel → valor_estimado.
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
    valor, valor_estimado, data_vencimento, numero_parcela
  )
  select
    c.user_id, 'parcela', c.id, c.categoria_id, c.descricao_enc,
    c.valor_parcela, c.valor_variavel,
    -- calculado sempre a partir da data inicial para não acumular desvio de fim de mês
    (c.data_vencimento_inicial + make_interval(months => (n - c.primeira_parcela) * v_meses))::date,
    n
  from generate_series(c.primeira_parcela, v_ultima) as n
  on conflict (compromisso_id, numero_parcela) do nothing;

  get diagnostics v_inseridos = row_count;
  return v_inseridos;
end;
$$;

-- As views usam l.* / c.*, que são expandidos na criação: recriar para incluir as novas colunas.
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
