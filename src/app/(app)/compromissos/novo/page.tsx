import { connection } from "next/server";
import { Suspense } from "react";
import { Cabecalho } from "@/components/app/cabecalho";
import { Skeleton } from "@/components/ui/skeleton";
import { buscarModelo } from "@/lib/catalogo";
import { listarCategorias } from "@/lib/dados/categorias";
import { modelosCadastrados } from "@/lib/dados/compromissos";
import { Catalogo } from "./catalogo";
import { FormCompromisso } from "./form";

export const metadata = { title: "Novo compromisso · FinView" };

export default function NovoCompromissoPage({ searchParams }: PageProps<"/compromissos/novo">) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Pick<PageProps<"/compromissos/novo">, "searchParams">) {
  await connection();
  const { modelo: chave } = await searchParams;
  const modelo = buscarModelo(typeof chave === "string" ? chave : undefined);

  if (!modelo && chave !== "personalizado") {
    return (
      <div className="flex max-w-3xl flex-col gap-8">
        <Cabecalho
          voltarPara="/dashboard"
          titulo="O que você paga?"
          subtitulo="Escolha no catálogo. Use como checklist para não esquecer nenhuma conta."
        />
        <Catalogo cadastrados={[...(await modelosCadastrados())]} />
      </div>
    );
  }

  const categorias = await listarCategorias();
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Cabecalho voltarPara="/compromissos/novo" titulo={modelo?.nome ?? "Novo compromisso"} subtitulo={modelo?.exemplos} />
      <FormCompromisso modelo={modelo} categorias={categorias} />
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex max-w-3xl flex-col gap-6" aria-busy aria-label="Carregando">
      <Skeleton className="h-8 w-64 rounded-md" />
      <Skeleton className="h-10 rounded-md" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
