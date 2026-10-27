"use client";

import { useActionState, useState } from "react";
import { Info } from "lucide-react";
import { AreaTexto, Campo, CampoValor, GrupoFormulario, Interruptor, RodapeFormulario, Selecao, estiloInput } from "@/components/app/campos";
import { CampoData } from "@/components/app/campo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREQUENCIAS, TIPOS_COMPROMISSO, type ModeloGasto, type TipoCompromisso } from "@/lib/catalogo";
import type { Categoria } from "@/lib/dados/categorias";
import { criarCompromisso, type EstadoForm } from "../actions";

const estadoInicial: EstadoForm = {};

type Props = {
  modelo?: ModeloGasto;
  categorias: Categoria[];
};

export function FormCompromisso({ modelo, categorias }: Props) {
  const [estado, acao, pendente] = useActionState(criarCompromisso, estadoInicial);
  const v = estado.valores;
  const [tipo, setTipo] = useState<TipoCompromisso>((v?.tipo as TipoCompromisso) ?? modelo?.tipo ?? "fixo");
  const temPrazo = TIPOS_COMPROMISSO[tipo].temPrazo;
  const comJuros = Boolean(TIPOS_COMPROMISSO[tipo].comJuros);
  const exigeTaxa = Boolean(TIPOS_COMPROMISSO[tipo].exigeTaxa);
  const anual = tipo === "anual";
  const categoriaPadrao = categorias.find((c) => c.chave === modelo?.categoria)?.id ?? "";
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="flex flex-col">
      <input type="hidden" name="modelo" value={modelo?.chave ?? ""} />

      {modelo?.dica && (
        <p className="mb-8 flex gap-3 border-l-2 border-foreground/70 py-0.5 pl-3.5 text-[13px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-foreground" />
          {modelo.dica}
        </p>
      )}

      <GrupoFormulario titulo="Valor" descricao={anual ? "O total do ano, como vem no carnê." : undefined}>
        <CampoValor
          id="valor"
          name="valor"
          rotulo={anual ? "Valor total do ano" : temPrazo ? "Valor de cada parcela" : "Quanto você paga"}
          defaultValue={v?.valor}
          erro={erro("valor")}
          autoFocus
        />
        <Interruptor
          name="valorVariavel"
          defaultChecked={v ? v.valorVariavel === "on" : Boolean(modelo?.variavel)}
          titulo={anual ? "Ainda não sei o valor exato" : "O valor muda todo mês"}
          descricao={
            anual
              ? "Use o valor do ano passado. Você confirma quando o carnê chegar."
              : "Use a média. Você confirma o valor real quando a conta chegar."
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
            defaultValue={v?.descricao ?? modelo?.nome ?? ""}
            placeholder={modelo?.exemplos ? `Ex.: ${modelo.exemplos}` : "Ex.: Aluguel do apartamento"}
            aria-invalid={Boolean(erro("descricao"))}
            className={estiloInput}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Categoria" htmlFor="categoriaId" erro={erro("categoriaId")}>
            <Selecao id="categoriaId" name="categoriaId" defaultValue={v?.categoriaId ?? categoriaPadrao}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Tipo" htmlFor="tipo" erro={erro("tipo")}>
            <Selecao id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoCompromisso)}>
              {Object.entries(TIPOS_COMPROMISSO).map(([chave, t]) => (
                <option key={chave} value={chave}>
                  {t.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
      </GrupoFormulario>

      <GrupoFormulario
        titulo="Cobrança"
        descricao={temPrazo ? "Já pagou algumas? Informe em qual parcela está. Não sabe o total? Informe só o saldo devedor." : undefined}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {anual ? (
            <Campo rotulo="Como vai pagar este ano" htmlFor="parcelasPorAno" erro={erro("parcelasPorAno")}>
              <input type="hidden" name="frequencia" value="anual" />
              <Selecao id="parcelasPorAno" name="parcelasPorAno" defaultValue={v?.parcelasPorAno ?? "1"}>
                <option value="1">Cota única</option>
                {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    Parcelado em {n}x
                  </option>
                ))}
              </Selecao>
            </Campo>
          ) : (
            <Campo rotulo="Repete a cada" htmlFor="frequencia" erro={erro("frequencia")}>
              <Selecao id="frequencia" name="frequencia" defaultValue={v?.frequencia ?? modelo?.frequencia ?? "mensal"}>
                {Object.entries(FREQUENCIAS).map(([chave, nome]) => (
                  <option key={chave} value={chave}>
                    {nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          )}

          <Campo
            rotulo={anual ? "1º vencimento" : temPrazo ? "Vencimento da próxima parcela" : "Próximo vencimento"}
            htmlFor="dataVencimentoInicial"
            erro={erro("dataVencimentoInicial")}
          >
            <CampoData
              id="dataVencimentoInicial"
              name="dataVencimentoInicial"
              defaultValue={v?.dataVencimentoInicial ?? ""}
              invalido={Boolean(erro("dataVencimentoInicial"))}
            />
          </Campo>

          {temPrazo && (
            <>
              <Campo rotulo="Total de parcelas" htmlFor="totalParcelas" erro={erro("totalParcelas")} ajuda="Opcional se informar o saldo devedor.">
                <Input
                  id="totalParcelas"
                  name="totalParcelas"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  required
                  defaultValue={v?.totalParcelas ?? ""}
                  aria-invalid={Boolean(erro("totalParcelas"))}
                  className={estiloInput}
                />
              </Campo>
              <Campo
                rotulo="A próxima é a parcela nº"
                htmlFor="primeiraParcela"
                erro={erro("primeiraParcela")}
                ajuda="Ex.: 25 num financiamento de 60."
              >
                <Input
                  id="primeiraParcela"
                  name="primeiraParcela"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={600}
                  defaultValue={v?.primeiraParcela ?? "1"}
                  aria-invalid={Boolean(erro("primeiraParcela"))}
                  className={estiloInput}
                />
              </Campo>
              <Campo
                rotulo="Saldo devedor hoje (opcional)"
                htmlFor="saldoDevedor"
                erro={erro("saldoDevedor")}
                ajuda="O valor que o banco ou a administradora mostra hoje. As parcelas pagas a partir de amanhã são descontadas dele."
                className={comJuros ? undefined : "sm:col-span-2"}
              >
                <Input
                  id="saldoDevedor"
                  name="saldoDevedor"
                  inputMode="decimal"
                  placeholder="Ex.: 47.000,00"
                  defaultValue={v?.saldoDevedor ?? ""}
                  aria-invalid={Boolean(erro("saldoDevedor"))}
                  className={estiloInput}
                />
              </Campo>
              {comJuros && (
                <Campo
                  rotulo={exigeTaxa ? "Juros ao mês, em %" : "Juros ao mês, em % (opcional)"}
                  htmlFor="taxaJuros"
                  erro={erro("taxaJuros")}
                  ajuda={
                    exigeTaxa
                      ? "Está no contrato ou no app do banco (ex.: 1,49). Sem juros? Digite 0."
                      : "Parcelado com juros? Informe a taxa do contrato (ex.: 1,99). Sem juros, deixe em branco."
                  }
                >
                  <Input
                    id="taxaJuros"
                    name="taxaJuros"
                    inputMode="decimal"
                    placeholder="Ex.: 1,49"
                    required={exigeTaxa}
                    defaultValue={v?.taxaJuros ?? ""}
                    aria-invalid={Boolean(erro("taxaJuros"))}
                    className={estiloInput}
                  />
                </Campo>
              )}
            </>
          )}
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
          {pendente ? "Salvando…" : "Salvar compromisso"}
        </Button>
      </RodapeFormulario>
    </form>
  );
}
