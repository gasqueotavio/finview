import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { Valor } from "@/components/app/dinheiro";
import { listarProximosCiclosAnuais } from "@/lib/dados/contas-anuais";
import { provisaoMensal } from "@/lib/financeiro";
import { formatarData } from "@/lib/formato";
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
    <section className="flex flex-col gap-1">
      <div className="border-b pb-3">
        <h2 className="text-[15px] font-semibold">Contas anuais</h2>
      </div>
      <ul className="divide-y">
        {ciclos.map((c) => {
          const futuro = c.primeiroVencimento > hoje;
          const decidir = !c.algumaPaga && futuro && c.primeiroVencimento <= limite;
          const provisao = futuro && !c.algumaPaga ? provisaoMensal(c.total, hoje, c.primeiroVencimento) : null;
          const n = c.parcelas.length;

          return (
            <li key={`${c.compromissoId}:${c.ano}`} className="flex flex-col gap-2 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium">
                  {c.descricao} <span className="dinheiro font-normal text-muted-foreground">{c.ano}</span>
                </p>
                <Valor valor={c.total} estimado={c.estimado} className="shrink-0 text-sm font-medium" />
              </div>
              <p className="text-xs text-muted-foreground">
                {n === 1 ? "Cota única" : `${n}x`} · {n === 1 ? "vence" : "1ª em"} {formatarData(c.primeiroVencimento)}
                {provisao && provisao.meses > 1 && (
                  <>
                    <br />
                    Separe <Valor valor={provisao.porMes} className="text-foreground" />
                    /mês por {provisao.meses} meses
                  </>
                )}
              </p>
              {!c.algumaPaga && (
                <Link
                  href={`/compromissos/${c.compromissoId}/ano/${c.ano}`}
                  className={cn(
                    "group flex w-fit items-center gap-1.5 text-[13px] font-medium underline-offset-4 hover:underline",
                    decidir && "text-alerta",
                  )}
                >
                  {decidir && <BellRing className="size-3.5" />}
                  {decidir ? "Decidir: cota única ou parcelar" : "Planejar pagamento"}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
