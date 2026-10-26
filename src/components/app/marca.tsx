import { cn } from "@/lib/utils";

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
          <path d="M5 15.5 9.5 11l3.5 3.5L19 8.5" />
        </svg>
      </span>
      FinView
    </span>
  );
}
