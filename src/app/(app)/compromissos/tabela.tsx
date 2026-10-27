import { CircleAlert } from "lucide-react";
import { Valor } from "@/components/app/dinheiro";
import { AmostraCategoria } from "@/components/app/icones";
import { FREQUENCIAS, TIPOS_COMPROMISSO } from "@/lib/catalogo";
import type { ResumoCompromisso } from "@/lib/dados/compromissos";
import { formatarData } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcoesCompromisso } from "./acoes";

export type Cat = { chave: string | null; cor: string; nome: string };

export function Tabela({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 border-y bg-card md:mx-0 md:rounded-lg md:border">
      {/* Cabeçalho de colunas só no desktop */}
      <div className="hidden grid-cols-[minmax(0,1fr)_160px_130px_210px] gap-6 border-b px-4 py-2 xl:grid">
        <span className="rotulo">Compromisso</span>
        <span className="rotulo">Andamento</span>
        <span className="rotulo text-right">Valor</span>
        <span className="rotulo text-right">Ações</span>
      </div>
      <ul className="divide-y">{children}</ul>
    </div>
  );
}

export function Linha({ c, categoria, hoje }: { c: ResumoCompromisso; categoria?: Cat; hoje: string }) {
  const temPrazo = TIPOS_COMPROMISSO[c.tipo].temPrazo;
  const progresso = temPrazo && c.totalParcelas ? Math.min(100, (c.parcelasPagas / c.totalParcelas) * 100) : null;
  const encerrado = c.status !== "ativo";
  const tipo =
    c.tipo === "anual"
      ? "Conta anual"
      : `${TIPOS_COMPROMISSO[c.tipo].nome}${c.frequencia !== "mensal" ? ` · ${FREQUENCIAS[c.frequencia].toLowerCase()}` : ""}`;
  const situacao = encerrado
    ? `${c.status === "quitado" ? "Quitado" : "Cancelado"} em ${formatarData(c.encerradoEm!)}`
    : c.proximoVencimento
      ? `Próximo ${formatarData(c.proximoVencimento).slice(0, 5)}`
      : null;

  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-4 py-3.5 xl:grid-cols-[minmax(0,1fr)_160px_130px_210px] xl:gap-6",
        encerrado && "text-muted-foreground",
      )}
    >
      {/* Compromisso */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{c.descricao}</p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <AmostraCategoria cor={categoria?.cor} />
          {categoria?.nome ?? "Sem categoria"} · {tipo}
        </p>
      </div>

      {/* Valor (no celular fica à direita do nome) */}
      <div className="text-right xl:order-3">
        <Valor valor={c.tipo === "anual" && c.valorAnual !== null ? c.valorAnual : c.valorParcela} estimado={c.valorVariavel} className="text-sm font-medium" />
        <p className="text-xs text-muted-foreground">{c.tipo === "anual" ? "por ano" : temPrazo ? "por parcela" : c.frequencia === "mensal" ? "por mês" : "por cobrança"}</p>
      </div>

      {/* Andamento */}
      <div className={cn("col-span-2 flex flex-col gap-1.5 xl:order-2 xl:col-span-1", progresso === null && "hidden xl:flex")}>
        {progresso !== null ? (
          <>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="dinheiro">
                {c.parcelasPagas}/{c.totalParcelas}
              </span>
              {c.saldoDevedor !== null && c.saldoDevedor > 0 && (
                <span
                  className="text-muted-foreground"
                  title={[
                    c.saldoInformado ? "Saldo informado, com as parcelas pagas já descontadas" : "Calculado pelas parcelas que faltam",
                    c.taxaJuros ? `juros de ${c.taxaJuros.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ao mês` : "sem juros",
                  ].join(" · ")}
                >
                  faltam <Valor valor={c.saldoDevedor} />
                </span>
              )}
            </div>
            <div
              className="h-1 rounded-[1px] bg-chart-track"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progresso)}
              aria-label="Parcelas pagas"
            >
              <div className="h-full rounded-[1px] bg-chart-1" style={{ width: `${progresso}%` }} />
            </div>
          </>
        ) : (
          <span className="hidden text-xs text-muted-foreground xl:inline">{c.tipo === "anual" ? "Todo ano" : "Recorrente"}</span>
        )}
      </div>

      {/* Situação + ações */}
      <div className="col-span-2 flex items-center justify-between gap-2 xl:order-4 xl:col-span-1 xl:flex-col xl:items-end xl:gap-1">
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground xl:justify-end">
          <span className={cn(c.parcelasAtrasadas > 0 && "xl:hidden")}>{situacao}</span>
          {c.parcelasAtrasadas > 0 && <Atrasadas n={c.parcelasAtrasadas} />}
        </span>
        <AcoesCompromisso
          id={c.id}
          descricao={c.descricao}
          ativo={!encerrado}
          podeQuitar={temPrazo}
          saldoDevedor={c.saldoDevedor}
          hoje={hoje}
        />
      </div>
    </li>
  );
}

function Atrasadas({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-1 font-medium text-critico">
      <CircleAlert className="size-3" />
      {n} {n === 1 ? "atrasada" : "atrasadas"}
    </span>
  );
}
