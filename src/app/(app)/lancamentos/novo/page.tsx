import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Cabecalho } from "@/components/app/cabecalho";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/dados/categorias";
import { hojeEmBrasilia } from "@/lib/formato";
import { FormAvulso } from "./form";

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
  const categorias = await listarCategorias();
  return <FormAvulso categorias={categorias} hoje={hojeEmBrasilia()} />;
}
