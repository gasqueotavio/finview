-- =============================================================================
-- Saldo devedor informado pelo usuário (o número que aparece no extrato do banco).
--
-- Financiamentos, consórcios e empréstimos têm juros: o saldo real raramente é
-- "parcelas que faltam × valor da parcela". Agora o usuário pode informar o saldo de
-- uma data; daí em diante, cada parcela paga com data posterior é descontada dele.
-- Sem saldo informado, continua valendo o cálculo pelas parcelas pendentes.
-- =============================================================================

alter table public.compromissos
  add column saldo_informado    numeric(14,2) check (saldo_informado >= 0),
  add column saldo_informado_em date,
  add constraint compromissos_saldo_com_data
    check ((saldo_informado is null) = (saldo_informado_em is null));

-- c.* é expandido na criação da view: recriar para incluir as colunas novas.
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
  case
    when c.status <> 'ativo' then null
    -- saldo do banco menos o que foi pago depois da data dele
    when c.saldo_informado is not null then greatest(
      0::numeric(14,2),
      c.saldo_informado - coalesce(sum(l.valor_pago) filter (
        where l.tipo = 'parcela' and l.status = 'pago' and l.data_pagamento > c.saldo_informado_em
      ), 0)
    )
    when c.total_parcelas is not null then coalesce(sum(l.valor) filter (where l.status = 'pendente'), 0)
  end                                                                            as saldo_devedor,
  min(l.data_vencimento) filter (where l.status = 'pendente')                    as proximo_vencimento
from public.compromissos c
left join public.lancamentos l on l.compromisso_id = c.id
group by c.id;

-- Mesmas restrições da migration 20261026000007: view só para leitura.
revoke insert, update, delete, truncate, references, trigger
  on public.vw_compromissos_resumo
  from authenticated, anon;
