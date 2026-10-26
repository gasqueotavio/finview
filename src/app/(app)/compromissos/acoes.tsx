"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Campo, estiloInput } from "@/components/app/campos";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/formato";
import { cancelarCompromisso, quitarCompromisso, type EstadoForm } from "./actions";

type Props = { id: string; descricao: string; podeQuitar: boolean; saldoDevedor: number | null; hoje: string };

export function AcoesCompromisso({ id, descricao, podeQuitar, saldoDevedor, hoje }: Props) {
  const [painel, setPainel] = useState<"quitar" | "cancelar" | null>(null);

  return (
    <div className="flex gap-1">
      {podeQuitar && (
        <Button variant="ghost" size="sm" className="rounded-lg text-primary" onClick={() => setPainel("quitar")}>
          Quitar
        </Button>
      )}
      <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground" onClick={() => setPainel("cancelar")}>
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
        <p className="rounded-xl bg-muted/60 p-3 text-sm">
          Saldo das parcelas restantes: <strong className="tabular-nums">{formatarMoeda(saldoDevedor)}</strong>
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
          <Input id="dataQuitacao" name="data" type="date" defaultValue={estado.valores?.data ?? hoje} className={estiloInput} />
        </Campo>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Peça ao banco o valor para quitação: pelo Código de Defesa do Consumidor (art. 52), os juros das parcelas futuras precisam
        ser descontados, então ele costuma ser menor que o saldo.
      </p>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <Button size="lg" disabled={pendente} className="h-12 rounded-xl text-[15px]">
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
        <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={aoConcluir}>
          Voltar
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={pendente}
          className="h-12 rounded-xl"
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
