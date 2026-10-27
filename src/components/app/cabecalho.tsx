import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      <Link
        href={voltarPara}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar
      </Link>
      <div>
        <h1 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">{titulo}</h1>
        {subtitulo && <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
    </div>
  );
}
