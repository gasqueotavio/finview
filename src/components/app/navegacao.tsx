"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, CalendarClock, House, Plus, Receipt, Repeat, UserRound, type LucideIcon } from "lucide-react";
import { Painel } from "@/components/app/painel";
import { cn } from "@/lib/utils";

const ITENS: { href: string; rotulo: string; Icone: LucideIcon }[] = [
  { href: "/dashboard", rotulo: "Início", Icone: House },
  { href: "/compromissos", rotulo: "Compromissos", Icone: CalendarClock },
  { href: "/conta", rotulo: "Minha conta", Icone: UserRound },
];

function ativo(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`) && !pathname.endsWith("/novo"));
}

export function NavegacaoLateral() {
  const [adicionando, setAdicionando] = useState(false);

  // Atalho "N" abre o "Adicionar" (fora de campos de texto, sem modificadores).
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (e.key.toLowerCase() !== "n" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) return;
      e.preventDefault();
      setAdicionando(true);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAdicionando(true)}
        aria-keyshortcuts="n"
        className="mb-5 flex h-9 w-full items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="size-4" />
        Adicionar
        <kbd aria-hidden className="ml-auto font-mono text-[11px] opacity-60">N</kbd>
      </button>
      <nav className="flex flex-col gap-0.5">
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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3">
          <Suspense fallback={<ItemInferior item={inicio} ativo={false} />}>
            <ComPathname>{(pathname) => <ItemInferior item={inicio} ativo={ativo(pathname, inicio.href)} />}</ComPathname>
          </Suspense>
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-foreground"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plus className="size-4" strokeWidth={2.4} />
            </span>
            Adicionar
          </button>
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
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
        ativo && "bg-sidebar-accent font-medium text-foreground",
      )}
    >
      <Icone className="size-4" />
      {rotulo}
    </Link>
  );
}

function ItemInferior({ item: { href, rotulo, Icone }, ativo }: { item: (typeof ITENS)[number]; ativo: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors",
        ativo && "text-foreground",
      )}
    >
      <Icone className="size-5" strokeWidth={ativo ? 2.2 : 1.8} />
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
      <div className="divide-y overflow-hidden rounded-lg border">
        {opcoes.map(({ href, Icone, titulo, descricao }) => (
          <Link
            key={href}
            href={href}
            onClick={() => aoMudar(false)}
            className="group flex items-center gap-3.5 bg-card px-4 py-3.5 transition-colors hover:bg-muted/60"
          >
            <Icone className="size-[18px] shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{titulo}</span>
              <span className="block text-[13px] text-muted-foreground">{descricao}</span>
            </span>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Painel>
  );
}
