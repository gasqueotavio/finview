"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { CircleCheck, Plus, Search } from "lucide-react";
import { BolhaCategoria } from "@/components/app/icones";
import { CATALOGO, CATEGORIAS_PADRAO } from "@/lib/catalogo";
import { cn } from "@/lib/utils";

// Busca sem acento e sem maiúsculas: "saude" encontra "Saúde".
const normalizar = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Catalogo({ cadastrados }: { cadastrados: string[] }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const termo = normalizar(useDeferredValue(busca).trim());
  const feitos = new Set(cadastrados);

  const visiveis = CATALOGO.filter(
    (m) =>
      (!categoria || m.categoria === categoria) &&
      (!termo || normalizar(`${m.nome} ${m.exemplos ?? ""}`).includes(termo)),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: plano de saúde, IPVA, Netflix…"
          className="h-12 w-full rounded-2xl border bg-card pr-4 pl-11 text-[15px] shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        />
      </div>

      {/* Filtro por categoria: rola na horizontal no celular */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        <Chip ativo={categoria === null} onClick={() => setCategoria(null)}>
          Todas
        </Chip>
        {CATEGORIAS_PADRAO.filter((c) => CATALOGO.some((m) => m.categoria === c.chave)).map((c) => (
          <Chip key={c.chave} ativo={categoria === c.chave} onClick={() => setCategoria(categoria === c.chave ? null : c.chave)}>
            {c.nome}
          </Chip>
        ))}
      </div>

      {CATEGORIAS_PADRAO.map((cat) => {
        const itens = visiveis.filter((m) => m.categoria === cat.chave);
        if (itens.length === 0) return null;
        return (
          <section key={cat.chave} className="flex flex-col gap-2">
            <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{cat.nome}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {itens.map((m) => {
                const feito = feitos.has(m.chave);
                return (
                  <li key={m.chave}>
                    <Link
                      href={`?modelo=${m.chave}`}
                      className="flex h-full items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/40 hover:bg-accent/40 active:scale-[0.99]"
                    >
                      <BolhaCategoria chave={cat.chave} cor={cat.cor} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{m.nome}</span>
                        {m.exemplos && <span className="block truncate text-[13px] text-muted-foreground">{m.exemplos}</span>}
                      </span>
                      {feito ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-sucesso">
                          <CircleCheck className="size-4" />
                          <span className="hidden sm:inline">Cadastrado</span>
                        </span>
                      ) : (
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {visiveis.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Nada encontrado para “{busca}”.</p>
      )}

      <Link
        href="?modelo=personalizado"
        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
      >
        <Plus className="size-4" />
        Não achou? Criar um personalizado
      </Link>
    </div>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "h-9 shrink-0 rounded-full border bg-card px-3.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition",
        ativo && "border-primary bg-primary text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}
