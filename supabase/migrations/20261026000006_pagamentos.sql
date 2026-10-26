-- =============================================================================
-- Pagamento de lançamentos.
--   * valor      = quanto estava previsto
--   * valor_pago = quanto saiu do bolso (pode ter juros, multa ou desconto)
-- Se o valor era só uma estimativa (conta de luz, IPVA de ano futuro...), o valor pago
-- passa a ser também o valor previsto, para os relatórios refletirem a conta real.
-- =============================================================================

create or replace function public.pagar_lancamento(
  p_lancamento_id uuid,
  p_valor_pago    numeric,
  p_data          date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_valor_pago <= 0 then
    raise exception 'O valor pago deve ser maior que zero';
  end if;

  update public.lancamentos
     set status = 'pago',
         valor_pago = p_valor_pago,
         data_pagamento = p_data,
         valor = case when valor_estimado then p_valor_pago else valor end
   where id = p_lancamento_id
     and status = 'pendente';

  if not found then
    raise exception 'Lançamento não encontrado ou não está pendente';
  end if;
end;
$$;

-- Desfaz um pagamento registrado por engano. A quitação não pode ser desfeita por aqui,
-- porque ela também encerrou o compromisso e cancelou as parcelas restantes.
create or replace function public.desfazer_pagamento(p_lancamento_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.lancamentos
     set status = 'pendente', valor_pago = null, data_pagamento = null
   where id = p_lancamento_id
     and status = 'pago'
     and tipo <> 'quitacao';

  if not found then
    raise exception 'Lançamento não encontrado, não está pago ou é uma quitação';
  end if;
end;
$$;

revoke execute on function public.pagar_lancamento(uuid, numeric, date) from public, anon;
revoke execute on function public.desfazer_pagamento(uuid) from public, anon;
grant execute on function public.pagar_lancamento(uuid, numeric, date) to authenticated;
grant execute on function public.desfazer_pagamento(uuid) to authenticated;
