"use client";

import { useActionState } from "react";
import { Campo, CampoValor, Interruptor, Selecao, estiloInput } from "@/components/app/campos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Categoria } from "@/lib/dados/categorias";
import { criarLancamentoAvulso, type EstadoAcao } from "../actions";

const estadoInicial: EstadoAcao = {};

export function FormAvulso({ categorias, hoje }: { categorias: Categoria[]; hoje: string }) {
  const [estado, acao, pendente] = useActionState(criarLancamentoAvulso, estadoInicial);
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="flex flex-col gap-4">
      <section className="rounded-3xl border bg-card p-5">
        <CampoValor id="valor" name="valor" rotulo="Quanto foi?" defaultValue={v?.valor} erro={erro("valor")} autoFocus />
        <div className="mt-4 border-t pt-4">
          <Interruptor
            name="jaPago"
            defaultChecked={v ? v.jaPago === "on" : true}
            titulo="Já está pago"
            descricao="Desligue para registrar algo que ainda vai vencer."
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
        <Campo rotulo="Descrição" htmlFor="descricao" erro={erro("descricao")}>
          <Input
            id="descricao"
            name="descricao"
            required
            maxLength={120}
            defaultValue={v?.descricao ?? ""}
            placeholder="Ex.: Conserto da geladeira"
            aria-invalid={Boolean(erro("descricao"))}
            className={estiloInput}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria" htmlFor="categoriaId" erro={erro("categoriaId")}>
            <Selecao id="categoriaId" name="categoriaId" defaultValue={v?.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Data" htmlFor="dataVencimento" erro={erro("dataVencimento")}>
            <Input
              id="dataVencimento"
              name="dataVencimento"
              type="date"
              required
              defaultValue={v?.dataVencimento ?? hoje}
              aria-invalid={Boolean(erro("dataVencimento"))}
              className={estiloInput}
            />
          </Campo>
        </div>

        <Campo rotulo="Observação (opcional)" htmlFor="observacao" erro={erro("observacao")}>
          <textarea
            id="observacao"
            name="observacao"
            rows={2}
            maxLength={500}
            defaultValue={v?.observacao ?? ""}
            className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </Campo>
      </section>

      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}

      <div className="sticky bottom-20 z-10 -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-2 md:static md:mx-0 md:bg-none md:p-0">
        <Button size="lg" disabled={pendente} className="h-13 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20">
          {pendente ? "Salvando…" : "Salvar gasto"}
        </Button>
      </div>
    </form>
  );
}
