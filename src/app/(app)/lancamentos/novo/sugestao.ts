// Campos que a leitura com IA devolve para pré-preencher o formulário de novo gasto.
export type SugestaoIA = {
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  categoriaId: string | null;
  linhaDigitavel: string | null;
  pareceRecorrente: boolean;
  confianca: "alta" | "media" | "baixa";
};
