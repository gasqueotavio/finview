import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Rótulo + controle + ajuda/erro, com espaçamento padrão. */
export function Campo({
  rotulo,
  htmlFor,
  erro,
  ajuda,
  className,
  children,
}: {
  rotulo: React.ReactNode;
  htmlFor?: string;
  erro?: string;
  ajuda?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/90">
        {rotulo}
      </Label>
      {children}
      {erro ? (
        <p className="text-xs text-critico">{erro}</p>
      ) : ajuda ? (
        <p className="text-xs text-muted-foreground">{ajuda}</p>
      ) : null}
    </div>
  );
}

/** Select nativo com o visual do Input (no celular abre o seletor do sistema, que é o mais fluido). */
export function Selecao({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-xl border border-input bg-card bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 pl-3.5 text-[15px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export const estiloInput = "h-11 rounded-xl bg-card px-3.5 text-[15px] md:text-[15px]";

/** Valor em destaque, no topo do formulário (padrão dos apps de banco). */
export function CampoValor({
  id,
  name,
  rotulo,
  defaultValue,
  erro,
  autoFocus,
}: {
  id: string;
  name: string;
  rotulo: string;
  defaultValue?: string;
  erro?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {rotulo}
      </label>
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-2xl font-medium text-muted-foreground">R$</span>
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
          className="w-[7ch] max-w-full min-w-[4ch] bg-transparent text-center text-5xl font-semibold tracking-tight tabular-nums outline-none [field-sizing:content] placeholder:text-muted-foreground/40 supports-[field-sizing:content]:w-auto aria-invalid:text-critico"
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
  titulo,
  descricao,
}: {
  name: string;
  defaultChecked?: boolean;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-[15px] font-medium">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-[13px] text-muted-foreground">{descricao}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-7 w-12 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40" />
        <span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
