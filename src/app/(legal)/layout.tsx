import Link from "next/link";
import { AssinaturaAutor } from "@/components/app/assinatura";
import { Marca } from "@/components/app/marca";

// Páginas públicas de texto (Política de Privacidade, Termos de Uso).
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-5">
          <Link href="/">
            <Marca />
          </Link>
          <nav className="flex gap-4 text-[13px] text-muted-foreground">
            <Link href="/privacidade" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-foreground">
              Termos
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:py-14">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <AssinaturaAutor />
      </footer>
    </div>
  );
}
