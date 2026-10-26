import Link from "next/link";
import { ArrowRight, BellRing, CalendarRange } from "lucide-react";
import { listarProximosCiclosAnuais } from "@/lib/dados/contas-anuais";
import { provisaoMensal } from "@/lib/financeiro";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Antecedência para avisar que é hora de decidir entre cota única e parcelado.
const DIAS_PARA_DECIDIR = 60;

export async function ContasAnuais({ hoje }: { hoje: string }) {
  const ciclos = await listarProximosCiclosAnuais();
  if (ciclos.length === 0) return null;

  const limiteDecisao = new Date(`${hoje}T00:00:00Z`);
  limiteDecisao.setUTCDate(limiteDecisao.getUTCDate() + DIAS_PARA_DECIDIR);
  const limite = limiteDecisao.toISOString().slice(0, 10);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Contas anuais</h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {ciclos.map((c) => {
          const futuro = c.primeiroVencimento > hoje;
          const decidir = !c.algumaPaga && futuro && c.primeiroVencimento <= limite;
          const provisao = futuro && !c.algumaPaga ? provisaoMensal(c.total, hoje, c.primeiroVencimento) : null;
          const n = c.parcelas.length;

          return (
            <li
              key={`${c.compromissoId}:${c.ano}`}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-card p-4",
                decidir && "border-alerta/40 ring-1 ring-alerta/20",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <CalendarRange className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {c.descricao} <span className="font-normal text-muted-foreground">{c.ano}</span>
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {n === 1 ? "Cota única" : `${n}x`} · {n === 1 ? "vence" : "1ª"} {formatarData(c.primeiroVencimento)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums">
                  {c.estimado && <span className="font-normal text-muted-foreground">≈ </span>}
                  {formatarMoeda(c.total)}
                </p>
              </div>

              {provisao && provisao.meses > 1 && (
                <p className="rounded-xl bg-muted/60 px-3 py-2 text-[13px] text-muted-foreground">
                  Separe <strong className="font-semibold text-foreground tabular-nums">{formatarMoeda(provisao.porMes)}/mês</strong> nos
                  próximos {provisao.meses} meses
                </p>
              )}

              {!c.algumaPaga && (
                <Link
                  href={`/compromissos/${c.compromissoId}/ano/${c.ano}`}
                  className={cn(
                    "group flex items-center gap-2 text-sm font-medium text-primary",
                    decidir && "text-alerta",
                  )}
                >
                  {decidir && <BellRing className="size-4" />}
                  {decidir ? "Hora de decidir: cota única ou parcelar?" : "Planejar pagamento"}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
