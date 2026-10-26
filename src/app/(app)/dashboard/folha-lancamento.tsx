"use client";

import { useActionState, useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  desfazerPagamento,
  informarValorReal,
  pagarLancamento,
  type EstadoAcao,
} from "@/app/(app)/lancamentos/actions";
import { Campo, estiloInput } from "@/components/app/campos";
import { BolhaCategoria } from "@/components/app/icones";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Lancamento } from "@/lib/dados/lancamentos";
import { formatarData, formatarMoeda, prazoRelativo } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { CategoriaResumida } from "./lista-contas";

const formatarValor = (n: number) => n.toFixed(2).replace(".", ",");

type Props = {
  lancamento: Lancamento | null;
  categoria?: CategoriaResumida;
  hoje: string;
  aoFechar: () => void;
};

export function FolhaLancamento({ lancamento, categoria, hoje, aoFechar }: Props) {
  // Mantém o conteúdo durante a animação de fechamento.
  const [ultimo, setUltimo] = useState<Lancamento | null>(lancamento);
  if (lancamento && lancamento !== ultimo) setUltimo(lancamento);
  const l = lancamento ?? ultimo;

  return (
    <Painel
      aberto={lancamento !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={l?.descricao ?? ""}
      descricao={categoria?.nome ?? "Sem categoria"}
    >
      {l && <Conteudo key={l.id} l={l} categoria={categoria} hoje={hoje} aoFechar={aoFechar} />}
    </Painel>
  );
}

function Conteudo({ l, categoria, hoje, aoFechar }: { l: Lancamento; categoria?: CategoriaResumida; hoje: string; aoFechar: () => void }) {
  const pendente = l.situacao === "pendente" || l.situacao === "atrasado";
  const [modo, setModo] = useState<"pagar" | "valor" | null>(l.valorEstimado && pendente ? "valor" : null);
  const [desfazendo, iniciar] = useTransition();

  const detalhes: [string, string][] = [
    ["Vencimento", formatarData(l.dataVencimento)],
    ...(l.numeroParcela
      ? [["Parcela", l.totalParcelas ? `${l.numeroParcela} de ${l.totalParcelas}` : `${l.numeroParcela}${l.anoReferencia ? ` (${l.anoReferencia})` : ""}`] as [string, string]]
      : []),
    ...(l.situacao === "pago" && l.dataPagamento ? [["Pago em", formatarData(l.dataPagamento)] as [string, string]] : []),
    ...(l.situacao === "pago" && l.valorPago !== null && l.valorPago !== l.valor
      ? [["Previsto", formatarMoeda(l.valor)] as [string, string]]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
        <BolhaCategoria chave={categoria?.chave} cor={categoria?.cor} tamanho="lg" />
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {l.valorEstimado && pendente && <span className="font-normal text-muted-foreground">≈ </span>}
            {formatarMoeda(l.situacao === "pago" && l.valorPago !== null ? l.valorPago : l.valor)}
          </p>
          <p className={cn("text-sm text-muted-foreground", l.situacao === "atrasado" && "font-medium text-critico")}>
            {l.situacao === "pago" ? "Paga" : prazoRelativo(l.dataVencimento, hoje)}
            {l.valorEstimado && pendente && " · valor estimado"}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {detalhes.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="font-medium">{valor}</dd>
          </div>
        ))}
      </dl>

      {pendente && modo === "pagar" && <FormPagar l={l} hoje={hoje} aoConcluir={aoFechar} />}
      {pendente && modo === "valor" && <FormValorReal l={l} aoConcluir={() => setModo(null)} />}

      {pendente && modo === null && (
        <div className="flex flex-col gap-2">
          <Button size="lg" className="h-12 rounded-xl text-[15px]" onClick={() => setModo("pagar")}>
            Marcar como paga
          </Button>
          {l.valorEstimado && (
            <Button size="lg" variant="outline" className="h-12 rounded-xl text-[15px]" onClick={() => setModo("valor")}>
              Informar valor real
            </Button>
          )}
        </div>
      )}

      {l.situacao === "pago" && l.tipo !== "quitacao" && (
        <Button
          size="lg"
          variant="outline"
          disabled={desfazendo}
          className="h-12 rounded-xl text-[15px]"
          onClick={() =>
            iniciar(async () => {
              const r = await desfazerPagamento(l.id);
              if (r.ok) {
                toast("Pagamento desfeito");
                aoFechar();
              } else toast.error(r.mensagem ?? "Não foi possível desfazer.");
            })
          }
        >
          <Undo2 />
          Desfazer pagamento
        </Button>
      )}
    </div>
  );
}

function FormPagar({ l, hoje, aoConcluir }: { l: Lancamento; hoje: string; aoConcluir: () => void }) {
  const [estado, acao, pendente] = useActionState(async (prev: EstadoAcao, formData: FormData) => {
    const r = await pagarLancamento(prev, formData);
    if (r.ok) {
      toast.success(`${l.descricao} paga`, {
        action: { label: "Desfazer", onClick: () => void desfazerPagamento(l.id) },
      });
      aoConcluir();
    }
    return r;
  }, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={l.id} />
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor pago" htmlFor="valorPago" erro={estado.erros?.valorPago?.[0]}>
          <Input
            id="valorPago"
            name="valorPago"
            inputMode="decimal"
            defaultValue={formatarValor(l.valor)}
            aria-invalid={Boolean(estado.erros?.valorPago)}
            className={estiloInput}
            autoFocus
          />
        </Campo>
        <Campo rotulo="Data" htmlFor="dataPagamento" erro={estado.erros?.dataPagamento?.[0]}>
          <Input id="dataPagamento" name="dataPagamento" type="date" defaultValue={hoje} className={estiloInput} />
        </Campo>
      </div>
      <p className="text-xs text-muted-foreground">Pagou com juros, multa ou desconto? Ajuste o valor que saiu da conta.</p>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <Button size="lg" disabled={pendente} className="h-12 rounded-xl text-[15px]">
        {pendente ? "Salvando…" : "Confirmar pagamento"}
      </Button>
    </form>
  );
}

function FormValorReal({ l, aoConcluir }: { l: Lancamento; aoConcluir: () => void }) {
  const [estado, acao, pendente] = useActionState(async (prev: EstadoAcao, formData: FormData) => {
    const r = await informarValorReal(prev, formData);
    if (r.ok) {
      toast.success("Valor atualizado");
      aoConcluir();
    }
    return r;
  }, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={l.id} />
      <Campo
        rotulo="Valor da conta"
        htmlFor="valor"
        erro={estado.erros?.valor?.[0] ?? estado.mensagem}
        ajuda="A conta chegou? Troque a estimativa pelo valor real."
      >
        <Input
          id="valor"
          name="valor"
          inputMode="decimal"
          defaultValue={formatarValor(l.valor)}
          aria-invalid={Boolean(estado.erros?.valor)}
          className={estiloInput}
          autoFocus
        />
      </Campo>
      <Button size="lg" disabled={pendente} className="h-12 rounded-xl text-[15px]">
        {pendente ? "Salvando…" : "Salvar valor"}
      </Button>
    </form>
  );
}
