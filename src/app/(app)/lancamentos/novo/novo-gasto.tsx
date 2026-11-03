"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Repeat } from "lucide-react";
import type { Categoria } from "@/lib/dados/categorias";
import { FormAvulso } from "./form";
import { LeitorBoleto } from "./leitor-boleto";
import type { SugestaoIA } from "./sugestao";

const CONFIANCA: Record<SugestaoIA["confianca"], string> = {
  alta: "A leitura saiu nítida.",
  media: "Algum campo estava difícil de ler: confira com atenção.",
  baixa: "A leitura teve pouca confiança: confira cada campo.",
};

/** Novo gasto com a opção de pré-preencher lendo um boleto com IA. */
export function NovoGasto({
  categorias,
  hoje,
  iaDisponivel,
  consentiuIA,
}: {
  categorias: Categoria[];
  hoje: string;
  iaDisponivel: boolean;
  consentiuIA: boolean;
}) {
  const [sugestao, setSugestao] = useState<SugestaoIA | null>(null);
  // Cada leitura remonta o formulário com os valores novos.
  const [versao, setVersao] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      {iaDisponivel && (
        <div className="flex flex-col gap-3">
          <LeitorBoleto
            consentiu={consentiuIA}
            aoLer={(s) => {
              setSugestao(s);
              setVersao((v) => v + 1);
            }}
          />
          {sugestao && (
            <div role="status" className="flex flex-col gap-1.5 border-l-2 border-alerta py-0.5 pl-3 text-[13px]">
              <p>
                <strong className="font-semibold">Campos marcados com IA vieram do documento.</strong> {CONFIANCA[sugestao.confianca]}{" "}
                Nada é salvo antes de você confirmar.
              </p>
              {sugestao.pareceRecorrente && (
                <Link
                  href="/compromissos/novo"
                  className="inline-flex w-fit items-center gap-1.5 font-medium underline-offset-4 hover:underline"
                >
                  <Repeat className="size-3.5" />
                  Essa conta parece se repetir todo mês. Cadastrar como compromisso recorrente
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      )}
      <FormAvulso key={versao} categorias={categorias} hoje={hoje} sugestao={sugestao} />
    </div>
  );
}
