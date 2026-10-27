import { Valor } from "@/components/app/dinheiro";
import { AmostraCategoria } from "@/components/app/icones";
import type { Lancamento } from "@/lib/dados/lancamentos";
import { formatarMoeda } from "@/lib/formato";
import type { CategoriaResumida } from "./lista-contas";

// Barras horizontais de uma cor só (magnitude), da maior para a menor.
// Até 5 categorias nomeadas; o resto vira "Outras" (mais cores não ajudariam a ler).
const MAXIMO_NOMEADAS = 5;

type Fatia = { id: string; nome: string; cor: string | null; total: number };

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
      return { id, nome: c?.nome ?? "Sem categoria", cor: c?.cor ?? null, total };
    })
    .sort((a, b) => b.total - a.total);

  if (fatias.length === 0) return null;

  const nomeadas = fatias.slice(0, MAXIMO_NOMEADAS);
  const resto = fatias.slice(MAXIMO_NOMEADAS);
  if (resto.length > 0) {
    nomeadas.push({ id: "outras", nome: `Outras (${resto.length})`, cor: null, total: resto.reduce((s, f) => s + f.total, 0) });
  }

  const totalGeral = fatias.reduce((s, f) => s + f.total, 0);
  const maior = Math.max(...nomeadas.map((f) => f.total));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 className="text-[15px] font-semibold">Por categoria</h2>
        <Valor valor={totalGeral} className="text-[13px] text-muted-foreground" />
      </div>
      <ul className="flex flex-col gap-3.5">
        {nomeadas.map((f) => {
          const pct = totalGeral > 0 ? (f.total / totalGeral) * 100 : 0;
          return (
            <li key={f.id} title={`${f.nome}: ${formatarMoeda(f.total)} (${pct.toFixed(0)}% do mês)`} className="group">
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <AmostraCategoria cor={f.cor} />
                  <span className="truncate">{f.nome}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <Valor valor={f.total} className="font-medium" />
                  <span className="dinheiro w-8 text-right text-[11px] text-muted-foreground">{pct.toFixed(0)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-[1px] bg-chart-track" aria-hidden>
                <div
                  className="h-full rounded-[1px] bg-chart-1 transition-[width] duration-500"
                  style={{ width: `${Math.max(1.5, (f.total / maior) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground">Inclui contas pagas e a pagar do mês.</p>
    </section>
  );
}
