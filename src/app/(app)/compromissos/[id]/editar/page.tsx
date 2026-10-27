import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { z } from "zod";
import { Cabecalho } from "@/components/app/cabecalho";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/dados/categorias";
import { obterCompromisso } from "@/lib/dados/compromissos";
import { FormEditarCompromisso } from "./form";

export const metadata = { title: "Editar compromisso · FinView" };

export default function EditarCompromissoPage({ params }: PageProps<"/compromissos/[id]/editar">) {
  return (
    <Suspense
      fallback={
        <div className="flex max-w-3xl flex-col gap-6" aria-busy aria-label="Carregando">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-72 rounded-md" />
        </div>
      }
    >
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: Pick<PageProps<"/compromissos/[id]/editar">, "params">) {
  await connection();
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();

  const [compromisso, categorias] = await Promise.all([obterCompromisso(parsed.data), listarCategorias()]);
  if (!compromisso) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Cabecalho
        voltarPara="/compromissos"
        titulo="Editar compromisso"
        subtitulo="Datas, frequência e número de parcelas não mudam aqui. Se o contrato mudou, cancele este e cadastre um novo."
      />
      <FormEditarCompromisso compromisso={compromisso} categorias={categorias} />
    </div>
  );
}
