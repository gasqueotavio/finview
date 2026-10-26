import { CircleAlert, CircleCheck } from "lucide-react";
import type { ResumoMensal } from "@/lib/dados/lancamentos";
import { formatarMoeda } from "@/lib/formato";

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
  const faltaPagar = resumo.totalPendente;
  const progresso = resumo.totalPrevisto > 0 ? Math.min(100, (resumo.totalPago / resumo.totalPrevisto) * 100) : 0;

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-7">
      <p className="text-sm font-medium text-muted-foreground">Falta pagar em {nomeDoMes}</p>
      <p className="mt-1 text-[44px] leading-none font-semibold tracking-tight tabular-nums md:text-[56px]">
        {formatarMoeda(faltaPagar)}
      </p>

      {resumo.totalPrevisto > 0 ? (
        <div className="mt-6">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-chart-track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso)}
            aria-label="Parte do mês já paga"
          >
            <div className="h-full rounded-full bg-chart-1 transition-[width] duration-700" style={{ width: `${progresso}%` }} />
          </div>
          <div className="mt-2.5 flex justify-between text-sm">
            <span>
              <span className="font-semibold tabular-nums">{formatarMoeda(resumo.totalPago)}</span>{" "}
              <span className="text-muted-foreground">pago</span>
            </span>
            <span className="text-muted-foreground">
              de <span className="font-medium text-foreground tabular-nums">{formatarMoeda(resumo.totalPrevisto)}</span>
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Nenhuma conta neste mês.</p>
      )}

      {contasAtrasadas > 0 ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-critico-suave px-3.5 py-2.5 text-sm text-critico">
          <CircleAlert className="size-4 shrink-0" />
          <span>
            <strong className="font-semibold">{formatarMoeda(resumo.totalAtrasado)} em atraso</strong> ·{" "}
            {contasAtrasadas} {contasAtrasadas === 1 ? "conta" : "contas"}
          </span>
        </p>
      ) : resumo.totalPrevisto > 0 && faltaPagar === 0 ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-sucesso-suave px-3.5 py-2.5 text-sm text-sucesso">
          <CircleCheck className="size-4 shrink-0" />
          <strong className="font-semibold">Mês quitado!</strong>
        </p>
      ) : null}
    </section>
  );
}
