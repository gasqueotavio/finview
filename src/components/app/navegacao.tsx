"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, CalendarClock, House, Plus, Receipt, Repeat, type LucideIcon } from "lucide-react";
import { Painel } from "@/components/app/painel";
import { cn } from "@/lib/utils";

const ITENS: { href: string; rotulo: string; Icone: LucideIcon }[] = [
  { href: "/dashboard", rotulo: "Início", Icone: House },
  { href: "/compromissos", rotulo: "Compromissos", Icone: CalendarClock },
];

function ativo(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`) && !pathname.endsWith("/novo"));
}

export function NavegacaoLateral() {
  const [adicionando, setAdicionando] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAdicionando(true)}
        className="mb-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition hover:brightness-110 active:scale-[0.98]"
      >
        <Plus className="size-4" strokeWidth={2.6} />
        Adicionar
      </button>
      <nav className="flex flex-col gap-1">
        {ITENS.map((item) => (
          <Suspense key={item.href} fallback={<ItemLateral item={item} ativo={false} />}>
            <ComPathname>{(pathname) => <ItemLateral item={item} ativo={ativo(pathname, item.href)} />}</ComPathname>
          </Suspense>
        ))}
      </nav>
      <PainelAdicionar aberto={adicionando} aoMudar={setAdicionando} />
    </>
  );
}

export function NavegacaoInferior() {
  const [adicionando, setAdicionando] = useState(false);
  const [inicio, compromissos] = ITENS;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3 items-center">
          <Suspense fallback={<ItemInferior item={inicio} ativo={false} />}>
            <ComPathname>{(pathname) => <ItemInferior item={inicio} ativo={ativo(pathname, inicio.href)} />}</ComPathname>
          </Suspense>
          <div className="flex justify-center">
            <button
              type="button"
              aria-label="Adicionar"
              onClick={() => setAdicionando(true)}
              className="flex size-13 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition active:scale-95"
            >
              <Plus className="size-6" strokeWidth={2.6} />
            </button>
          </div>
          <Suspense fallback={<ItemInferior item={compromissos} ativo={false} />}>
            <ComPathname>
              {(pathname) => <ItemInferior item={compromissos} ativo={ativo(pathname, compromissos.href)} />}
            </ComPathname>
          </Suspense>
        </div>
      </nav>
      <PainelAdicionar aberto={adicionando} aoMudar={setAdicionando} />
    </>
  );
}

// Ler a URL atual é dado de requisição: fica isolado atrás de <Suspense> para não travar a página.
function ComPathname({ children }: { children: (pathname: string) => React.ReactNode }) {
  return children(usePathname());
}

function ItemLateral({ item: { href, rotulo, Icone }, ativo }: { item: (typeof ITENS)[number]; ativo: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        ativo && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icone className="size-[18px]" />
      {rotulo}
    </Link>
  );
}

function ItemInferior({ item: { href, rotulo, Icone }, ativo }: { item: (typeof ITENS)[number]; ativo: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors",
        ativo && "text-primary",
      )}
    >
      <Icone className="size-[22px]" strokeWidth={ativo ? 2.4 : 2} />
      {rotulo}
    </Link>
  );
}

function PainelAdicionar({ aberto, aoMudar }: { aberto: boolean; aoMudar: (v: boolean) => void }) {
  const opcoes = [
    {
      href: "/lancamentos/novo",
      Icone: Receipt,
      titulo: "Gasto avulso",
      descricao: "Uma compra ou conta que não se repete",
    },
    {
      href: "/compromissos/novo",
      Icone: Repeat,
      titulo: "Conta recorrente ou parcelada",
      descricao: "Aluguel, plano de saúde, financiamento, IPVA…",
    },
  ];

  return (
    <Painel aberto={aberto} aoMudar={aoMudar} titulo="O que você quer adicionar?">
      <div className="flex flex-col gap-2">
        {opcoes.map(({ href, Icone, titulo, descricao }) => (
          <Link
            key={href}
            href={href}
            onClick={() => aoMudar(false)}
            className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/50 active:scale-[0.99]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icone className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{titulo}</span>
              <span className="block text-sm text-muted-foreground">{descricao}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </Painel>
  );
}
