"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Scale } from "lucide-react";
import { Campo, Selecao, estiloInput } from "@/components/app/campos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compararCotaUnica, dividirEmParcelas } from "@/lib/financeiro";
import { formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { paraNumero } from "@/lib/validations/compromisso";
import { replanejarAno, type EstadoForm } from "../../../actions";

const estadoInicial: EstadoForm = {};

const formatarValor = (n: number) => n.toFixed(2).replace(".", ",");

type Props = {
  compromissoId: string;
  ano: number;
  total: number;
  parcelas: number;
  primeiroVencimento: string;
};

export function FormPlanoAno({ compromissoId, ano, total, parcelas, primeiroVencimento }: Props) {
  const [estado, acao, pendente] = useActionState(replanejarAno, estadoInicial);
  const v = estado.valores;
  const erro = (campo: string) => estado.erros?.[campo]?.[0];

  const [valorCotaUnica, setValorCotaUnica] = useState(v?.valorCotaUnica ?? formatarValor(total));
  const [dataCotaUnica, setDataCotaUnica] = useState(v?.dataCotaUnica ?? primeiroVencimento);
  const [valorParcelado, setValorParcelado] = useState(v?.valorParcelado ?? formatarValor(total));
  const [numParcelas, setNumParcelas] = useState(v?.parcelas ?? String(parcelas > 1 ? parcelas : 3));
  const [dataPrimeira, setDataPrimeira] = useState(v?.dataPrimeiraParcela ?? primeiroVencimento);
  const [rendimento, setRendimento] = useState("10");

  const cota = paraNumero(valorCotaUnica);
  const parcelado = paraNumero(valorParcelado);
  const n = Number(numParcelas);
  const taxa = paraNumero(rendimento);
  const podeComparar = cota > 0 && parcelado > 0 && n >= 2 && taxa >= 0 && dataCotaUnica && dataPrimeira;
  const comparacao = podeComparar
    ? compararCotaUnica({ data: dataCotaUnica, valor: cota }, dividirEmParcelas(parcelado, n, dataPrimeira), taxa)
    : null;
  const desconto = podeComparar && parcelado > cota ? ((parcelado - cota) / parcelado) * 100 : 0;
  const melhor = comparacao?.melhor;

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="compromissoId" value={compromissoId} />
      <input type="hidden" name="ano" value={ano} />

      <div className="grid gap-3 md:grid-cols-2">
        <Opcao titulo="Cota única" destaque={melhor === "cota_unica"}>
          <Campo rotulo="Valor com desconto" htmlFor="valorCotaUnica" erro={erro("valorCotaUnica")}>
            <Input
              id="valorCotaUnica"
              name="valorCotaUnica"
              inputMode="decimal"
              value={valorCotaUnica}
              onChange={(e) => setValorCotaUnica(e.target.value)}
              aria-invalid={Boolean(erro("valorCotaUnica"))}
              className={estiloInput}
            />
          </Campo>
          <Campo rotulo="Vencimento" htmlFor="dataCotaUnica" erro={erro("dataCotaUnica")}>
            <Input
              id="dataCotaUnica"
              name="dataCotaUnica"
              type="date"
              value={dataCotaUnica}
              onChange={(e) => setDataCotaUnica(e.target.value)}
              aria-invalid={Boolean(erro("dataCotaUnica"))}
              className={estiloInput}
            />
          </Campo>
          {desconto > 0 && (
            <p className="text-[13px] font-medium text-sucesso">{desconto.toFixed(1).replace(".", ",")}% de desconto</p>
          )}
        </Opcao>

        <Opcao titulo="Parcelado" destaque={melhor === "parcelado"}>
          <Campo rotulo="Valor total" htmlFor="valorParcelado" erro={erro("valorParcelado")}>
            <Input
              id="valorParcelado"
              name="valorParcelado"
              inputMode="decimal"
              value={valorParcelado}
              onChange={(e) => setValorParcelado(e.target.value)}
              aria-invalid={Boolean(erro("valorParcelado"))}
              className={estiloInput}
            />
          </Campo>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Campo rotulo="Parcelas" htmlFor="parcelas" erro={erro("parcelas")}>
              <Selecao id="parcelas" name="parcelas" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)}>
                {Array.from({ length: 11 }, (_, i) => i + 2).map((k) => (
                  <option key={k} value={k}>
                    {k}x
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="1ª parcela" htmlFor="dataPrimeiraParcela" erro={erro("dataPrimeiraParcela")}>
              <Input
                id="dataPrimeiraParcela"
                name="dataPrimeiraParcela"
                type="date"
                value={dataPrimeira}
                onChange={(e) => setDataPrimeira(e.target.value)}
                aria-invalid={Boolean(erro("dataPrimeiraParcela"))}
                className={estiloInput}
              />
            </Campo>
          </div>
          {n >= 2 && parcelado > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {n}x de <span className="font-medium text-foreground tabular-nums">{formatarMoeda(parcelado / n)}</span>
            </p>
          )}
        </Opcao>
      </div>

      <section className="flex flex-col gap-3 rounded-3xl border bg-card p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Scale className="size-[18px] text-primary" />
          Qual compensa?
        </div>
        <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Seu dinheiro guardado rende
          <Input
            inputMode="decimal"
            value={rendimento}
            onChange={(e) => setRendimento(e.target.value)}
            className="h-9 w-16 rounded-lg text-center"
            aria-label="Rendimento anual em porcentagem"
          />
          % ao ano, já sem IR
        </label>
        {comparacao && (
          <p aria-live="polite" className="flex gap-2 text-[15px]">
            <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-sucesso" />
            <span>
              {melhor === "cota_unica" && (
                <>
                  <strong>Cota única.</strong> Você economiza {formatarMoeda(comparacao.economiaCotaUnica)} em relação a parcelar e
                  deixar o dinheiro rendendo.
                </>
              )}
              {melhor === "parcelado" && (
                <>
                  <strong>Parcelar.</strong> Com o dinheiro rendendo até cada vencimento, você fica{" "}
                  {formatarMoeda(-comparacao.economiaCotaUnica)} à frente.
                </>
              )}
              {melhor === "empate" && (
                <>
                  <strong>Praticamente empate.</strong> Escolha o que for mais confortável para o seu caixa.
                </>
              )}
            </span>
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          A conta só vale se o dinheiro já estiver guardado e rendendo. Se pagar à vista exigir cheque especial, cartão ou zerar a
          reserva de emergência, parcele sem juros.
        </p>
      </section>

      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          name="escolha"
          value="cota_unica"
          size="lg"
          disabled={pendente}
          variant={melhor === "parcelado" ? "outline" : "default"}
          className="h-12 rounded-2xl text-[15px] font-semibold"
        >
          Vou pagar à vista
        </Button>
        <Button
          name="escolha"
          value="parcelado"
          size="lg"
          disabled={pendente}
          variant={melhor === "parcelado" ? "default" : "outline"}
          className="h-12 rounded-2xl text-[15px] font-semibold"
        >
          Vou parcelar em {numParcelas}x
        </Button>
      </div>
    </form>
  );
}

function Opcao({ titulo, destaque, children }: { titulo: string; destaque: boolean; children: React.ReactNode }) {
  return (
    <fieldset
      className={cn(
        "flex flex-col gap-3 rounded-3xl border bg-card p-5 transition-colors",
        destaque && "border-primary/50 ring-2 ring-primary/15",
      )}
    >
      <legend className="sr-only">{titulo}</legend>
      <div className="flex items-center justify-between">
        <span className="font-semibold" aria-hidden>
          {titulo}
        </span>
        {destaque && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Compensa mais</span>
        )}
      </div>
      {children}
    </fieldset>
  );
}
