"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { BellOff, BellRing, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Interruptor } from "@/components/app/campos";
import { Button } from "@/components/ui/button";
import type { Aparelho, PreferenciasNotificacao } from "@/lib/dados/lembretes";
import { ativarNotificacoes, desativarNotificacoes, enviarTeste, salvarPreferencias, type Resultado } from "./lembretes-actions";

type Estado =
  | { tipo: "verificando" }
  | { tipo: "sem-suporte" }
  | { tipo: "instalar-ios" }
  | { tipo: "bloqueado" }
  | { tipo: "pronto"; endpoint: string | null };

// A chave pública VAPID chega como base64url; o navegador quer os bytes.
function chaveDoServidor(base64: string) {
  const normal = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(normal), (c) => c.charCodeAt(0));
}

// "Chrome no Android", "Safari no iPhone"... só para você reconhecer o aparelho na lista.
function nomeDoAparelho() {
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const sistema = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "outro sistema";
  return `${navegador} no ${sistema}`;
}

async function registrarServiceWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

export function Notificacoes({ preferencias, aparelhos }: { preferencias: PreferenciasNotificacao; aparelhos: Aparelho[] }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "verificando" });
  const [ocupado, iniciar] = useTransition();

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const instalado = window.matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        // No iPhone o push só existe com o app instalado na tela de início.
        setEstado({ tipo: ios && !instalado ? "instalar-ios" : "sem-suporte" });
        return;
      }
      if (Notification.permission === "denied") {
        setEstado({ tipo: "bloqueado" });
        return;
      }
      const registro = await registrarServiceWorker();
      const inscricao = await registro.pushManager.getSubscription();
      setEstado({ tipo: "pronto", endpoint: inscricao?.endpoint ?? null });
    })().catch(() => setEstado({ tipo: "sem-suporte" }));
  }, []);

  const ativoAqui = estado.tipo === "pronto" && estado.endpoint !== null && aparelhos.some((a) => a.endpoint === estado.endpoint);
  const outros = aparelhos.filter((a) => estado.tipo !== "pronto" || a.endpoint !== estado.endpoint);

  function ativar() {
    iniciar(async () => {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        if (permissao === "denied") setEstado({ tipo: "bloqueado" });
        toast.error("Sem permissão, o FinView não consegue avisar.");
        return;
      }
      const registro = await registrarServiceWorker();
      await navigator.serviceWorker.ready;
      const inscricao =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveDoServidor(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }));
      const r = await ativarNotificacoes(inscricao.toJSON(), nomeDoAparelho());
      if (!r.ok) {
        toast.error(r.mensagem ?? "Não foi possível ativar.");
        return;
      }
      setEstado({ tipo: "pronto", endpoint: inscricao.endpoint });
      toast.success("Notificações ativadas neste aparelho");
    });
  }

  function desativar() {
    iniciar(async () => {
      const registro = await navigator.serviceWorker.getRegistration();
      const inscricao = await registro?.pushManager.getSubscription();
      if (inscricao) {
        await desativarNotificacoes(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setEstado({ tipo: "pronto", endpoint: null });
      toast("Notificações desativadas neste aparelho");
    });
  }

  function testar() {
    iniciar(async () => {
      const r = await enviarTeste();
      if (r.ok) toast.success(r.mensagem ?? "Enviada");
      else toast.error(r.mensagem ?? "Não foi possível enviar.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Este aparelho */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        {estado.tipo === "verificando" && <p className="text-sm text-muted-foreground">Verificando este navegador…</p>}
        {estado.tipo === "sem-suporte" && (
          <p className="text-sm text-muted-foreground">Este navegador não aceita notificações. No computador, use Chrome, Edge ou Firefox.</p>
        )}
        {estado.tipo === "instalar-ios" && (
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-medium">No iPhone, instale o FinView primeiro</p>
            <p className="text-muted-foreground">
              No Safari, toque em <strong className="font-medium text-foreground">Compartilhar</strong> e depois em{" "}
              <strong className="font-medium text-foreground">Adicionar à Tela de Início</strong>. Abra o FinView pelo ícone e volte
              aqui para ativar.
            </p>
          </div>
        )}
        {estado.tipo === "bloqueado" && (
          <div className="flex flex-col gap-1 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <BellOff className="size-4" />
              Notificações bloqueadas neste navegador
            </p>
            <p className="text-muted-foreground">
              Libere em configurações do site (cadeado ao lado do endereço → Notificações → Permitir) e recarregue a página.
            </p>
          </div>
        )}
        {estado.tipo === "pronto" &&
          (ativoAqui ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium text-sucesso">
                <BellRing className="size-4" />
                Ativadas neste aparelho
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={ocupado} className="h-8 rounded-md" onClick={testar}>
                  <Send />
                  Enviar teste
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={ocupado} className="h-8 rounded-md text-muted-foreground" onClick={desativar}>
                  Desativar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Receba um aviso de manhã quando uma conta estiver para vencer.</p>
              <Button type="button" size="sm" disabled={ocupado} className="h-9 rounded-md px-3" onClick={ativar}>
                <BellRing />
                {ocupado ? "Ativando…" : "Ativar neste aparelho"}
              </Button>
            </div>
          ))}
      </div>

      {outros.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium">Outros aparelhos ativados</p>
          <ul className="divide-y rounded-lg border bg-card text-sm">
            {outros.map((a) => (
              <li key={a.endpoint} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="size-3.5" />
                  {a.dispositivo ?? "Aparelho"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={ocupado}
                  className="h-7 rounded-md text-muted-foreground"
                  onClick={() =>
                    iniciar(async () => {
                      const r = await desativarNotificacoes(a.endpoint);
                      if (!r.ok) toast.error(r.mensagem ?? "Não foi possível remover.");
                    })
                  }
                >
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Preferencias preferencias={preferencias} />
    </div>
  );
}

function Preferencias({ preferencias: p }: { preferencias: PreferenciasNotificacao }) {
  const [estado, acao, pendente] = useActionState(async (prev: Resultado, formData: FormData) => {
    const r = await salvarPreferencias(prev, formData);
    if (r.ok) toast.success("Preferências salvas");
    return r;
  }, {});

  return (
    <form action={acao} className="flex flex-col gap-4">
      <p className="text-[13px] font-medium">Quando avisar</p>
      <Interruptor name="tres_dias_antes" defaultChecked={p.tresDiasAntes} titulo="3 dias antes" descricao="Dá tempo de separar o dinheiro." />
      <Interruptor name="um_dia_antes" defaultChecked={p.umDiaAntes} titulo="Na véspera" />
      <Interruptor name="no_dia" defaultChecked={p.noDia} titulo="No dia do vencimento" />
      <Interruptor name="atrasadas" defaultChecked={p.atrasadas} titulo="Contas atrasadas" descricao="Um lembrete por dia, por até 3 dias." />
      <div className="border-t pt-4">
        <Interruptor
          name="mostrar_detalhes"
          defaultChecked={p.mostrarDetalhes}
          titulo="Mostrar nome e valor"
          descricao="Desligado, a notificação diz só quantas contas há, sem expor nada na tela bloqueada."
        />
      </div>
      {estado.mensagem && <p className="text-sm text-critico">{estado.mensagem}</p>}
      <Button size="sm" disabled={pendente} className="h-9 w-fit rounded-md px-4">
        {pendente ? "Salvando…" : "Salvar preferências"}
      </Button>
    </form>
  );
}
