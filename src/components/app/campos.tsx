import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Rótulo + controle + ajuda/erro, com espaçamento padrão. */
export function Campo({
  rotulo,
  htmlFor,
  erro,
  ajuda,
  destaque,
  className,
  children,
}: {
  rotulo: React.ReactNode;
  htmlFor?: string;
  erro?: string;
  ajuda?: React.ReactNode;
  /** Valor sugerido pela IA: contorno e selo para a pessoa conferir antes de salvar. */
  destaque?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium">
        {rotulo}
        {destaque && <SeloIA />}
      </Label>
      {destaque ? <div className="rounded-md ring-2 ring-alerta/50 ring-offset-2 ring-offset-background">{children}</div> : children}
      {erro ? (
        <p className="text-xs text-critico">{erro}</p>
      ) : ajuda ? (
        <p className="text-xs text-muted-foreground">{ajuda}</p>
      ) : null}
    </div>
  );
}

// 16px no celular evita o zoom automático do iOS ao focar o campo.
const baseControle =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-base shadow-none outline-none transition-colors md:text-sm focus-visible:border-foreground/60 focus-visible:ring-3 focus-visible:ring-foreground/10 aria-invalid:border-destructive";

/** Select nativo com o visual do Input (no celular abre o seletor do sistema, que é o mais fluido). */
export function Selecao({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        baseControle,
        "seta-select appearance-none pr-8",
        className,
      )}
      {...props}
    />
  );
}

export const estiloInput = "h-10 rounded-md bg-card px-3 text-base shadow-none md:text-sm";

export function AreaTexto({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(baseControle, "h-auto py-2", className)} {...props} />;
}

/** Valor em destaque no topo do formulário, alinhado à esquerda como num extrato. */
export function CampoValor({
  id,
  name,
  rotulo,
  defaultValue,
  erro,
  autoFocus,
  destaque,
}: {
  id: string;
  name: string;
  rotulo: string;
  defaultValue?: string;
  erro?: string;
  autoFocus?: boolean;
  /** Valor sugerido pela IA (ver Campo). */
  destaque?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center text-[13px] font-medium">
        {rotulo}
        {destaque && <SeloIA />}
      </label>
      <div
        className={cn(
          "flex items-baseline gap-2 border-b border-input pb-2 transition-colors focus-within:border-foreground",
          destaque && "border-b-2 border-alerta/70",
          erro && "border-critico focus-within:border-critico",
        )}
      >
        <span className="text-xl text-muted-foreground">R$</span>
        <input
          id={id}
          name={name}
          required
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          aria-invalid={Boolean(erro)}
          className="w-full min-w-0 bg-transparent text-[40px] leading-none font-medium tracking-[-0.035em] tabular-nums outline-none placeholder:text-muted-foreground/35 aria-invalid:text-critico"
        />
      </div>
      {erro && <p className="text-xs text-critico">{erro}</p>}
    </div>
  );
}

/** Checkbox com visual de interruptor; continua um input nativo (envia "on" no formulário). */
export function Interruptor({
  name,
  defaultChecked,
  checked,
  onCheckedChange,
  titulo,
  descricao,
}: {
  name: string;
  defaultChecked?: boolean;
  /** Modo controlado (quando outro campo da tela decide o valor). */
  checked?: boolean;
  onCheckedChange?: (marcado: boolean) => void;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <span>
        <span className="block text-sm font-medium">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-[13px] text-muted-foreground">{descricao}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          {...(checked === undefined ? { defaultChecked } : { checked, onChange: (e) => onCheckedChange?.(e.target.checked) })}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-foreground/20" />
        <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

/** Bloco de formulário: título pequeno à esquerda no desktop, campos à direita (padrão de páginas de configuração). */
export function GrupoFormulario({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 border-t py-6 first:border-t-0 first:pt-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {descricao && <p className="mt-1 text-[13px] text-muted-foreground">{descricao}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Botão de salvar: barra fixa acima das abas no celular; alinhado à direita no desktop. */
export function RodapeFormulario({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:flex md:justify-end md:bg-transparent md:px-0 md:pt-6 md:pb-0 md:backdrop-blur-none">
      {children}
    </div>
  );
}

/** Selo ao lado do rótulo de um campo preenchido pela leitura com IA. */
export function SeloIA() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-[4px] border border-alerta/40 px-1 py-px text-[10px] leading-none font-semibold tracking-[0.04em] text-alerta uppercase">
      <span className="sr-only">Preenchido pela </span>IA
    </span>
  );
}
