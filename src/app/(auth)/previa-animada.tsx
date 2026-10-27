"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, CircleCheck } from "lucide-react";
import { formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Prévia ilustrativa do produto (não são dados reais de ninguém).
const CONTAS = [
  { dia: "05", semana: "seg", descricao: "Aluguel", meta: "Moradia", valor: 2200 },
  { dia: "10", semana: "sáb", descricao: "Plano de saúde", meta: "Saúde", valor: 612.9 },
  { dia: "15", semana: "qui", descricao: "Financiamento do carro", meta: "Parcela 25/60", valor: 1349.37 },
  { dia: "20", semana: "ter", descricao: "Energia elétrica", meta: "Valor estimado", valor: 186.4 },
];
const ENERGIA = 3;
const ENERGIA_REAL = 192.15;

// Roteiro em loop: paga o financiamento, confirma o valor real da energia, paga a energia, mês quitado.
type Passo = { pagos: boolean[]; confirmada: boolean; foco: number | null; saindo?: boolean; duracao: number };
const INICIO = [true, true, false, false];
const PASSOS: Passo[] = [
  { pagos: INICIO, confirmada: false, foco: null, duracao: 2000 },
  { pagos: INICIO, confirmada: false, foco: 2, duracao: 650 },
  { pagos: [true, true, true, false], confirmada: false, foco: 2, duracao: 1400 },
  { pagos: [true, true, true, false], confirmada: false, foco: 3, duracao: 750 },
  { pagos: [true, true, true, false], confirmada: true, foco: 3, duracao: 1400 },
  { pagos: [true, true, true, true], confirmada: true, foco: null, duracao: 2800 },
  { pagos: [true, true, true, true], confirmada: true, foco: null, saindo: true, duracao: 450 },
];

function useMovimentoReduzido() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Número que desliza até o novo valor (como um contador de saldo). */
function useNumeroAnimado(alvo: number, animar: boolean) {
  const [valor, setValor] = useState(alvo);
  const atual = useRef(alvo);

  useEffect(() => {
    const de = atual.current;
    const inicio = performance.now();
    const duracao = animar ? 750 : 0;
    let id = requestAnimationFrame(function quadro(agora) {
      const p = duracao === 0 ? 1 : Math.min(1, (agora - inicio) / duracao);
      const v = de + (alvo - de) * (1 - (1 - p) ** 3);
      atual.current = v;
      setValor(v);
      if (p < 1) id = requestAnimationFrame(quadro);
    });
    return () => cancelAnimationFrame(id);
  }, [alvo, animar]);

  return valor;
}

export function PreviaAnimada() {
  const reduzido = useMovimentoReduzido();
  const [indice, setIndice] = useState(0);
  const passo = PASSOS[reduzido ? 0 : indice];

  useEffect(() => {
    if (reduzido) return;
    const id = setTimeout(() => setIndice((i) => (i + 1) % PASSOS.length), PASSOS[indice].duracao);
    return () => clearTimeout(id);
  }, [indice, reduzido]);

  const valorDe = (i: number) => (i === ENERGIA && passo.confirmada ? ENERGIA_REAL : CONTAS[i].valor);
  const totalMes = CONTAS.reduce((s, _, i) => s + valorDe(i), 0);
  const falta = CONTAS.reduce((s, _, i) => s + (passo.pagos[i] ? 0 : valorDe(i)), 0);
  // Ao recomeçar o loop, o total volta direto (sem contar para cima).
  const faltaExibida = useNumeroAnimado(falta, !reduzido && indice !== 0);
  const quitado = falta === 0;

  return (
    <figure className="max-w-[460px]">
      <figcaption className="sr-only">
        Exemplo da lista de vencimentos: aluguel e plano de saúde pagos; financiamento do carro e energia elétrica a pagar.
      </figcaption>
      <div
        aria-hidden
        className={cn(
          "overflow-hidden rounded-lg border bg-background shadow-[0_1px_0_0_var(--border),0_24px_48px_-24px_rgb(0_0_0/0.18)] transition-opacity duration-400",
          passo.saindo && "opacity-0",
        )}
      >
        <div className="relative border-b px-4 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className={cn("rotulo flex items-center gap-1.5 transition-colors", quitado && "text-sucesso")}>
              {quitado ? (
                <>
                  <CircleCheck className="size-3 animate-in zoom-in-50 duration-300" />
                  Mês quitado
                </>
              ) : (
                "Falta pagar em outubro"
              )}
            </span>
            <span className="dinheiro text-lg font-medium tracking-[-0.03em]">{formatarMoeda(faltaExibida)}</span>
          </div>
          {/* Parte do mês já paga */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-chart-track">
            <div
              className="h-full bg-chart-1 transition-[width] duration-700 ease-out"
              style={{ width: `${((totalMes - falta) / totalMes) * 100}%` }}
            />
          </div>
        </div>

        <ul className="divide-y">
          {CONTAS.map((c, i) => {
            const pago = passo.pagos[i];
            const estimada = i === ENERGIA && !passo.confirmada;
            return (
              <li
                key={c.dia}
                className={cn(
                  "grid grid-cols-[3.25rem_minmax(0,1fr)] bg-card transition-colors duration-300",
                  "animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:both] motion-reduce:animate-none",
                  passo.foco === i && "bg-muted",
                )}
                style={{ animationDelay: `${150 + i * 110}ms` }}
              >
                <span className="flex flex-col items-center border-r pt-2.5">
                  <span className="dinheiro text-[15px] leading-none font-medium">{c.dia}</span>
                  <span className="mt-1 text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">{c.semana}</span>
                </span>
                <span className="flex items-center gap-3 py-2.5 pr-3 pl-3.5">
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13px] font-medium transition-colors duration-300", pago && "text-muted-foreground")}>
                      {c.descricao}
                    </span>
                    <span
                      key={`${pago}-${estimada}`}
                      className={cn(
                        "block text-[11px] text-muted-foreground animate-in fade-in duration-300",
                        i === ENERGIA && passo.confirmada && !pago && "text-foreground",
                      )}
                    >
                      {pago ? "Paga" : i === ENERGIA && passo.confirmada ? "Valor da conta confirmado" : c.meta}
                    </span>
                  </span>
                  <span
                    key={estimada ? "estimado" : "real"}
                    className={cn(
                      "dinheiro text-[13px] transition-colors duration-300",
                      pago ? "text-muted-foreground" : "font-medium",
                      i === ENERGIA && passo.confirmada && "animate-in fade-in slide-in-from-top-1 duration-300",
                    )}
                  >
                    {estimada && "≈ "}
                    {formatarMoeda(valorDe(i))}
                  </span>
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-[4px] border-[1.5px] border-input transition-all duration-300",
                      pago && "border-sucesso bg-sucesso text-card",
                      passo.foco === i && !pago && "scale-110 border-foreground",
                    )}
                  >
                    <Check
                      className={cn("size-2.5 transition-transform duration-300 ease-out", pago ? "scale-100" : "scale-0")}
                      strokeWidth={3.5}
                    />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}
