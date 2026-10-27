"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { ArrowRight, Check, Plus, Search } from "lucide-react";
import { AmostraCategoria } from "@/components/app/icones";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar: plano de saúde, IPVA, Netflix…"
            aria-label="Buscar no catálogo"
            className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-base outline-none transition-colors focus-visible:border-foreground/60 focus-visible:ring-3 focus-visible:ring-foreground/10 md:text-sm"
          />
        </div>

        {/* Filtro por categoria: rola na horizontal no celular */}
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
          <Filtro ativo={categoria === null} onClick={() => setCategoria(null)}>
            Todas
          </Filtro>
          {CATEGORIAS_PADRAO.filter((c) => CATALOGO.some((m) => m.categoria === c.chave)).map((c) => (
            <Filtro key={c.chave} ativo={categoria === c.chave} onClick={() => setCategoria(categoria === c.chave ? null : c.chave)}>
              {c.nome}
            </Filtro>
          ))}
        </div>
      </div>

      {CATEGORIAS_PADRAO.map((cat) => {
        const itens = visiveis.filter((m) => m.categoria === cat.chave);
        if (itens.length === 0) return null;
        return (
          <section key={cat.chave} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold">
              <AmostraCategoria cor={cat.cor} />
              {cat.nome}
              <span className="dinheiro font-normal text-muted-foreground">{itens.length}</span>
            </h2>
            {/* Grade com linhas finas: o fundo cinza aparece só no espaço de 1px entre as células */}
            <ul className="-mx-4 grid gap-px overflow-hidden border-y bg-border md:mx-0 md:rounded-lg md:border sm:grid-cols-2">
              {itens.map((m) => {
                const feito = feitos.has(m.chave);
                return (
                  <li key={m.chave} className="bg-card sm:last:odd:col-span-2">
                    <Link href={`?modelo=${m.chave}`} className="group flex h-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{m.nome}</span>
                        {m.exemplos && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.exemplos}</span>}
                      </span>
                      {feito ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs text-sucesso">
                          <Check className="size-3.5" strokeWidth={2.5} />
                          Cadastrado
                        </span>
                      ) : (
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
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
        <p className="border-y py-8 text-center text-sm text-muted-foreground">Nada encontrado para “{busca}”.</p>
      )}

      <Link
        href="?modelo=personalizado"
        className="flex w-fit items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <Plus className="size-4" />
        Não achou? Criar um personalizado
      </Link>
    </div>
  );
}

function Filtro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "h-8 shrink-0 rounded-md border bg-card px-2.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
        ativo && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
      )}
    >
      {children}
    </button>
  );
}
