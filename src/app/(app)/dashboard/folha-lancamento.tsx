"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  desfazerPagamento,
  editarLancamentoAvulso,
  excluirLancamentoAvulso,
  informarValorReal,
  pagarLancamento,
  type EstadoAcao,
} from "@/app/(app)/lancamentos/actions";
import { CampoData } from "@/components/app/campo-data";
import { AreaTexto, Campo, Selecao, estiloInput } from "@/components/app/campos";
import { ValorDestaque } from "@/components/app/dinheiro";
import { AmostraCategoria } from "@/components/app/icones";
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
  /** Todas as categorias do usuário, por id (para o formulário de edição). */
  categorias: Record<string, CategoriaResumida>;
  hoje: string;
  aoFechar: () => void;
};

export function FolhaLancamento({ lancamento, categoria, categorias, hoje, aoFechar }: Props) {
  // Mantém o conteúdo durante a animação de fechamento.
  const [ultimo, setUltimo] = useState<Lancamento | null>(lancamento);
  if (lancamento && lancamento !== ultimo) setUltimo(lancamento);
  const l = lancamento ?? ultimo;

  return (
    <Painel
      aberto={lancamento !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={l?.descricao ?? ""}
      descricao={
        <span className="flex items-center gap-1.5">
          <AmostraCategoria cor={categoria?.cor} />
          {categoria?.nome ?? "Sem categoria"}
        </span>
      }
    >
      {l && <Conteudo key={l.id} l={l} categorias={categorias} hoje={hoje} aoFechar={aoFechar} />}
    </Painel>
  );
}

function Conteudo({
  l,
  categorias,
  hoje,
  aoFechar,
}: {
  l: Lancamento;
  categorias: Record<string, CategoriaResumida>;
  hoje: string;
  aoFechar: () => void;
}) {
  const pendente = l.situacao === "pendente" || l.situacao === "atrasado";
  const [modo, setModo] = useState<"pagar" | "valor" | "editar" | "excluir" | null>(
    l.valorEstimado && pendente ? "valor" : null,
  );
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

  if (modo === "editar") {
    return <FormEditarAvulso l={l} categorias={categorias} aoCancelar={() => setModo(null)} aoConcluir={aoFechar} />;
  }
  if (modo === "excluir") {
    return <ConfirmarExclusao l={l} aoCancelar={() => setModo(null)} aoConcluir={aoFechar} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <ValorDestaque
          valor={l.situacao === "pago" && l.valorPago !== null ? l.valorPago : l.valor}
          estimado={l.valorEstimado && pendente}
          className="text-4xl leading-none font-medium tracking-[-0.04em]"
        />
        <p
          className={cn(
            "mt-2 text-[13px] text-muted-foreground",
            l.situacao === "atrasado" && "font-medium text-critico",
            l.situacao === "pago" && "text-sucesso",
          )}
        >
          {l.situacao === "pago" ? "Paga" : prazoRelativo(l.dataVencimento, hoje)}
          {l.valorEstimado && pendente && " · valor estimado"}
        </p>
      </div>

      {/* Linhas de recibo: rótulo à esquerda, valor à direita */}
      <dl className="divide-y border-y text-[13px]">
        {detalhes.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">{rotulo}</dt>
            <dd className="dinheiro">{valor}</dd>
          </div>
        ))}
        {l.observacao && (
          <div className="flex flex-col gap-1 py-2.5">
            <dt className="text-muted-foreground">Observação</dt>
            <dd className="whitespace-pre-line">{l.observacao}</dd>
          </div>
        )}
      </dl>

      {pendente && modo === "pagar" && <FormPagar l={l} hoje={hoje} aoConcluir={aoFechar} />}
      {pendente && modo === "valor" && <FormValorReal l={l} aoConcluir={() => setModo(null)} />}

      {pendente && modo === null && (
        <div className="flex flex-col gap-2">
          <Button size="lg" className="h-11 rounded-md text-sm" onClick={() => setModo("pagar")}>
            Marcar como paga
          </Button>
          {l.valorEstimado && (
            <Button size="lg" variant="outline" className="h-11 rounded-md text-sm" onClick={() => setModo("valor")}>
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
          className="h-11 rounded-md text-sm"
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

      {/* Ações secundárias: avulso edita/exclui aqui; parcela leva ao compromisso */}
      {modo === null && (
        <div className="-mb-1 flex items-center justify-between gap-2 border-t pt-3">
          {l.tipo === "avulso" ? (
            <>
              <Button variant="ghost" size="sm" className="-ml-2 rounded-md" onClick={() => setModo("editar")}>
                <Pencil />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2 rounded-md text-critico hover:bg-critico-suave hover:text-critico"
                onClick={() => setModo("excluir")}
              >
                <Trash2 />
                Excluir
              </Button>
            </>
          ) : l.compromissoId ? (
            <Button variant="ghost" size="sm" className="-ml-2 rounded-md" asChild>
              <Link href={`/compromissos/${l.compromissoId}/editar`}>
                <Pencil />
                Editar compromisso
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FormEditarAvulso({
  l,
  categorias,
  aoCancelar,
  aoConcluir,
}: {
  l: Lancamento;
  categorias: Record<string, CategoriaResumida>;
  aoCancelar: () => void;
  aoConcluir: () => void;
}) {
  const [estado, acao, pendente] = useActionState(async (prev: EstadoAcao, formData: FormData) => {
    const r = await editarLancamentoAvulso(prev, formData);
    if (r.ok) {
      toast.success("Gasto atualizado");
      aoConcluir();
    }
    return r;
  }, {});
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={l.id} />
      <Campo rotulo="Descrição" htmlFor="editar-descricao" erro={erro("descricao")}>
        <Input
          id="editar-descricao"
          name="descricao"
          required
          maxLength={120}
          defaultValue={v?.descricao ?? l.descricao}
          aria-invalid={Boolean(erro("descricao"))}
          className={estiloInput}
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor" htmlFor="editar-valor" erro={erro("valor")}>
          <Input
            id="editar-valor"
            name="valor"
            inputMode="decimal"
            defaultValue={v?.valor ?? formatarValor(l.situacao === "pago" && l.valorPago !== null ? l.valorPago : l.valor)}
            aria-invalid={Boolean(erro("valor"))}
            className={estiloInput}
          />
        </Campo>
        <Campo rotulo="Data" htmlFor="editar-data" erro={erro("data")}>
          <CampoData id="editar-data" name="data" defaultValue={v?.data ?? l.dataVencimento} invalido={Boolean(erro("data"))} />
        </Campo>
      </div>
      <Campo rotulo="Categoria" htmlFor="editar-categoria" erro={erro("categoriaId")}>
        <Selecao id="editar-categoria" name="categoriaId" defaultValue={v?.categoriaId ?? l.categoriaId ?? ""}>
          <option value="">Sem categoria</option>
          {Object.entries(categorias).map(([id, c]) => (
            <option key={id} value={id}>
              {c.nome}
            </option>
          ))}
        </Selecao>
      </Campo>
      <Campo rotulo="Observação (opcional)" htmlFor="editar-observacao" erro={erro("observacao")}>
        <AreaTexto id="editar-observacao" name="observacao" rows={2} maxLength={500} defaultValue={v?.observacao ?? l.observacao ?? ""} />
      </Campo>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" size="lg" variant="outline" className="h-11 rounded-md text-sm" onClick={aoCancelar}>
          Voltar
        </Button>
        <Button size="lg" disabled={pendente} className="h-11 rounded-md text-sm">
          {pendente ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function ConfirmarExclusao({ l, aoCancelar, aoConcluir }: { l: Lancamento; aoCancelar: () => void; aoConcluir: () => void }) {
  const [excluindo, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        Excluir <strong className="font-semibold">{l.descricao}</strong> ({formatarMoeda(l.valorPago ?? l.valor)})?
      </p>
      <p className="text-[13px] text-muted-foreground">O gasto some das listas e dos totais. Essa ação não pode ser desfeita.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" variant="outline" className="h-11 rounded-md text-sm" onClick={aoCancelar}>
          Voltar
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={excluindo}
          className="h-11 rounded-md text-sm"
          onClick={() =>
            iniciar(async () => {
              const r = await excluirLancamentoAvulso(l.id);
              if (r.ok) {
                toast("Gasto excluído");
                aoConcluir();
              } else toast.error(r.mensagem ?? "Não foi possível excluir.");
            })
          }
        >
          {excluindo ? "Excluindo…" : "Excluir gasto"}
        </Button>
      </div>
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
          <CampoData id="dataPagamento" name="dataPagamento" defaultValue={hoje} invalido={Boolean(estado.erros?.dataPagamento)} />
        </Campo>
      </div>
      <p className="text-xs text-muted-foreground">Pagou com juros, multa ou desconto? Ajuste o valor que saiu da conta.</p>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <Button size="lg" disabled={pendente} className="h-11 rounded-md text-sm">
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
      <Button size="lg" disabled={pendente} className="h-11 rounded-md text-sm">
        {pendente ? "Salvando…" : "Salvar valor"}
      </Button>
    </form>
  );
}
