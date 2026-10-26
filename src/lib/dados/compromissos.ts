import "server-only";
import { getUsuario } from "@/lib/auth";
import type { Frequencia, TipoCompromisso } from "@/lib/catalogo";
import { decifrar } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import type { LinhaCompromissoResumo } from "@/types/views";

// Itens do catálogo que o usuário já tem como compromisso ativo.
export async function modelosCadastrados(): Promise<Set<string>> {
  const usuario = await getUsuario();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("compromissos")
    .select("modelo_enc")
    .eq("status", "ativo")
    .not("modelo_enc", "is", null);
  if (error) throw error;

  return new Set(data.map((c) => decifrar(c.modelo_enc, usuario.id)));
}

export type ResumoCompromisso = {
  id: string;
  tipo: TipoCompromisso;
  categoriaId: string | null;
  descricao: string;
  frequencia: Frequencia;
  valorParcela: number;
  valorVariavel: boolean;
  totalParcelas: number | null;
  valorAnual: number | null;
  parcelasPorAno: number | null;
  status: "ativo" | "quitado" | "cancelado";
  encerradoEm: string | null;
  parcelasPagas: number;
  parcelasAtrasadas: number;
  totalPago: number;
  saldoDevedor: number | null;
  proximoVencimento: string | null;
  /** Quanto pesa por mês, convertendo frequências e contas anuais para base mensal. */
  equivalenteMensal: number;
};

const MESES: Record<Frequencia, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 };

export async function listarCompromissos(): Promise<ResumoCompromisso[]> {
  const usuario = await getUsuario();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vw_compromissos_resumo")
    .select(
      "id, tipo, categoria_id, descricao_enc, frequencia, valor_parcela, valor_variavel, total_parcelas, valor_anual, parcelas_por_ano, status, encerrado_em, parcelas_pagas, parcelas_atrasadas, total_pago, saldo_devedor, proximo_vencimento",
    );
  if (error) throw error;

  return (data as LinhaCompromissoResumo[])
    .map((c) => {
      const valorParcela = Number(c.valor_parcela);
      const valorAnual = c.valor_anual === null ? null : Number(c.valor_anual);
      return {
        id: c.id,
        tipo: c.tipo,
        categoriaId: c.categoria_id,
        descricao: decifrar(c.descricao_enc, usuario.id),
        frequencia: c.frequencia,
        valorParcela,
        valorVariavel: c.valor_variavel,
        totalParcelas: c.total_parcelas,
        valorAnual,
        parcelasPorAno: c.parcelas_por_ano,
        status: c.status,
        encerradoEm: c.encerrado_em,
        parcelasPagas: Number(c.parcelas_pagas),
        parcelasAtrasadas: Number(c.parcelas_atrasadas),
        totalPago: Number(c.total_pago),
        saldoDevedor: c.saldo_devedor === null ? null : Number(c.saldo_devedor),
        proximoVencimento: c.proximo_vencimento,
        equivalenteMensal:
          Math.round(((valorAnual !== null ? valorAnual / 12 : valorParcela / MESES[c.frequencia as Frequencia])) * 100) / 100,
      };
    })
    .sort((a, b) => (a.proximoVencimento ?? "9999").localeCompare(b.proximoVencimento ?? "9999"));
}
