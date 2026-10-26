import { BolhaCategoria } from "@/components/app/icones";
import type { Lancamento } from "@/lib/dados/lancamentos";
import { formatarMoeda } from "@/lib/formato";
import type { CategoriaResumida } from "./lista-contas";

// Barras horizontais de uma cor só (magnitude), da maior para a menor.
// Até 5 categorias nomeadas; o resto vira "Outras" (mais cores não ajudariam a ler).
const MAXIMO_NOMEADAS = 5;

type Fatia = { id: string; nome: string; chave: string | null; cor: string | null; total: number };

export function GastosPorCategoria({
  lancamentos,
  categorias,
}: {
  lancamentos: Lancamento[];
  categorias: Record<string, CategoriaResumida>;
}) {
  const totais = new Map<string, number>();
  for (const l of lancamentos) {
    const valor = l.situacao === "pago" && l.valorPago !== null ? l.valorPago : l.valor;
    const chave = l.categoriaId ?? "sem";
    totais.set(chave, (totais.get(chave) ?? 0) + valor);
  }

  const fatias: Fatia[] = [...totais.entries()]
    .map(([id, total]) => {
      const c = categorias[id];
      return { id, nome: c?.nome ?? "Sem categoria", chave: c?.chave ?? null, cor: c?.cor ?? null, total };
    })
    .sort((a, b) => b.total - a.total);

  if (fatias.length === 0) return null;

  const nomeadas = fatias.slice(0, MAXIMO_NOMEADAS);
  const resto = fatias.slice(MAXIMO_NOMEADAS);
  if (resto.length > 0) {
    nomeadas.push({ id: "outras", nome: `Outras (${resto.length})`, chave: null, cor: null, total: resto.reduce((s, f) => s + f.total, 0) });
  }

  const totalGeral = fatias.reduce((s, f) => s + f.total, 0);
  const maior = Math.max(...nomeadas.map((f) => f.total));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Para onde vai o dinheiro</h2>
      <div className="rounded-2xl border bg-card p-4 md:p-5">
        <ul className="flex flex-col gap-4">
          {nomeadas.map((f) => {
            const pct = totalGeral > 0 ? (f.total / totalGeral) * 100 : 0;
            const rotulo = `${f.nome}: ${formatarMoeda(f.total)} (${pct.toFixed(0)}% do mês)`;
            return (
              <li key={f.id} title={rotulo} className="group flex items-center gap-3">
                <BolhaCategoria chave={f.chave} cor={f.cor} tamanho="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{f.nome}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">{formatarMoeda(f.total)}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-chart-track" aria-hidden>
                    <div
                      className="h-full rounded-full bg-chart-1 transition-[width] duration-500 group-hover:brightness-110"
                      style={{ width: `${Math.max(2, (f.total / maior) * 100)}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Total do mês: <span className="font-medium text-foreground tabular-nums">{formatarMoeda(totalGeral)}</span> · inclui contas
          pagas e a pagar
        </p>
      </div>
    </section>
  );
}
