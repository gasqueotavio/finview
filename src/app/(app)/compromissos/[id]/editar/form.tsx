"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { AreaTexto, Campo, CampoValor, GrupoFormulario, Interruptor, RodapeFormulario, Selecao, estiloInput } from "@/components/app/campos";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TIPOS_COMPROMISSO } from "@/lib/catalogo";
import type { Categoria } from "@/lib/dados/categorias";
import type { CompromissoEditavel } from "@/lib/dados/compromissos";
import { formatarData } from "@/lib/formato";
import { editarCompromisso, excluirCompromisso, type EstadoForm } from "../../actions";

const estadoInicial: EstadoForm = {};
const formatarValor = (n: number) => n.toFixed(2).replace(".", ",");
const formatarTaxa = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

export function FormEditarCompromisso({ compromisso: c, categorias }: { compromisso: CompromissoEditavel; categorias: Categoria[] }) {
  const [estado, acao, pendente] = useActionState(editarCompromisso, estadoInicial);
  const [confirmando, setConfirmando] = useState(false);
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];
  const anual = c.tipo === "anual";
  const ativo = c.status === "ativo";
  const temSaldo = ativo && TIPOS_COMPROMISSO[c.tipo].temPrazo;
  const saldoAtual = c.saldoDevedor === null ? "" : formatarValor(c.saldoDevedor);
  const comJuros = temSaldo && Boolean(TIPOS_COMPROMISSO[c.tipo].comJuros);
  const taxaAtual = c.taxaJuros === null ? "" : formatarTaxa(c.taxaJuros);
  const exigeTaxa = comJuros && Boolean(TIPOS_COMPROMISSO[c.tipo].exigeTaxa);

  return (
    <>
      <form action={acao} className="flex flex-col">
        <input type="hidden" name="id" value={c.id} />

        {ativo && (
          <GrupoFormulario
            titulo="Valor"
            descricao={anual ? undefined : "Vale para as cobranças a partir de hoje. As já pagas e as atrasadas não mudam."}
          >
            {anual ? (
              <p className="text-sm text-muted-foreground">
                Conta anual: o valor e as parcelas de cada ano são definidos no planejamento do ano, em Contas anuais.{" "}
                <Link href="/dashboard" className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4">
                  Ir para o Início
                  <ArrowRight className="size-3.5" />
                </Link>
              </p>
            ) : (
              <CampoValor
                id="valor"
                name="valor"
                rotulo="Valor de cada cobrança"
                defaultValue={v?.valor ?? formatarValor(c.valorParcela)}
                erro={erro("valor")}
              />
            )}
            <Interruptor
              name="valorVariavel"
              defaultChecked={v ? v.valorVariavel === "on" : c.valorVariavel}
              titulo={anual ? "Ainda não sei o valor exato" : "O valor muda todo mês"}
              descricao="As próximas cobranças ficam marcadas como estimativa até você confirmar o valor real."
            />
          </GrupoFormulario>
        )}
        {/* Encerrado: mantém a marcação atual (o campo não aparece) */}
        {!ativo && c.valorVariavel && <input type="hidden" name="valorVariavel" value="on" />}

        {temSaldo && (
          <GrupoFormulario
            titulo="Saldo devedor"
            descricao={
              c.saldoInformadoEm
                ? `Informado em ${formatarData(c.saldoInformadoEm)}; as parcelas pagas depois disso já foram descontadas.`
                : "Estimado pelas parcelas que faltam. Informe o saldo do banco para ficar exato (com os juros)."
            }
          >
            <input type="hidden" name="saldoOriginal" value={saldoAtual} />
            <Campo
              rotulo="Quanto falta pagar hoje"
              htmlFor="saldoDevedor"
              erro={erro("saldoDevedor")}
              ajuda="Mudou? Atualize com o valor do extrato: ele vira o novo ponto de partida."
            >
              <Input
                id="saldoDevedor"
                name="saldoDevedor"
                inputMode="decimal"
                defaultValue={v?.saldoDevedor ?? saldoAtual}
                aria-invalid={Boolean(erro("saldoDevedor"))}
                className={estiloInput}
              />
            </Campo>
            {comJuros && (
              <>
                <input type="hidden" name="taxaOriginal" value={taxaAtual} />
                <Campo
                  rotulo="Juros ao mês, em %"
                  htmlFor="taxaJuros"
                  erro={erro("taxaJuros")}
                  ajuda={
                    c.taxaEstimada
                      ? "Calculada pelo app com o saldo e as parcelas que faltam. Se souber a taxa do contrato, informe aqui."
                      : c.taxaJuros !== null
                        ? "Taxa do contrato: de cada parcela, só o que passa dos juros abate o saldo."
                        : exigeTaxa
                          ? "Informe a taxa do contrato ou do app do banco (ex.: 1,49). Sem juros? Digite 0."
                          : "Sem juros: cada parcela abate o valor inteiro. Informe a taxa do contrato (ex.: 1,99)."
                  }
                >
                  <Input
                    id="taxaJuros"
                    name="taxaJuros"
                    inputMode="decimal"
                    placeholder="Ex.: 1,49"
                    required={exigeTaxa}
                    defaultValue={v?.taxaJuros ?? taxaAtual}
                    aria-invalid={Boolean(erro("taxaJuros"))}
                    className={estiloInput}
                  />
                </Campo>
              </>
            )}
          </GrupoFormulario>
        )}

        <GrupoFormulario titulo="Detalhes" descricao="O novo nome aparece também nas parcelas já pagas.">
          <Campo rotulo="Descrição" htmlFor="descricao" erro={erro("descricao")}>
            <Input
              id="descricao"
              name="descricao"
              required
              maxLength={120}
              defaultValue={v?.descricao ?? c.descricao}
              aria-invalid={Boolean(erro("descricao"))}
              className={estiloInput}
            />
          </Campo>
          <Campo rotulo="Categoria" htmlFor="categoriaId" erro={erro("categoriaId")}>
            <Selecao id="categoriaId" name="categoriaId" defaultValue={v?.categoriaId ?? c.categoriaId ?? ""}>
              <option value="">Sem categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </GrupoFormulario>

        <GrupoFormulario titulo="Observação" descricao="Opcional. Fica cifrada.">
          <AreaTexto
            id="observacao"
            name="observacao"
            aria-label="Observação"
            rows={2}
            maxLength={500}
            defaultValue={v?.observacao ?? c.observacao ?? ""}
            aria-invalid={Boolean(erro("observacao"))}
          />
          {erro("observacao") && <p className="text-xs text-critico">{erro("observacao")}</p>}
        </GrupoFormulario>

        {/* Zona de perigo: separada do fluxo principal e com confirmação */}
        <GrupoFormulario titulo="Excluir" descricao="Apaga o compromisso e todas as parcelas, inclusive o histórico pago.">
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md border-critico/40 text-critico hover:bg-critico-suave hover:text-critico"
              onClick={() => setConfirmando(true)}
            >
              Excluir compromisso
            </Button>
            {ativo && (
              <p className="text-xs text-muted-foreground">
                Parou de pagar e quer manter o histórico? Use <strong className="font-medium">Cancelar</strong> na lista de
                compromissos.
              </p>
            )}
          </div>
        </GrupoFormulario>

        {estado.mensagem && (
          <p aria-live="polite" className="text-sm text-critico">
            {estado.mensagem}
          </p>
        )}

        <RodapeFormulario>
          <Button size="lg" disabled={pendente} className="h-11 w-full rounded-md px-5 text-sm md:h-10 md:w-auto">
            {pendente ? "Salvando…" : "Salvar alterações"}
          </Button>
        </RodapeFormulario>
      </form>

      <Painel aberto={confirmando} aoMudar={setConfirmando} titulo="Excluir compromisso?" descricao={c.descricao}>
        <form action={excluirCompromisso} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={c.id} />
          <p className="text-sm">
            {c.parcelasPagas > 0 ? (
              <>
                Isso apaga também{" "}
                <strong className="font-semibold">
                  {c.parcelasPagas} {c.parcelasPagas === 1 ? "pagamento registrado" : "pagamentos registrados"}
                </strong>
                , que deixam de contar nos totais dos meses anteriores.
              </>
            ) : (
              "O compromisso e as parcelas futuras serão apagados."
            )}
          </p>
          <p className="text-[13px] text-muted-foreground">Essa ação não pode ser desfeita.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" size="lg" variant="outline" className="h-11 rounded-md text-sm" onClick={() => setConfirmando(false)}>
              Voltar
            </Button>
            <BotaoExcluir />
          </div>
        </form>
      </Painel>
    </>
  );
}

function BotaoExcluir() {
  // useFormStatus precisa estar dentro do <form>
  const { pending } = useFormStatus();
  return (
    <Button size="lg" variant="destructive" disabled={pending} className="h-11 rounded-md text-sm">
      {pending ? "Excluindo…" : "Excluir"}
    </Button>
  );
}

