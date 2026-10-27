import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Valor } from "@/components/app/dinheiro";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/dados/categorias";
import { listarCompromissos } from "@/lib/dados/compromissos";
import { hojeEmBrasilia } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Linha, Tabela, type Cat } from "./tabela";

export const metadata = { title: "Compromissos · FinView" };

export default function CompromissosPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Compromissos</h1>
        <Link
          href="/compromissos/novo"
          className="hidden h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:flex"
        >
          <Plus className="size-4" />
          Novo compromisso
        </Link>
      </div>
      <Suspense fallback={<Esqueleto />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}

async function Conteudo() {
  await connection();
  const hoje = hojeEmBrasilia();
  const [todos, listaCategorias] = await Promise.all([listarCompromissos(), listarCategorias()]);
  const categorias = new Map<string, Cat>(listaCategorias.map((c) => [c.id, c]));
  const ativos = todos.filter((c) => c.status === "ativo");
  const encerrados = todos.filter((c) => c.status !== "ativo");

  const comprometidoMensal = ativos.reduce((s, c) => s + c.equivalenteMensal, 0);
  const saldoDevedor = ativos.reduce((s, c) => s + (c.saldoDevedor ?? 0), 0);

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 border-y py-10">
        <p className="font-semibold">Nenhum compromisso ainda</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Use o catálogo como checklist: aluguel, plano de saúde, financiamento, IPVA… assim nenhuma conta escapa.
        </p>
        <Link
          href="/compromissos/novo"
          className="mt-2 flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" />
          Abrir o catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <dl className="grid grid-cols-2 divide-x border-y md:grid-cols-3">
        <Indicador rotulo="Comprometido por mês" nota="anuais divididos por 12">
          <Valor valor={comprometidoMensal} />
        </Indicador>
        <Indicador rotulo="Saldo devedor" nota="financiamentos, consórcios e parcelas">
          <Valor valor={saldoDevedor} />
        </Indicador>
        <Indicador rotulo="Ativos" nota={`${encerrados.length} encerrados`} className="hidden md:block">
          <span className="dinheiro">{ativos.length}</span>
        </Indicador>
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-[15px] font-semibold">Ativos</h2>
        <Tabela>
          {ativos.map((c) => (
            <Linha key={c.id} c={c} categoria={c.categoriaId ? categorias.get(c.categoriaId) : undefined} hoje={hoje} />
          ))}
        </Tabela>
      </section>

      {encerrados.length > 0 && (
        <details className="group flex flex-col">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-3.5 -rotate-90 transition-transform group-open:rotate-0" />
            <span>
              <span className="font-medium text-foreground">Encerrados</span> · {encerrados.length}
            </span>
          </summary>
          <div className="mt-3">
            <Tabela>
              {encerrados.map((c) => (
                <Linha key={c.id} c={c} categoria={c.categoriaId ? categorias.get(c.categoriaId) : undefined} hoje={hoje} />
              ))}
            </Tabela>
          </div>
        </details>
      )}
    </>
  );
}

function Indicador({
  rotulo,
  nota,
  className,
  children,
}: {
  rotulo: string;
  nota: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 px-4 py-4 first:pl-0 md:px-6 md:first:pl-0", className)}>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-1 text-xl font-medium tracking-[-0.02em]">{children}</dd>
      <dd className="mt-0.5 text-xs text-muted-foreground">{nota}</dd>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Carregando">
      <Skeleton className="h-24 rounded-md" />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}
