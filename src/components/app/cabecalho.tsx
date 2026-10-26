import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function Cabecalho({
  voltarPara,
  titulo,
  subtitulo,
}: {
  voltarPara: string;
  titulo: React.ReactNode;
  subtitulo?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Link
        href={voltarPara}
        aria-label="Voltar"
        className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-foreground active:scale-90"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <div className="min-w-0 pt-0.5">
        <h1 className="text-2xl leading-tight font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
    </div>
  );
}
