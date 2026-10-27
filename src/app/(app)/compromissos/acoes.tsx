"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { CampoData } from "@/components/app/campo-data";
import { Campo, estiloInput } from "@/components/app/campos";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/formato";
import { cancelarCompromisso, quitarCompromisso, type EstadoForm } from "./actions";

type Props = { id: string; descricao: string; ativo: boolean; podeQuitar: boolean; saldoDevedor: number | null; hoje: string };

export function AcoesCompromisso({ id, descricao, ativo, podeQuitar, saldoDevedor, hoje }: Props) {
  const [painel, setPainel] = useState<"quitar" | "cancelar" | null>(null);

  if (!ativo) {
    return (
      <div className="-mr-2 flex gap-0.5">
        <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground" asChild>
          <Link href={`/compromissos/${id}/editar`}>Editar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="-mr-2 flex gap-0.5">
      <Button variant="ghost" size="sm" className="rounded-md" asChild>
        <Link href={`/compromissos/${id}/editar`}>Editar</Link>
      </Button>
      {podeQuitar && (
        <Button variant="ghost" size="sm" className="rounded-md font-medium" onClick={() => setPainel("quitar")}>
          Quitar
        </Button>
      )}
      <Button variant="ghost" size="sm" className="rounded-md text-muted-foreground" onClick={() => setPainel("cancelar")}>
        Cancelar
      </Button>

      <Painel
        aberto={painel === "quitar"}
        aoMudar={(v) => !v && setPainel(null)}
        titulo="Quitar antecipadamente"
        descricao={descricao}
      >
        <FormQuitar id={id} saldoDevedor={saldoDevedor} hoje={hoje} aoConcluir={() => setPainel(null)} />
      </Painel>

      <Painel
        aberto={painel === "cancelar"}
        aoMudar={(v) => !v && setPainel(null)}
        titulo="Cancelar compromisso?"
        descricao={descricao}
      >
        <ConfirmarCancelamento id={id} aoConcluir={() => setPainel(null)} />
      </Painel>
    </div>
  );
}

function FormQuitar({ id, saldoDevedor, hoje, aoConcluir }: { id: string; saldoDevedor: number | null; hoje: string; aoConcluir: () => void }) {
  const [estado, acao, pendente] = useActionState(async (prev: EstadoForm, formData: FormData) => {
    const r = await quitarCompromisso(prev, formData);
    if (!r.mensagem && !r.erros) {
      toast.success("Compromisso quitado");
      aoConcluir();
    }
    return r;
  }, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="compromissoId" value={id} />
      {saldoDevedor !== null && (
        <p className="flex justify-between gap-4 border-y py-2.5 text-[13px]">
          <span className="text-muted-foreground">Saldo das parcelas restantes</span>
          <span className="dinheiro">{formatarMoeda(saldoDevedor)}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor da quitação" htmlFor="valorQuitacao" erro={estado.erros?.valor?.[0]}>
          <Input
            id="valorQuitacao"
            name="valor"
            inputMode="decimal"
            defaultValue={estado.valores?.valor ?? (saldoDevedor ? saldoDevedor.toFixed(2).replace(".", ",") : "")}
            aria-invalid={Boolean(estado.erros?.valor)}
            className={estiloInput}
          />
        </Campo>
        <Campo rotulo="Data" htmlFor="dataQuitacao" erro={estado.erros?.data?.[0]}>
          <CampoData id="dataQuitacao" name="data" defaultValue={estado.valores?.data ?? hoje} invalido={Boolean(estado.erros?.data)} />
        </Campo>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Peça ao banco o valor para quitação: pelo Código de Defesa do Consumidor (art. 52), os juros das parcelas futuras precisam
        ser descontados, então ele costuma ser menor que o saldo.
      </p>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <Button size="lg" disabled={pendente} className="h-11 rounded-md text-sm">
        {pendente ? "Quitando…" : "Confirmar quitação"}
      </Button>
    </form>
  );
}

function ConfirmarCancelamento({ id, aoConcluir }: { id: string; aoConcluir: () => void }) {
  const [pendente, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        As parcelas futuras ainda não pagas serão canceladas. O histórico do que já foi pago continua guardado.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" variant="outline" className="h-11 rounded-md" onClick={aoConcluir}>
          Voltar
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={pendente}
          className="h-11 rounded-md"
          onClick={() =>
            iniciar(async () => {
              const formData = new FormData();
              formData.set("id", id);
              try {
                await cancelarCompromisso(formData);
                toast("Compromisso cancelado");
                aoConcluir();
              } catch {
                toast.error("Não foi possível cancelar.");
              }
            })
          }
        >
          {pendente ? "Cancelando…" : "Cancelar compromisso"}
        </Button>
      </div>
    </div>
  );
}
