"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, CircleAlert, CircleCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { desfazerPagamento, pagarAgora } from "@/app/(app)/lancamentos/actions";
import { BolhaCategoria } from "@/components/app/icones";
import type { Lancamento } from "@/lib/dados/lancamentos";
import { formatarData, formatarMoeda, prazoRelativo, rotuloDoDia } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { FolhaLancamento } from "./folha-lancamento";

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

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">A pagar</h2>
        {aPagar.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-5 text-sm">
            <CircleCheck className="size-5 text-sucesso" />
            <span>
              <strong className="font-semibold">Tudo em dia.</strong>{" "}
              <span className="text-muted-foreground">Nenhuma conta pendente neste mês.</span>
            </span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            {[...grupos.entries()].map(([dia, itens]) => (
              <div key={dia}>
                <p className="border-b bg-muted/40 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground first-letter:uppercase">
                  {rotuloDoDia(dia, hoje)}
                </p>
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
              </div>
            ))}
          </div>
        )}
      </section>

      {pagas.length > 0 && (
        <details className="group flex flex-col gap-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              Pagas <span className="font-normal text-muted-foreground">· {pagas.length}</span>
            </span>
            <span className="text-sm font-medium text-primary group-open:hidden">Mostrar</span>
            <span className="hidden text-sm font-medium text-primary group-open:inline">Ocultar</span>
          </summary>
          <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card">
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
        hoje={hoje}
        aoFechar={() => setSelecionadoId(null)}
      />
    </>
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
    <li className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <button type="button" onClick={aoAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <BolhaCategoria chave={categoria?.chave} cor={categoria?.cor} />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[15px] font-medium", paga && "text-muted-foreground")}>
            {l.descricao}
          </span>
          <span className="flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
            {paga ? (
              <>
                <CircleCheck className="size-3.5 shrink-0 text-sucesso" />
                Paga {l.dataPagamento && `em ${formatarData(l.dataPagamento).slice(0, 5)}`}
              </>
            ) : atrasada ? (
              <span className="flex items-center gap-1 font-medium text-critico">
                <CircleAlert className="size-3.5 shrink-0" />
                {prazoRelativo(l.dataVencimento, hoje)}
              </span>
            ) : (
              <>
                {l.valorEstimado && <Clock className="size-3.5 shrink-0" />}
                {l.valorEstimado ? "Valor estimado" : (categoria?.nome ?? "Sem categoria")}
              </>
            )}
            {parcela && <span>· {parcela}</span>}
          </span>
        </span>
        <span className={cn("shrink-0 text-right text-[15px] font-semibold tabular-nums", paga && "font-medium text-muted-foreground")}>
          {l.valorEstimado && !paga && <span className="font-normal text-muted-foreground">≈ </span>}
          {formatarMoeda(valorExibido)}
        </span>
      </button>

      {aoPagar && (
        <button
          type="button"
          onClick={l.valorEstimado ? aoAbrir : aoPagar}
          aria-label={l.valorEstimado ? `Informar valor de ${l.descricao}` : `Marcar ${l.descricao} como paga`}
          title={l.valorEstimado ? "Informe o valor real para pagar" : "Marcar como paga"}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-input text-transparent transition hover:border-sucesso hover:text-sucesso active:scale-90"
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
      )}
    </li>
  );
}
