"use client";

import { useActionState, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Campo, CampoValor, Interruptor, Selecao, estiloInput } from "@/components/app/campos";
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
  const anual = tipo === "anual";
  const categoriaPadrao = categorias.find((c) => c.chave === modelo?.categoria)?.id ?? "";
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="modelo" value={modelo?.chave ?? ""} />

      {modelo?.dica && (
        <p className="flex gap-3 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0" />
          {modelo.dica}
        </p>
      )}

      <section className="rounded-3xl border bg-card p-5">
        <CampoValor
          id="valor"
          name="valor"
          rotulo={anual ? "Valor total do ano" : temPrazo ? "Valor de cada parcela" : "Quanto você paga"}
          defaultValue={v?.valor}
          erro={erro("valor")}
          autoFocus
        />
        <div className="mt-4 border-t pt-4">
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
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-5">
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
            <Input
              id="dataVencimentoInicial"
              name="dataVencimentoInicial"
              type="date"
              required
              defaultValue={v?.dataVencimentoInicial ?? ""}
              aria-invalid={Boolean(erro("dataVencimentoInicial"))}
              className={estiloInput}
            />
          </Campo>

          {temPrazo && (
            <>
              <Campo rotulo="Total de parcelas" htmlFor="totalParcelas" erro={erro("totalParcelas")}>
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
                ajuda="Já pagou algumas? Ex.: 25 num financiamento de 60."
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
            </>
          )}
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

      {/* No celular o botão fica preso acima da barra de abas */}
      <div className="sticky bottom-20 z-10 -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pt-6 pb-2 md:static md:mx-0 md:bg-none md:p-0">
        <Button size="lg" disabled={pendente} className="h-13 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/20">
          {pendente ? "Salvando…" : "Salvar compromisso"}
        </Button>
      </div>
    </form>
  );
}
