import { BellRing, Lock, Repeat } from "lucide-react";
import { Marca } from "@/components/app/marca";

const DESTAQUES = [
  { Icone: BellRing, titulo: "Nada passa batido", texto: "Contas, parcelas e impostos anuais lembrados no dia certo." },
  { Icone: Repeat, titulo: "Recorrentes no automático", texto: "Cadastre uma vez o aluguel, o plano ou o financiamento." },
  { Icone: Lock, titulo: "Seus dados cifrados", texto: "Descrições criptografadas: nem o banco de dados lê." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Painel da marca (desktop) */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute -top-40 -right-40 size-[520px] rounded-full bg-white/10 blur-3xl"
        />
        <div aria-hidden className="absolute -bottom-48 -left-32 size-[460px] rounded-full bg-black/10 blur-3xl" />

        <Marca className="relative text-primary-foreground [&>span]:bg-white [&>span]:text-primary" />

        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">Suas contas em dia, sem esforço.</h1>
          <ul className="mt-10 flex flex-col gap-6">
            {DESTAQUES.map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icone className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-primary-foreground/80">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Marca className="mb-10 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}
