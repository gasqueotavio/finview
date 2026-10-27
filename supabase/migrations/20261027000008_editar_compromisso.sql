-- =============================================================================
-- Edição de compromisso, propagando para as parcelas numa transação só.
--
-- - Descrição e categoria: atualizadas em todas as parcelas (inclusive as pagas),
--   para o histórico não ficar com o nome antigo.
-- - Valor (exceto conta anual, que tem planejamento próprio por ano): vale para as
--   parcelas ainda pendentes com vencimento a partir de hoje. As pagas e as atrasadas
--   ficam como estão (a atrasada foi cobrada pelo valor antigo).
-- - "Valor muda todo mês": marca/desmarca como estimativa as mesmas parcelas futuras.
--
-- O cronograma (datas, frequência, número de parcelas) não muda aqui: alterar isso
-- reescreveria parcelas já geradas; para isso, cancele e cadastre de novo.
-- =============================================================================

create or replace function public.editar_compromisso(
  p_compromisso_id uuid,
  p_descricao_enc  text,
  p_valor_parcela  numeric,
  p_valor_variavel boolean,
  p_categoria_id   uuid default null,
  p_observacao_enc text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c     public.compromissos;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- RLS: só encontra compromissos do próprio usuário
  select * into c from public.compromissos where id = p_compromisso_id for update;
  if not found then
    raise exception 'Compromisso não encontrado';
  end if;

  update public.compromissos
     set descricao_enc  = p_descricao_enc,
         categoria_id   = p_categoria_id,
         observacao_enc = p_observacao_enc,
         valor_variavel = p_valor_variavel,
         valor_parcela  = case when c.tipo = 'anual' then c.valor_parcela else p_valor_parcela end
   where id = c.id;

  update public.lancamentos
     set descricao_enc = p_descricao_enc,
         categoria_id  = p_categoria_id
   where compromisso_id = c.id;

  if c.tipo <> 'anual' then
    -- Em dois passos: o gatilho confirmar_valor_estimado desmarca a estimativa quando o
    -- valor muda; o segundo update define a marcação desejada sem mexer no valor.
    update public.lancamentos
       set valor = p_valor_parcela
     where compromisso_id = c.id
       and status = 'pendente'
       and data_vencimento >= v_hoje
       and valor <> p_valor_parcela;

    update public.lancamentos
       set valor_estimado = p_valor_variavel
     where compromisso_id = c.id
       and status = 'pendente'
       and data_vencimento >= v_hoje;
  end if;
end;
$$;

revoke execute on function public.editar_compromisso(uuid, text, numeric, boolean, uuid, text) from public, anon;
grant execute on function public.editar_compromisso(uuid, text, numeric, boolean, uuid, text) to authenticated;
