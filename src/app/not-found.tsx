import { Marca } from "@/components/app/marca";
import { NaoEncontrado } from "@/components/app/nao-encontrado";

export const metadata = { title: "Página não encontrada · FinView" };

// Endereços que não existem em lugar nenhum do site.
export default function NaoEncontradoGeral() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 py-6 md:px-10">
      <Marca />
      <div className="mx-auto flex w-full max-w-md flex-1 items-center">
        <NaoEncontrado />
      </div>
    </main>
  );
}
