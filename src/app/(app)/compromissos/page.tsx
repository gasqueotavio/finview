import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { BolhaCategoria } from "@/components/app/icones";
import { Skeleton } from "@/components/ui/skeleton";
import { FREQUENCIAS, TIPOS_COMPROMISSO } from "@/lib/catalogo";
import { listarCategorias } from "@/lib/dados/categorias";
import { listarCompromissos, type ResumoCompromisso } from "@/lib/dados/compromissos";
import { formatarData, formatarMoeda, hojeEmBrasilia } from "@/lib/formato";
import { AcoesCompromisso } from "./acoes";

export const metadata = { title: "Compromissos · FinView" };

type Cat = { chave: string | null; cor: string; nome: string };

export default function CompromissosPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Compromissos</h1>
        <Link
          href="/compromissos/novo"
          className="hidden h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:brightness-110 md:flex"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          Novo
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
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed bg-card px-6 py-14 text-center">
        <p className="text-lg font-semibold">Nenhum compromisso ainda</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Use o catálogo como checklist: aluguel, plano de saúde, financiamento, IPVA… assim nenhuma conta escapa.
        </p>
        <Link
          href="/compromissos/novo"
          className="mt-2 flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          Adicionar o primeiro
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[13px] text-muted-foreground">Comprometido por mês</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{formatarMoeda(comprometidoMensal)}</p>
          <p className="mt-1 text-xs text-muted-foreground">anuais divididos por 12</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-[13px] text-muted-foreground">Saldo devedor</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{formatarMoeda(saldoDevedor)}</p>
          <p className="mt-1 text-xs text-muted-foreground">parcelas que faltam</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">
          Ativos <span className="font-normal text-muted-foreground">· {ativos.length}</span>
        </h2>
        <ul className="flex flex-col gap-3">
          {ativos.map((c) => (
            <Cartao key={c.id} c={c} categoria={c.categoriaId ? categorias.get(c.categoriaId) : undefined} hoje={hoje} />
          ))}
        </ul>
      </section>

      {encerrados.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              Encerrados <span className="font-normal text-muted-foreground">· {encerrados.length}</span>
            </span>
            <span className="text-sm font-medium text-primary group-open:hidden">Mostrar</span>
            <span className="hidden text-sm font-medium text-primary group-open:inline">Ocultar</span>
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {encerrados.map((c) => (
              <Cartao key={c.id} c={c} categoria={c.categoriaId ? categorias.get(c.categoriaId) : undefined} hoje={hoje} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

function Cartao({ c, categoria, hoje }: { c: ResumoCompromisso; categoria?: Cat; hoje: string }) {
  const temPrazo = TIPOS_COMPROMISSO[c.tipo].temPrazo;
  const progresso = temPrazo && c.totalParcelas ? Math.min(100, (c.parcelasPagas / c.totalParcelas) * 100) : null;
  const encerrado = c.status !== "ativo";
  const subtitulo =
    c.tipo === "anual"
      ? "Conta anual"
      : `${TIPOS_COMPROMISSO[c.tipo].nome}${c.frequencia !== "mensal" ? ` · ${FREQUENCIAS[c.frequencia].toLowerCase()}` : ""}`;

  return (
    <li className={`flex flex-col gap-4 rounded-2xl border bg-card p-4 ${encerrado ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <BolhaCategoria chave={categoria?.chave} cor={categoria?.cor} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{c.descricao}</p>
          <p className="truncate text-[13px] text-muted-foreground">{subtitulo}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[15px] font-semibold tabular-nums">
            {c.valorVariavel && <span className="font-normal text-muted-foreground">≈ </span>}
            {formatarMoeda(c.tipo === "anual" && c.valorAnual !== null ? c.valorAnual : c.valorParcela)}
          </p>
          <p className="text-xs text-muted-foreground">{c.tipo === "anual" ? "por ano" : "por parcela"}</p>
        </div>
      </div>

      {progresso !== null && (
        <div>
          <div
            className="h-2 overflow-hidden rounded-full bg-chart-track"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso)}
            aria-label="Parcelas pagas"
          >
            <div className="h-full rounded-full bg-chart-1" style={{ width: `${progresso}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[13px]">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{c.parcelasPagas}</span> de {c.totalParcelas} pagas
            </span>
            {c.saldoDevedor !== null && (
              <span className="text-muted-foreground">
                faltam <span className="font-medium text-foreground tabular-nums">{formatarMoeda(c.saldoDevedor)}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[13px]">
        <span className="flex items-center gap-2 text-muted-foreground">
          {encerrado
            ? `${c.status === "quitado" ? "Quitado" : "Cancelado"} em ${formatarData(c.encerradoEm!)}`
            : c.proximoVencimento && `Próximo: ${formatarData(c.proximoVencimento)}`}
          {c.parcelasAtrasadas > 0 && (
            <span className="flex items-center gap-1 font-medium text-critico">
              <CircleAlert className="size-3.5" />
              {c.parcelasAtrasadas} {c.parcelasAtrasadas === 1 ? "atrasada" : "atrasadas"}
            </span>
          )}
        </span>
        {!encerrado && <AcoesCompromisso id={c.id} descricao={c.descricao} podeQuitar={temPrazo} saldoDevedor={c.saldoDevedor} hoje={hoje} />}
      </div>
    </li>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-8" aria-busy aria-label="Carregando">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
