"use client";

import { Marca } from "@/components/app/marca";
import { TelaErro } from "@/components/app/tela-erro";

// Erros fora do app (login, cadastro, páginas legais...).
export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col px-5 py-6 md:px-10">
      <Marca />
      <div className="mx-auto flex w-full max-w-md flex-1 items-center">
        <TelaErro error={error} retry={retry} />
      </div>
    </main>
  );
}
