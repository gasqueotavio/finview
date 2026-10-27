"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/formato";
import { desativarLinkAgenda, gerarLinkAgenda } from "./lembretes-actions";

export function Agenda({ criadaEm }: { criadaEm: string | null }) {
  // O endereço só existe na memória desta tela, logo depois de gerado (o banco guarda só o hash).
  const [url, setUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [ocupado, iniciar] = useTransition();
  const local = url?.startsWith("http://localhost") ?? false;

  function gerar() {
    iniciar(async () => {
      const r = await gerarLinkAgenda();
      if (r.url) setUrl(r.url);
      else toast.error(r.mensagem ?? "Não foi possível gerar o link.");
    });
  }

  function desativar() {
    iniciar(async () => {
      const r = await desativarLinkAgenda();
      if (r.ok) {
        setUrl(null);
        toast("Link da agenda desativado");
      } else toast.error(r.mensagem ?? "Não foi possível desativar.");
    });
  }

  async function copiar() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (url) {
    // O Google Agenda assina links webcal:// pelo parâmetro "cid".
    const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url.replace(/^https?:\/\//, "webcal://"))}`;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">Seu link está pronto. Guarde-o: por segurança, ele só aparece agora.</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            aria-label="Link da agenda"
            onFocus={(e) => e.currentTarget.select()}
            className="dinheiro h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-xs"
          />
          <Button type="button" variant="outline" size="sm" className="h-9 rounded-md" onClick={copiar}>
            {copiado ? <Check /> : <Copy />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        {local ? (
          <p className="text-xs text-muted-foreground">
            Você está no ambiente local: o Google não consegue acessar <span className="dinheiro">localhost</span>. Com o site
            publicado, aparece aqui o botão para adicionar direto.
          </p>
        ) : (
          <a
            href={google}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <CalendarPlus className="size-4" />
            Adicionar ao Google Agenda
          </a>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Ou, no Google Agenda pelo computador: <strong className="font-medium">Outras agendas → + → Do URL</strong> e cole o
          link. Funciona também no Apple Calendar e no Outlook. O Google atualiza agendas assinadas algumas vezes por dia, então
          uma conta nova pode levar algumas horas para aparecer.
        </p>
      </div>
    );
  }

  if (criadaEm) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Link ativo desde <span className="dinheiro">{formatarData(criadaEm.slice(0, 10))}</span>.
        </p>
        <p className="text-xs text-muted-foreground">
          Perdeu o link ou acha que alguém mais tem acesso? Gere um novo: o antigo para de funcionar na hora.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={ocupado} className="h-9 rounded-md" onClick={gerar}>
            Gerar novo link
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={ocupado} className="h-9 rounded-md text-muted-foreground" onClick={desativar}>
            Desativar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">
        Veja os vencimentos no Google Agenda (ou em qualquer agenda) como eventos de dia inteiro, com nome e valor da conta.
      </p>
      <Button type="button" size="sm" disabled={ocupado} className="h-9 rounded-md px-3" onClick={gerar}>
        <CalendarPlus />
        {ocupado ? "Gerando…" : "Gerar link da agenda"}
      </Button>
    </div>
  );
}
