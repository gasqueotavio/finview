import { cn } from "@/lib/utils";

/** Logotipo: um livro-caixa (linhas de lançamento) com a última conta ticada. */
export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]", className)}>
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
        <rect width="20" height="20" rx="5" fill="currentColor" />
        <path d="M5 6.5h10M5 10h6" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m11.8 13.6 1.6 1.5 2.6-3" fill="none" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      finview
    </span>
  );
}
