"use client";

import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Marca } from "@/components/app/marca";
import { TelaErro } from "@/components/app/tela-erro";
import { cn } from "@/lib/utils";
import "./globals.css";

// Último recurso: falha no próprio layout raiz. Substitui o documento inteiro,
// por isso declara <html>, <body>, fontes e estilos de novo.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export default function ErroGlobal({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR" className={cn("h-full antialiased", plexSans.variable, plexMono.variable)}>
      <body className="flex min-h-full flex-col">
        <title>Algo deu errado · FinView</title>
        <main className="flex min-h-dvh flex-1 flex-col px-5 py-6 md:px-10">
          <Marca />
          <div className="mx-auto flex w-full max-w-md flex-1 items-center">
            <TelaErro error={error} retry={retry} />
          </div>
        </main>
      </body>
    </html>
  );
}
