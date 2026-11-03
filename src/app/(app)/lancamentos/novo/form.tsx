"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Campo, CampoValor, GrupoFormulario, Interruptor, RodapeFormulario, SeloIA, Selecao, estiloInput } from "@/components/app/campos";
import { CampoData } from "@/components/app/campo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Categoria } from "@/lib/dados/categorias";
import { criarLancamentoAvulso, type EstadoAcao } from "../actions";
import type { SugestaoIA } from "./sugestao";

const estadoInicial: EstadoAcao = {};

const formatarValor = (n: number) => n.toFixed(2).replace(".", ",");

export function FormAvulso({ categorias, hoje, sugestao }: { categorias: Categoria[]; hoje: string; sugestao?: SugestaoIA | null }) {
  const [estado, acao, pendente] = useActionState(criarLancamentoAvulso, estadoInicial);
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  // Valores lidos do boleto pela IA: entram como padrão e ficam destacados para conferência.
  const ia = {
    descricao: sugestao?.descricao ?? undefined,
    valor: sugestao?.valor != null ? formatarValor(sugestao.valor) : undefined,
    data: sugestao?.vencimento ?? undefined,
    categoriaId: sugestao?.categoriaId ?? undefined,
    observacao: sugestao?.linhaDigitavel ? `Linha digitável: ${sugestao.linhaDigitavel}` : undefined,
  };
  const destaque = (campo: keyof typeof ia) => !v && ia[campo] !== undefined;

  // "Já está pago" acompanha a data: hoje ou antes = gasto feito; depois de hoje = conta a pagar.
  // Se a pessoa mexer no interruptor, a escolha dela passa a valer e a data não muda mais nada.
  // Boleto lido pela IA é conta a pagar: começa desligado, seja qual for a data.
  const [data, setData] = useState(v?.dataVencimento ?? ia.data ?? hoje);
  const [jaPago, setJaPago] = useState(v ? v.jaPago === "on" : !sugestao);
  const [escolhaManual, setEscolhaManual] = useState(Boolean(v) || Boolean(sugestao));
  const futura = data > hoje;

  function mudarData(nova: string) {
    setData(nova);
    if (!escolhaManual && nova) setJaPago(nova <= hoje);
  }

  return (
    <form action={acao} className="flex flex-col">
      <GrupoFormulario titulo="Valor">
        <CampoValor
          id="valor"
          name="valor"
          rotulo="Quanto foi?"
          defaultValue={v?.valor ?? ia.valor}
          erro={erro("valor")}
          autoFocus={!sugestao}
          destaque={destaque("valor")}
        />
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
        <Campo rotulo="Descrição" htmlFor="descricao" erro={erro("descricao")} destaque={destaque("descricao")}>
          <Input
            id="descricao"
            name="descricao"
            required
            maxLength={120}
            defaultValue={v?.descricao ?? ia.descricao ?? ""}
            placeholder="Ex.: Conserto da geladeira"
            aria-invalid={Boolean(erro("descricao"))}
            className={estiloInput}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria" htmlFor="categoriaId" erro={erro("categoriaId")} destaque={destaque("categoriaId")}>
            <Selecao id="categoriaId" name="categoriaId" defaultValue={v?.categoriaId ?? ia.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Data" htmlFor="dataVencimento" erro={erro("dataVencimento")} destaque={destaque("data")}>
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
        {destaque("observacao") && (
          <p className="flex items-center text-[13px] font-medium">
            Linha digitável do boleto
            <SeloIA />
          </p>
        )}
        <AreaTexto
          id="observacao"
          name="observacao"
          aria-label="Observação"
          rows={2}
          maxLength={500}
          defaultValue={v?.observacao ?? ia.observacao ?? ""}
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
