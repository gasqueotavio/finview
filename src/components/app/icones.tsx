import { cn } from "@/lib/utils";

/**
 * Amostra da cor da categoria. Sempre aparece ao lado do nome da categoria (ou do lançamento),
 * então a cor ajuda a reconhecer, mas nunca é a única forma de identificar.
 */
export function AmostraCategoria({ cor, className }: { cor: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-[2px]", className)}
      style={{ backgroundColor: cor ?? "var(--muted-foreground)" }}
    />
  );
}
