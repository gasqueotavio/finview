"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hojeEmBrasilia } from "@/lib/formato";
import { cn } from "@/lib/utils";

const rotuloData = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", weekday: "short" });
const letraDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" });

// "AAAA-MM-DD" <-> Date no fuso local (só a data importa; evita o dia "voltar" por causa do UTC).
const paraDate = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};
const paraIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type Props = {
  id: string;
  name: string;
  /** Uso não controlado (formulários simples). */
  defaultValue?: string;
  /** Uso controlado (quando a tela recalcula algo a cada mudança). */
  value?: string;
  onChange?: (iso: string) => void;
  invalido?: boolean;
  /** Mostra "Limpar" quando a data pode ficar vazia. */
  opcional?: boolean;
};

/** Campo de data com calendário próprio (o seletor nativo do navegador não aceita estilo). Envia "AAAA-MM-DD". */
export function CampoData({ id, name, defaultValue = "", value, onChange, invalido, opcional }: Props) {
  const [interno, setInterno] = useState(defaultValue);
  const [aberto, setAberto] = useState(false);
  const iso = value ?? interno;
  const selecionada = iso ? paraDate(iso) : undefined;

  function escolher(novo: string) {
    if (value === undefined) setInterno(novo);
    onChange?.(novo);
    setAberto(false);
  }

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <input type="hidden" name={name} value={iso} />
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          data-invalido={invalido || undefined}
          className={cn(
            "flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-card px-3 text-left text-base outline-none transition-colors md:text-sm",
            "focus-visible:border-foreground/60 focus-visible:ring-3 focus-visible:ring-foreground/10 data-invalido:border-destructive data-[state=open]:border-foreground/60",
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          {selecionada ? (
            <span className="truncate first-letter:uppercase">{rotuloData.format(selecionada).replace(/\./g, "")}</span>
          ) : (
            <span className="text-muted-foreground">Escolher data</span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto gap-0 rounded-lg p-0">
        <Calendario selecionada={selecionada} podeLimpar={Boolean(opcional && iso)} aoEscolher={escolher} />
      </PopoverContent>
    </Popover>
  );
}

// Só monta com o calendário aberto: assim "hoje" é lido na hora do clique, não no pré-render da página.
function Calendario({
  selecionada,
  podeLimpar,
  aoEscolher,
}: {
  selecionada: Date | undefined;
  podeLimpar: boolean;
  aoEscolher: (iso: string) => void;
}) {
  const hoje = hojeEmBrasilia();
  const anoAtual = Number(hoje.slice(0, 4));

  return (
    <>
      <Calendar
        mode="single"
        locale={ptBR}
        selected={selecionada}
        defaultMonth={selecionada ?? paraDate(hoje)}
        onSelect={(d) => d && aoEscolher(paraIso(d))}
        captionLayout="dropdown"
        startMonth={new Date(anoAtual - 10, 0)}
        endMonth={new Date(anoAtual + 35, 11)}
        today={paraDate(hoje)}
        formatters={{ formatWeekdayName: (d) => letraDaSemana.format(d) }}
        className="bg-transparent p-3 [--cell-radius:6px] [--cell-size:--spacing(9)]"
        classNames={{
          weekday: "flex-1 text-[11px] font-medium text-muted-foreground select-none",
          today:
            "rounded-(--cell-radius) text-foreground [&_button]:font-semibold [&_button]:ring-1 [&_button]:ring-foreground/25 [&_button]:ring-inset",
          caption_label:
            "flex items-center gap-1 rounded-(--cell-radius) px-1 text-sm font-semibold capitalize [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
        }}
      />
      <div className="flex items-center justify-between border-t px-3 py-2">
        <button
          type="button"
          onClick={() => aoEscolher(hoje)}
          className="rounded-md px-2 py-1 text-[13px] font-medium transition-colors hover:bg-muted"
        >
          Hoje
        </button>
        {podeLimpar && (
          <button
            type="button"
            onClick={() => aoEscolher("")}
            className="rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>
    </>
  );
}
