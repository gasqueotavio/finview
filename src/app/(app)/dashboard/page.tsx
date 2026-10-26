import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const { mes: mesParam } = await searchParams;
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
    <div className="flex flex-col gap-8">
      <SeletorDeMes referencia={referencia} rotulo={nomeDoMesAno.format(dataRef)} mesAtual={mesAtual} />

      <DestaqueDoMes
        nomeDoMes={nomeDoMes.format(dataRef)}
        resumo={resumo}
        contasAtrasadas={lancamentos.filter((l) => l.situacao === "atrasado").length}
      />

      <ListaContas lancamentos={lancamentos} categorias={categorias} hoje={hoje} />

      <GastosPorCategoria lancamentos={lancamentos} categorias={categorias} />

      {mesAtual && <ContasAnuais hoje={hoje} />}
    </div>
  );
}

function SeletorDeMes({ referencia, rotulo, mesAtual }: { referencia: string; rotulo: string; mesAtual: boolean }) {
  const anterior = somarMeses(`${referencia}-01`, -1).slice(0, 7);
  const proximo = somarMeses(`${referencia}-01`, 1).slice(0, 7);
  const botao =
    "flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-foreground active:scale-90";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Link href={`?mes=${anterior}`} aria-label="Mês anterior" className={botao} scroll={false}>
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="min-w-40 text-center text-lg font-semibold tracking-tight first-letter:uppercase">{rotulo}</h1>
        <Link href={`?mes=${proximo}`} aria-label="Próximo mês" className={botao} scroll={false}>
          <ChevronRight className="size-5" />
        </Link>
      </div>
      {!mesAtual && (
        <Link href="/dashboard" className="rounded-full bg-card px-3.5 py-1.5 text-sm font-medium text-primary shadow-sm">
          Voltar para hoje
        </Link>
      )}
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Carregando">
      <Skeleton className="h-9 w-56 rounded-full" />
      <Skeleton className="h-48 rounded-3xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
