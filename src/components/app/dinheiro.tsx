import { formatarMoeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Valor em destaque, como nos apps de banco: "R$" e centavos menores, reais em evidência.
 * O texto completo fica no aria-label para leitores de tela lerem de uma vez.
 */
export function ValorDestaque({ valor, estimado, className }: { valor: number; estimado?: boolean; className?: string }) {
  const texto = formatarMoeda(valor);
  const partes = /^(-?)R\$\s?(.+),(\d{2})$/.exec(texto);
  if (!partes) return <span className={className}>{texto}</span>;
  const [, sinal, reais, centavos] = partes;

  return (
    <span aria-label={`${estimado ? "aproximadamente " : ""}${texto}`} className={cn("inline-flex items-baseline tabular-nums", className)}>
      <span aria-hidden className="mr-[0.25em] self-start pt-[0.18em] text-[0.42em] font-normal text-muted-foreground">
        {estimado && "≈ "}
        R$
      </span>
      <span aria-hidden>
        {sinal}
        {reais}
      </span>
      <span aria-hidden className="text-[0.58em] text-muted-foreground">,{centavos}</span>
    </span>
  );
}

/** Valor em linha (listas e tabelas). */
export function Valor({ valor, estimado, className }: { valor: number; estimado?: boolean; className?: string }) {
  return (
    <span className={cn("dinheiro whitespace-nowrap", className)}>
      {estimado && <span className="text-muted-foreground">≈ </span>}
      {formatarMoeda(valor)}
    </span>
  );
}
