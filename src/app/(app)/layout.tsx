import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { AssinaturaAutor } from "@/components/app/assinatura";
import { Marca } from "@/components/app/marca";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/app/navegacao";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      {/* Desktop: barra lateral fixa, do mesmo tom do fundo (separada só por uma linha) */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r bg-sidebar px-3 py-5 md:flex">
        <Link href="/dashboard" className="mb-6 px-2.5">
          <Marca />
        </Link>
        <NavegacaoLateral />
        <form action={sair} className="mt-auto">
          <button className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Celular: barra superior enxuta */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard">
            <Marca className="text-base" />
          </Link>
          <Link
            href="/conta"
            aria-label="Minha conta"
            className="-mr-2 flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <UserRound className="size-[18px]" />
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-5 pb-28 md:px-10 md:pt-8 md:pb-8">
          <div className="flex-1">{children}</div>
          <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
            <AssinaturaAutor />
            <span aria-hidden>·</span>
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
          </footer>
        </main>
      </div>

      <NavegacaoInferior />
    </div>
  );
}
