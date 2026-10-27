-- =============================================================================
-- Saldo devedor com juros (Tabela Price).
--
-- Em financiamento e empréstimo, cada parcela paga primeiro os juros do mês sobre o
-- saldo; só o restante amortiza a dívida. Com a taxa mensal i:
--     saldo_novo = saldo × (1 + i) − valor_pago
--
-- A taxa vem do contrato (informada) ou é calculada pelo app a partir do saldo, do valor
-- da parcela e de quantas faltam (taxa_estimada = true). Sem taxa, i = 0: cada parcela
-- abate o valor inteiro (consórcio, parcelamento sem juros).
-- =============================================================================

alter table public.compromissos
  -- percentual ao mês, ex.: 1.49 = 1,49% a.m.
  add column taxa_juros_mensal numeric(8,5) check (taxa_juros_mensal >= 0 and taxa_juros_mensal <= 20),
  add column taxa_estimada boolean not null default false;

-- Saldo devedor atual de um compromisso (null quando encerrado ou sem prazo).
--  1. Saldo informado: aplica, em ordem, cada parcela paga depois da data do saldo.
--  2. Sem saldo informado, com total de parcelas: valor presente das parcelas pendentes
--     (o que se paga para quitar hoje); as atrasadas contam pelo valor cheio.
create or replace function public.saldo_devedor_atual(p_compromisso_id uuid)
returns numeric
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  c      public.compromissos;
  v_i    numeric;
  v_s    numeric := 0;
  v_n    integer := 0;
  r      record;
begin
  select * into c from public.compromissos where id = p_compromisso_id;
  if not found or c.status <> 'ativo' then
    return null;
  end if;

  v_i := coalesce(c.taxa_juros_mensal, 0) / 100;

  if c.saldo_informado is not null then
    v_s := c.saldo_informado;
    for r in
      select valor_pago
      from public.lancamentos
      where compromisso_id = c.id and tipo = 'parcela' and status = 'pago'
        and data_pagamento > c.saldo_informado_em
      order by data_pagamento, numero_parcela
    loop
      v_s := v_s * (1 + v_i) - r.valor_pago;
    end loop;
    return round(greatest(v_s, 0), 2);
  end if;

  if c.total_parcelas is null then
    return null;
  end if;

  for r in
    select valor, data_vencimento
    from public.lancamentos
    where compromisso_id = c.id and status = 'pendente'
    order by data_vencimento, numero_parcela
  loop
    if r.data_vencimento < current_date or v_i = 0 then
      v_s := v_s + r.valor;
    else
      v_n := v_n + 1;
      v_s := v_s + r.valor / power(1 + v_i, v_n);
    end if;
  end loop;
  return round(v_s, 2);
end;
$$;

revoke execute on function public.saldo_devedor_atual(uuid) from public, anon;
grant execute on function public.saldo_devedor_atual(uuid) to authenticated;

-- Recria a view para usar a função (e incluir as colunas novas em c.*).
drop view public.vw_compromissos_resumo;

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
  public.saldo_devedor_atual(c.id)                                               as saldo_devedor,
  min(l.data_vencimento) filter (where l.status = 'pendente')                    as proximo_vencimento
from public.compromissos c
left join public.lancamentos l on l.compromisso_id = c.id
group by c.id;

revoke insert, update, delete, truncate, references, trigger
  on public.vw_compromissos_resumo
  from authenticated, anon;
