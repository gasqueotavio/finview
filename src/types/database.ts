export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          arquivada: boolean
          atualizado_em: string
          chave: string | null
          cor: string
          criado_em: string
          icone: string | null
          id: string
          nome_enc: string
          user_id: string
        }
        Insert: {
          arquivada?: boolean
          atualizado_em?: string
          chave?: string | null
          cor?: string
          criado_em?: string
          icone?: string | null
          id?: string
          nome_enc: string
          user_id?: string
        }
        Update: {
          arquivada?: boolean
          atualizado_em?: string
          chave?: string | null
          cor?: string
          criado_em?: string
          icone?: string | null
          id?: string
          nome_enc?: string
          user_id?: string
        }
        Relationships: []
      }
      compromissos: {
        Row: {
          atualizado_em: string
          categoria_id: string | null
          criado_em: string
          data_vencimento_inicial: string
          descricao_enc: string
          encerrado_em: string | null
          frequencia: Database["public"]["Enums"]["frequencia"]
          id: string
          modelo_enc: string | null
          observacao_enc: string | null
          parcelas_por_ano: number | null
          primeira_parcela: number
          status: Database["public"]["Enums"]["status_compromisso"]
          tipo: Database["public"]["Enums"]["tipo_compromisso"]
          total_parcelas: number | null
          user_id: string
          valor_anual: number | null
          valor_parcela: number
          valor_variavel: boolean
        }
        Insert: {
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          data_vencimento_inicial: string
          descricao_enc: string
          encerrado_em?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia"]
          id?: string
          modelo_enc?: string | null
          observacao_enc?: string | null
          parcelas_por_ano?: number | null
          primeira_parcela?: number
          status?: Database["public"]["Enums"]["status_compromisso"]
          tipo: Database["public"]["Enums"]["tipo_compromisso"]
          total_parcelas?: number | null
          user_id?: string
          valor_anual?: number | null
          valor_parcela: number
          valor_variavel?: boolean
        }
        Update: {
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          data_vencimento_inicial?: string
          descricao_enc?: string
          encerrado_em?: string | null
          frequencia?: Database["public"]["Enums"]["frequencia"]
          id?: string
          modelo_enc?: string | null
          observacao_enc?: string | null
          parcelas_por_ano?: number | null
          primeira_parcela?: number
          status?: Database["public"]["Enums"]["status_compromisso"]
          tipo?: Database["public"]["Enums"]["tipo_compromisso"]
          total_parcelas?: number | null
          user_id?: string
          valor_anual?: number | null
          valor_parcela?: number
          valor_variavel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_categoria_id_user_id_fkey"
            columns: ["categoria_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          ano_referencia: number | null
          atualizado_em: string
          categoria_id: string | null
          compromisso_id: string | null
          criado_em: string
          data_pagamento: string | null
          data_vencimento: string
          descricao_enc: string
          id: string
          numero_parcela: number | null
          observacao_enc: string | null
          status: Database["public"]["Enums"]["status_lancamento"]
          tipo: Database["public"]["Enums"]["tipo_lancamento"]
          user_id: string
          valor: number
          valor_estimado: boolean
          valor_pago: number | null
        }
        Insert: {
          ano_referencia?: number | null
          atualizado_em?: string
          categoria_id?: string | null
          compromisso_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao_enc: string
          id?: string
          numero_parcela?: number | null
          observacao_enc?: string | null
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          user_id?: string
          valor: number
          valor_estimado?: boolean
          valor_pago?: number | null
        }
        Update: {
          ano_referencia?: number | null
          atualizado_em?: string
          categoria_id?: string | null
          compromisso_id?: string | null
          criado_em?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao_enc?: string
          id?: string
          numero_parcela?: number | null
          observacao_enc?: string | null
          status?: Database["public"]["Enums"]["status_lancamento"]
          tipo?: Database["public"]["Enums"]["tipo_lancamento"]
          user_id?: string
          valor?: number
          valor_estimado?: boolean
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_user_id_fkey"
            columns: ["categoria_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "lancamentos_compromisso_id_user_id_fkey"
            columns: ["compromisso_id", "user_id"]
            isOneToOne: false
            referencedRelation: "compromissos"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "lancamentos_compromisso_id_user_id_fkey"
            columns: ["compromisso_id", "user_id"]
            isOneToOne: false
            referencedRelation: "vw_compromissos_resumo"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      vw_compromissos_resumo: {
        Row: {
          atualizado_em: string | null
          categoria_id: string | null
          criado_em: string | null
          data_vencimento_inicial: string | null
          descricao_enc: string | null
          encerrado_em: string | null
          frequencia: Database["public"]["Enums"]["frequencia"] | null
          id: string | null
          modelo_enc: string | null
          observacao_enc: string | null
          parcelas_atrasadas: number | null
          parcelas_pagas: number | null
          parcelas_pendentes: number | null
          parcelas_por_ano: number | null
          primeira_parcela: number | null
          proximo_vencimento: string | null
          saldo_devedor: number | null
          status: Database["public"]["Enums"]["status_compromisso"] | null
          tipo: Database["public"]["Enums"]["tipo_compromisso"] | null
          total_pago: number | null
          total_parcelas: number | null
          user_id: string | null
          valor_anual: number | null
          valor_parcela: number | null
          valor_variavel: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_categoria_id_user_id_fkey"
            columns: ["categoria_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      vw_lancamentos: {
        Row: {
          ano_referencia: number | null
          atualizado_em: string | null
          categoria_id: string | null
          compromisso_id: string | null
          criado_em: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao_enc: string | null
          id: string | null
          numero_parcela: number | null
          observacao_enc: string | null
          situacao: string | null
          status: Database["public"]["Enums"]["status_lancamento"] | null
          tipo: Database["public"]["Enums"]["tipo_lancamento"] | null
          user_id: string | null
          valor: number | null
          valor_estimado: boolean | null
          valor_pago: number | null
        }
        Insert: {
          ano_referencia?: number | null
          atualizado_em?: string | null
          categoria_id?: string | null
          compromisso_id?: string | null
          criado_em?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao_enc?: string | null
          id?: string | null
          numero_parcela?: number | null
          observacao_enc?: string | null
          situacao?: never
          status?: Database["public"]["Enums"]["status_lancamento"] | null
          tipo?: Database["public"]["Enums"]["tipo_lancamento"] | null
          user_id?: string | null
          valor?: number | null
          valor_estimado?: boolean | null
          valor_pago?: number | null
        }
        Update: {
          ano_referencia?: number | null
          atualizado_em?: string | null
          categoria_id?: string | null
          compromisso_id?: string | null
          criado_em?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao_enc?: string | null
          id?: string | null
          numero_parcela?: number | null
          observacao_enc?: string | null
          situacao?: never
          status?: Database["public"]["Enums"]["status_lancamento"] | null
          tipo?: Database["public"]["Enums"]["tipo_lancamento"] | null
          user_id?: string | null
          valor?: number | null
          valor_estimado?: boolean | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_user_id_fkey"
            columns: ["categoria_id", "user_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "lancamentos_compromisso_id_user_id_fkey"
            columns: ["compromisso_id", "user_id"]
            isOneToOne: false
            referencedRelation: "compromissos"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "lancamentos_compromisso_id_user_id_fkey"
            columns: ["compromisso_id", "user_id"]
            isOneToOne: false
            referencedRelation: "vw_compromissos_resumo"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      vw_resumo_mensal: {
        Row: {
          mes: string | null
          total_atrasado: number | null
          total_pago: number | null
          total_pendente: number | null
          total_previsto: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancelar_compromisso: {
        Args: { p_compromisso_id: string; p_data?: string }
        Returns: undefined
      }
      desfazer_pagamento: {
        Args: { p_lancamento_id: string }
        Returns: undefined
      }
      editar_compromisso: {
        Args: {
          p_categoria_id?: string
          p_compromisso_id: string
          p_descricao_enc: string
          p_observacao_enc?: string
          p_valor_parcela: number
          p_valor_variavel: boolean
        }
        Returns: undefined
      }
      excluir_minha_conta: { Args: never; Returns: undefined }
      gerar_lancamentos: {
        Args: { p_compromisso_id: string; p_horizonte?: string }
        Returns: number
      }
      gerar_lancamentos_recorrentes: { Args: never; Returns: number }
      inserir_parcelas_do_ano: {
        Args: {
          p_ano: number
          p_compromisso_id: string
          p_estimado: boolean
          p_parcelas: number
          p_primeiro: string
          p_valor_total: number
        }
        Returns: number
      }
      meses_da_frequencia: {
        Args: { f: Database["public"]["Enums"]["frequencia"] }
        Returns: number
      }
      pagar_lancamento: {
        Args: { p_data: string; p_lancamento_id: string; p_valor_pago: number }
        Returns: undefined
      }
      quitar_compromisso: {
        Args: {
          p_compromisso_id: string
          p_data: string
          p_descricao_enc: string
          p_valor: number
        }
        Returns: string
      }
      replanejar_ano: {
        Args: {
          p_ano: number
          p_compromisso_id: string
          p_parcelas: number
          p_primeiro_vencimento: string
          p_valor_total: number
        }
        Returns: number
      }
      valor_da_parcela: {
        Args: { p_numero: number; p_parcelas: number; p_total: number }
        Returns: number
      }
    }
    Enums: {
      frequencia: "mensal" | "bimestral" | "trimestral" | "semestral" | "anual"
      status_compromisso: "ativo" | "quitado" | "cancelado"
      status_lancamento: "pendente" | "pago" | "cancelado"
      tipo_compromisso:
        | "financiamento"
        | "emprestimo"
        | "parcelamento"
        | "consorcio"
        | "assinatura"
        | "fixo"
        | "anual"
      tipo_lancamento: "avulso" | "parcela" | "quitacao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      frequencia: ["mensal", "bimestral", "trimestral", "semestral", "anual"],
      status_compromisso: ["ativo", "quitado", "cancelado"],
      status_lancamento: ["pendente", "pago", "cancelado"],
      tipo_compromisso: [
        "financiamento",
        "emprestimo",
        "parcelamento",
        "consorcio",
        "assinatura",
        "fixo",
        "anual",
      ],
      tipo_lancamento: ["avulso", "parcela", "quitacao"],
    },
  },
} as const
