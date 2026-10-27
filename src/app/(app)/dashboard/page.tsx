import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, CircleCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { listarCategorias } from "@/lib/dados/categorias";
import { listarLancamentosDoMes, resumoDoMes } from "@/lib/dados/lancamentos";
import { somarMeses } from "@/lib/financeiro";
import { hojeEmBrasilia } from "@/lib/formato";
import { ContasAnuais } from "./contas-anuais";
import { DestaqueDoMes } from "./destaque-mes";
import { GastosPorCategoria } from "./gastos-categoria";
import { ListaContas, type CategoriaResumida } from "./lista-contas";

export const metadata = { title: "Início · FinView" };

const nomeDoMes = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const nomeDoMesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  await connection();
  const hoje = hojeEmBrasilia();
  const { mes: mesParam, senha } = await searchParams;
  // ?mes=AAAA-MM; sem parâmetro (ou inválido), mês atual
  const referencia = typeof mesParam === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : hoje.slice(0, 7);
  const [ano, mes] = referencia.split("-").map(Number);
  const mesAtual = referencia === hoje.slice(0, 7);
  const dataRef = new Date(`${referencia}-01T00:00:00Z`);

  const [resumo, lancamentos, listaCategorias] = await Promise.all([
    resumoDoMes(ano, mes),
    listarLancamentosDoMes(ano, mes),
    listarCategorias(),
  ]);
  const categorias: Record<string, CategoriaResumida> = Object.fromEntries(
    listaCategorias.map((c) => [c.id, { chave: c.chave, nome: c.nome, cor: c.cor }]),
  );

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <SeletorDeMes referencia={referencia} rotulo={nomeDoMesAno.format(dataRef)} mesAtual={mesAtual} />

      {senha === "alterada" && (
        <p role="status" className="-mt-4 flex items-center gap-2 border-l-2 border-sucesso py-0.5 pl-3 text-sm text-sucesso">
          <CircleCheck className="size-4" />
          Senha alterada. Os outros aparelhos foram desconectados.
        </p>
      )}

      <DestaqueDoMes
        nomeDoMes={nomeDoMes.format(dataRef)}
        resumo={resumo}
        contasAtrasadas={lancamentos.filter((l) => l.situacao === "atrasado").length}
      />

      {/* Desktop: vencimentos à esquerda, análise do mês à direita */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <ListaContas lancamentos={lancamentos} categorias={categorias} hoje={hoje} />
        </div>
        <aside className="flex min-w-0 flex-col gap-10">
          <GastosPorCategoria lancamentos={lancamentos} categorias={categorias} />
          {mesAtual && <ContasAnuais hoje={hoje} />}
        </aside>
      </div>
    </div>
  );
}

function SeletorDeMes({ referencia, rotulo, mesAtual }: { referencia: string; rotulo: string; mesAtual: boolean }) {
  const anterior = somarMeses(`${referencia}-01`, -1).slice(0, 7);
  const proximo = somarMeses(`${referencia}-01`, 1).slice(0, 7);
  const botao =
    "flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground";

  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] first-letter:uppercase">{rotulo}</h1>
      <div className="flex items-center gap-1.5">
        {!mesAtual && (
          <Link
            href="/dashboard"
            className="mr-1 flex h-8 items-center rounded-md border bg-card px-3 text-[13px] font-medium transition-colors hover:bg-muted"
          >
            Hoje
          </Link>
        )}
        <Link href={`?mes=${anterior}`} aria-label="Mês anterior" className={botao} scroll={false}>
          <ChevronLeft className="size-4" />
        </Link>
        <Link href={`?mes=${proximo}`} aria-label="Próximo mês" className={botao} scroll={false}>
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-10" aria-busy aria-label="Carregando">
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-32 rounded-sm" />
        <Skeleton className="h-12 w-64 rounded-md" />
        <Skeleton className="mt-3 h-1.5 rounded-sm" />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}
