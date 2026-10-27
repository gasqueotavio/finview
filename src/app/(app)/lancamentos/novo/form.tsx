"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Campo, CampoValor, GrupoFormulario, Interruptor, RodapeFormulario, Selecao, estiloInput } from "@/components/app/campos";
import { CampoData } from "@/components/app/campo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Categoria } from "@/lib/dados/categorias";
import { criarLancamentoAvulso, type EstadoAcao } from "../actions";

const estadoInicial: EstadoAcao = {};

export function FormAvulso({ categorias, hoje }: { categorias: Categoria[]; hoje: string }) {
  const [estado, acao, pendente] = useActionState(criarLancamentoAvulso, estadoInicial);
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  // "Já está pago" acompanha a data: hoje ou antes = gasto feito; depois de hoje = conta a pagar.
  // Se a pessoa mexer no interruptor, a escolha dela passa a valer e a data não muda mais nada.
  const [data, setData] = useState(v?.dataVencimento ?? hoje);
  const [jaPago, setJaPago] = useState(v ? v.jaPago === "on" : true);
  const [escolhaManual, setEscolhaManual] = useState(Boolean(v));
  const futura = data > hoje;

  function mudarData(nova: string) {
    setData(nova);
    if (!escolhaManual && nova) setJaPago(nova <= hoje);
  }

  return (
    <form action={acao} className="flex flex-col">
      <GrupoFormulario titulo="Valor">
        <CampoValor id="valor" name="valor" rotulo="Quanto foi?" defaultValue={v?.valor} erro={erro("valor")} autoFocus />
        <Interruptor
          name="jaPago"
          checked={jaPago}
          onCheckedChange={(marcado) => {
            setJaPago(marcado);
            setEscolhaManual(true);
          }}
          titulo="Já está pago"
          descricao={
            futura && !jaPago
              ? "Data no futuro: fica como conta a pagar e entra nos lembretes."
              : futura
                ? "Marcado como pago, mesmo com a data no futuro."
                : "Desligue para registrar algo que ainda vai vencer."
          }
        />
      </GrupoFormulario>

      <GrupoFormulario titulo="Detalhes">
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
            <CampoData
              id="dataVencimento"
              name="dataVencimento"
              value={data}
              onChange={mudarData}
              invalido={Boolean(erro("dataVencimento"))}
            />
          </Campo>
        </div>
      </GrupoFormulario>

      <GrupoFormulario titulo="Observação" descricao="Opcional. Fica cifrada.">
        <AreaTexto
          id="observacao"
          name="observacao"
          aria-label="Observação"
          rows={2}
          maxLength={500}
          defaultValue={v?.observacao ?? ""}
          aria-invalid={Boolean(erro("observacao"))}
        />
        {erro("observacao") && <p className="text-xs text-critico">{erro("observacao")}</p>}
      </GrupoFormulario>

      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}

      <RodapeFormulario>
        <Button size="lg" disabled={pendente} className="h-11 w-full rounded-md px-5 text-sm md:h-10 md:w-auto">
          {pendente ? "Salvando…" : "Salvar gasto"}
        </Button>
      </RodapeFormulario>
    </form>
  );
}
