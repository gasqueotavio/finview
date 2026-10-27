import { CircleAlert, CircleCheck } from "lucide-react";
import { Valor, ValorDestaque } from "@/components/app/dinheiro";
import type { ResumoMensal } from "@/lib/dados/lancamentos";
import { cn } from "@/lib/utils";

/** O número que o mês todo gira em torno: quanto ainda falta pagar. */
export function DestaqueDoMes({
  nomeDoMes,
  resumo,
  contasAtrasadas,
}: {
  nomeDoMes: string;
  resumo: ResumoMensal;
  contasAtrasadas: number;
}) {
  const previsto = resumo.totalPrevisto;
  const fracao = (v: number) => (previsto > 0 ? Math.min(100, (v / previsto) * 100) : 0);
  const quitado = previsto > 0 && resumo.totalPendente === 0;

  return (
    <section aria-label={`Resumo de ${nomeDoMes}`}>
      <p className="rotulo">Falta pagar em {nomeDoMes}</p>
      <ValorDestaque valor={resumo.totalPendente} className="mt-2 text-[44px] leading-none font-medium tracking-[-0.045em] md:text-[56px]" />

      {previsto > 0 && (
        // Barra empilhada: pago (tinta) + em atraso (vermelho) sobre o total do mês. Cada parte tem rótulo logo abaixo.
        <div
          className="mt-6 flex h-1.5 gap-0.5 overflow-hidden rounded-[2px] bg-chart-track"
          role="img"
          aria-label={`${Math.round(fracao(resumo.totalPago))}% do mês já pago`}
        >
          <div className="h-full bg-chart-1 transition-[width] duration-700" style={{ width: `${fracao(resumo.totalPago)}%` }} />
          {resumo.totalAtrasado > 0 && <div className="h-full bg-critico" style={{ width: `${fracao(resumo.totalAtrasado)}%` }} />}
        </div>
      )}

      <dl className="mt-5 grid grid-cols-3 divide-x border-y">
        <Indicador rotulo="Pago" amostra="bg-chart-1">
          <Valor valor={resumo.totalPago} />
        </Indicador>
        <Indicador rotulo="Total do mês">
          <Valor valor={previsto} />
        </Indicador>
        {contasAtrasadas > 0 ? (
          <Indicador rotulo="Em atraso" amostra="bg-critico" tom="critico">
            <span className="flex items-center gap-1.5">
              <CircleAlert className="size-3.5 shrink-0" />
              <Valor valor={resumo.totalAtrasado} />
            </span>
            <span className="mt-0.5 block text-xs font-normal">
              {contasAtrasadas} {contasAtrasadas === 1 ? "conta" : "contas"}
            </span>
          </Indicador>
        ) : (
          <Indicador rotulo="Situação" tom={quitado ? "sucesso" : undefined}>
            <span className="flex items-center gap-1.5">
              {quitado || previsto === 0 ? (
                <>
                  <CircleCheck className="size-3.5 shrink-0" />
                  {previsto === 0 ? "Sem contas" : "Mês quitado"}
                </>
              ) : (
                "Em dia"
              )}
            </span>
          </Indicador>
        )}
      </dl>
    </section>
  );
}

function Indicador({
  rotulo,
  amostra,
  tom,
  children,
}: {
  rotulo: string;
  amostra?: string;
  tom?: "critico" | "sucesso";
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 px-3 py-3 first:pl-0 md:px-5 md:first:pl-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {amostra && <span aria-hidden className={cn("size-2 rounded-[2px]", amostra)} />}
        {rotulo}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-sm font-medium md:text-[15px]",
          tom === "critico" && "text-critico",
          tom === "sucesso" && "text-sucesso",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
