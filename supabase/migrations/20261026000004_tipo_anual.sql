-- Contas anuais (IPVA, IPTU, licenciamento, matrícula...): repetem todo ano e,
-- a cada ano, podem ser pagas em cota única ou parceladas.
-- Fica em migration separada porque um valor novo de enum só pode ser usado
-- depois que a transação que o criou é confirmada.
alter type public.tipo_compromisso add value if not exists 'anual';
