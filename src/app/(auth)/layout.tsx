import Link from "next/link";
import { Marca } from "@/components/app/marca";
import { AssinaturaAutor } from "@/components/app/assinatura";
import { PreviaAnimada } from "./previa-animada";

const PONTOS = [
  "Contas, parcelas e impostos anuais lembrados no dia certo.",
  "Cadastre uma vez o aluguel, o plano ou o financiamento.",
  "Descrições cifradas com chave própria de cada usuário.",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Formulário */}
      <section className="flex flex-col px-5 py-6 md:px-10">
        <Marca />
        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-12">{children}</div>
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Seus dados ficam só com você.{" "}
            <Link href="/privacidade" className="underline-offset-4 hover:text-foreground hover:underline">
              Privacidade
            </Link>{" "}
            ·{" "}
            <Link href="/termos" className="underline-offset-4 hover:text-foreground hover:underline">
              Termos
            </Link>
          </span>
          <AssinaturaAutor />
        </div>
      </section>

      {/* Prévia do produto (desktop) */}
      <section className="hidden flex-col justify-center gap-10 border-l bg-card px-14 py-12 lg:flex">
        <div className="max-w-[460px]">
          <h1 className="text-[40px] leading-[1.05] font-semibold tracking-[-0.035em]">
            Toda conta do mês,
            <br />
            num lugar só.
          </h1>
          <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            {PONTOS.map((p, i) => (
              <li key={p} className="flex gap-3">
                <span className="dinheiro text-foreground">0{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <PreviaAnimada />
      </section>
    </main>
  );
}
