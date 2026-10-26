import type { Database } from "@/types/database";

// O Postgres marca toda coluna de view como anulável, mesmo quando a tabela de origem
// garante NOT NULL. Este tipo devolve a obrigatoriedade às colunas indicadas.
export type SemNulos<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };

type Views = Database["public"]["Views"];

export type LinhaLancamento = SemNulos<
  Views["vw_lancamentos"]["Row"],
  | "id"
  | "user_id"
  | "tipo"
  | "descricao_enc"
  | "valor"
  | "valor_estimado"
  | "data_vencimento"
  | "status"
  | "situacao"
>;

export type LinhaCompromissoResumo = SemNulos<
  Views["vw_compromissos_resumo"]["Row"],
  | "id"
  | "user_id"
  | "tipo"
  | "descricao_enc"
  | "frequencia"
  | "valor_parcela"
  | "valor_variavel"
  | "primeira_parcela"
  | "data_vencimento_inicial"
  | "status"
  | "parcelas_pagas"
  | "parcelas_pendentes"
  | "parcelas_atrasadas"
  | "total_pago"
>;
