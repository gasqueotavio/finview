import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { Cabecalho } from "@/components/app/cabecalho";
import { Skeleton } from "@/components/ui/skeleton";
import { obterCicloAnual } from "@/lib/dados/contas-anuais";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { FormPlanoAno } from "./form";

export const metadata = { title: "Planejar conta anual · FinView" };

const paramsSchema = z.object({ id: z.uuid(), ano: z.coerce.number().int().min(2000).max(2200) });

export default function PlanejarAnoPage({ params }: PageProps<"/compromissos/[id]/ano/[ano]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4" aria-busy aria-label="Carregando">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </div>
      }
    >
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: Pick<PageProps<"/compromissos/[id]/ano/[ano]">, "params">) {
  await connection();
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const { id, ano } = parsed.data;

  const ciclo = await obterCicloAnual(id, ano);
  if (!ciclo) notFound();

  const n = ciclo.parcelas.length;

  return (
    <div className="flex flex-col gap-6">
      <Cabecalho
        voltarPara="/dashboard"
        titulo={`${ciclo.descricao} ${ano}`}
        subtitulo={
          <>
            Hoje: {n === 1 ? "cota única" : `${n}x`} de {ciclo.estimado && "≈ "}
            {formatarMoeda(ciclo.total)}, {n === 1 ? "vence" : "1ª parcela"} {formatarData(ciclo.primeiroVencimento)}
            {ciclo.estimado && " (estimado)"}. Preencha com os valores do carnê.
          </>
        }
      />

      {ciclo.algumaPaga ? (
        <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
          Já existe parcela paga neste ano, então o plano não pode mais mudar.
        </p>
      ) : (
        <FormPlanoAno
          compromissoId={id}
          ano={ano}
          total={ciclo.total}
          parcelas={n}
          primeiroVencimento={ciclo.primeiroVencimento}
        />
      )}
    </div>
  );
}
