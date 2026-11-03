import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Cabecalho } from "@/components/app/cabecalho";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/dados/categorias";
import { consentiuLeituraIA } from "@/lib/dados/ia";
import { hojeEmBrasilia } from "@/lib/formato";
import { iaConfigurada } from "@/lib/ia/gemini";
import { NovoGasto } from "./novo-gasto";

export const metadata = { title: "Novo gasto · FinView" };

export default function NovoGastoPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Cabecalho
        voltarPara="/dashboard"
        titulo="Novo gasto"
        subtitulo={
          <>
            Para algo pontual. Se repete ou é parcelado,{" "}
            <Link href="/compromissos/novo" className="font-medium text-foreground underline underline-offset-4">
              cadastre como recorrente
            </Link>
            .
          </>
        }
      />
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" aria-busy aria-label="Carregando">
            <Skeleton className="h-28 rounded-md" />
            <Skeleton className="h-56 rounded-md" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </div>
  );
}

async function Conteudo() {
  await connection();
  // Sem GEMINI_API_KEY o botão de leitura com IA nem aparece.
  const iaDisponivel = iaConfigurada();
  const [categorias, consentiuIA] = await Promise.all([listarCategorias(), iaDisponivel ? consentiuLeituraIA() : false]);
  return <NovoGasto categorias={categorias} hoje={hojeEmBrasilia()} iaDisponivel={iaDisponivel} consentiuIA={consentiuIA} />;
}
