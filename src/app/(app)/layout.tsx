import Link from "next/link";
import { LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { Marca } from "@/components/app/marca";
import { NavegacaoInferior, NavegacaoLateral } from "@/components/app/navegacao";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      {/* Desktop: barra lateral fixa */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 px-2">
          <Marca />
        </Link>
        <NavegacaoLateral />
        <form action={sair} className="mt-auto">
          <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="size-[18px]" />
            Sair
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Celular: barra superior enxuta */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur-xl md:hidden">
          <Link href="/dashboard">
            <Marca className="text-base" />
          </Link>
          <form action={sair}>
            <button aria-label="Sair" className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
              <LogOut className="size-[18px]" />
            </button>
          </form>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-10 md:pb-12">{children}</main>
      </div>

      <NavegacaoInferior />
    </div>
  );
}
