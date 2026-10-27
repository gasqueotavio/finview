"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, CircleAlert, CircleCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { desfazerPagamento, pagarAgora } from "@/app/(app)/lancamentos/actions";
import { Valor } from "@/components/app/dinheiro";
import { AmostraCategoria } from "@/components/app/icones";
import type { Lancamento } from "@/lib/dados/lancamentos";
import { diasEntre, formatarData, formatarMoeda, prazoRelativo } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { FolhaLancamento } from "./folha-lancamento";

const diaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

export type CategoriaResumida = { chave: string | null; nome: string; cor: string };

type Props = {
  lancamentos: Lancamento[];
  categorias: Record<string, CategoriaResumida>;
  hoje: string;
};

export function ListaContas({ lancamentos, categorias, hoje }: Props) {
  const [, iniciar] = useTransition();
  // Some da lista "a pagar" na hora; o servidor confirma em seguida.
  const [lista, marcarPago] = useOptimistic(lancamentos, (atual, id: string) =>
    atual.map((l) =>
      l.id === id ? { ...l, situacao: "pago" as const, dataPagamento: hoje, valorPago: l.valor } : l,
    ),
  );

  // Guarda só o id: depois de pagar ou corrigir o valor, o painel mostra os dados novos.
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const selecionado = lista.find((l) => l.id === selecionadoId) ?? null;

  const aPagar = lista.filter((l) => l.situacao === "pendente" || l.situacao === "atrasado");
  const pagas = lista.filter((l) => l.situacao === "pago");

  function pagarRapido(l: Lancamento) {
    iniciar(async () => {
      marcarPago(l.id);
      const r = await pagarAgora(l.id);
      if (!r.ok) {
        toast.error(r.mensagem ?? "Não foi possível pagar.");
        return;
      }
      toast.success(`${l.descricao} paga`, {
        description: formatarMoeda(l.valor),
        action: {
          label: "Desfazer",
          onClick: async () => {
            const d = await desfazerPagamento(l.id);
            if (!d.ok) toast.error(d.mensagem ?? "Não foi possível desfazer.");
          },
        },
      });
    });
  }

  // Agrupa as contas a pagar por dia de vencimento
  const grupos = new Map<string, Lancamento[]>();
  for (const l of aPagar) grupos.set(l.dataVencimento, [...(grupos.get(l.dataVencimento) ?? []), l]);

  const totalAPagar = aPagar.reduce((soma, l) => soma + l.valor, 0);

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[15px] font-semibold">Vencimentos</h2>
          {aPagar.length > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {aPagar.length} a pagar · <Valor valor={totalAPagar} className="text-foreground" />
            </p>
          )}
        </div>

        {aPagar.length === 0 ? (
          <div className="flex items-center gap-3 border-y py-5 text-sm">
            <CircleCheck className="size-4 text-sucesso" />
            <span>
              <strong className="font-medium">Tudo em dia.</strong>{" "}
              <span className="text-muted-foreground">Nenhuma conta pendente neste mês.</span>
            </span>
          </div>
        ) : (
          // No celular a lista vai de borda a borda, como as listas nativas; no desktop vira uma tabela com moldura.
          <ol className="-mx-4 divide-y border-y bg-card md:mx-0 md:rounded-lg md:border">
            {[...grupos.entries()].map(([dia, itens]) => (
              <li key={dia} className="grid grid-cols-[3.5rem_minmax(0,1fr)] md:grid-cols-[4rem_minmax(0,1fr)]">
                <Data iso={dia} hoje={hoje} atrasada={itens.some((l) => l.situacao === "atrasado")} />
                <ul className="divide-y">
                  {itens.map((l) => (
                    <LinhaConta
                      key={l.id}
                      l={l}
                      categoria={l.categoriaId ? categorias[l.categoriaId] : undefined}
                      hoje={hoje}
                      aoAbrir={() => setSelecionadoId(l.id)}
                      aoPagar={() => pagarRapido(l)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      {pagas.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-3.5 -rotate-90 transition-transform group-open:rotate-0" />
            <span>
              <span className="font-medium text-foreground">Pagas</span> · {pagas.length} ·{" "}
              <Valor valor={pagas.reduce((s, l) => s + (l.valorPago ?? l.valor), 0)} />
            </span>
          </summary>
          <ul className="-mx-4 mt-3 divide-y border-y bg-card md:mx-0 md:rounded-lg md:border">
            {pagas.map((l) => (
              <LinhaConta
                key={l.id}
                l={l}
                categoria={l.categoriaId ? categorias[l.categoriaId] : undefined}
                hoje={hoje}
                aoAbrir={() => setSelecionadoId(l.id)}
              />
            ))}
          </ul>
        </details>
      )}

      <FolhaLancamento
        lancamento={selecionado}
        categoria={selecionado?.categoriaId ? categorias[selecionado.categoriaId] : undefined}
        categorias={categorias}
        hoje={hoje}
        aoFechar={() => setSelecionadoId(null)}
      />
    </>
  );
}

/** Coluna da data, como num extrato: o dia em destaque e o dia da semana embaixo. */
function Data({ iso, hoje, atrasada }: { iso: string; hoje: string; atrasada: boolean }) {
  const distancia = diasEntre(hoje, iso);
  const legenda =
    distancia === 0 ? "hoje" : distancia === 1 ? "amanhã" : distancia === -1 ? "ontem" : diaDaSemana.format(new Date(`${iso}T00:00:00Z`)).replace(".", "");

  return (
    <div className="flex flex-col items-center border-r pt-3 text-center">
      <span className={cn("dinheiro text-lg leading-none font-medium", atrasada && "text-critico")}>{iso.slice(8, 10)}</span>
      <span className={cn("mt-1 text-[10px] font-medium tracking-[0.04em] text-muted-foreground uppercase", distancia === 0 && "text-foreground")}>
        {legenda}
      </span>
    </div>
  );
}

function LinhaConta({
  l,
  categoria,
  hoje,
  aoAbrir,
  aoPagar,
}: {
  l: Lancamento;
  categoria?: CategoriaResumida;
  hoje: string;
  aoAbrir: () => void;
  aoPagar?: () => void;
}) {
  const atrasada = l.situacao === "atrasado";
  const paga = l.situacao === "pago";
  const parcela = l.numeroParcela
    ? l.totalParcelas
      ? `${l.numeroParcela}/${l.totalParcelas}`
      : l.anoReferencia
        ? `${l.numeroParcela}ª de ${l.anoReferencia}`
        : null
    : null;
  const valorExibido = paga && l.valorPago !== null ? l.valorPago : l.valor;

  return (
    <li className="group flex items-center gap-2 pl-3 transition-colors hover:bg-muted/50 md:pl-4">
      <button type="button" onClick={aoAbrir} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-medium", paga && "text-muted-foreground")}>{l.descricao}</span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {paga ? (
              <>
                <CircleCheck className="size-3 shrink-0 text-sucesso" />
                Paga {l.dataPagamento && `em ${formatarData(l.dataPagamento).slice(0, 5)}`}
              </>
            ) : atrasada ? (
              <span className="flex items-center gap-1 font-medium text-critico">
                <CircleAlert className="size-3 shrink-0" />
                {prazoRelativo(l.dataVencimento, hoje)}
              </span>
            ) : l.valorEstimado ? (
              <>
                <Clock className="size-3 shrink-0" />
                Valor estimado
              </>
            ) : (
              <>
                <AmostraCategoria cor={categoria?.cor} />
                {categoria?.nome ?? "Sem categoria"}
              </>
            )}
            {parcela && <span className="dinheiro">· {parcela}</span>}
          </span>
        </span>
        <Valor
          valor={valorExibido}
          estimado={l.valorEstimado && !paga}
          className={cn("shrink-0 text-right text-sm font-medium", paga && "font-normal text-muted-foreground")}
        />
      </button>

      {aoPagar ? (
        <button
          type="button"
          onClick={l.valorEstimado ? aoAbrir : aoPagar}
          aria-label={l.valorEstimado ? `Informar valor de ${l.descricao}` : `Marcar ${l.descricao} como paga`}
          title={l.valorEstimado ? "Informe o valor real para pagar" : "Marcar como paga"}
          className="flex size-11 shrink-0 items-center justify-center md:mr-1"
        >
          <span className="flex size-5 items-center justify-center rounded-[5px] border-[1.5px] border-input bg-card text-transparent transition-colors group-hover:border-muted-foreground [button:hover>&]:border-foreground [button:hover>&]:text-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        </button>
      ) : (
        <span className="w-2 shrink-0 md:w-3" />
      )}
    </li>
  );
}
