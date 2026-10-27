"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { RotateCw } from "lucide-react";

/**
 * Tela de falha inesperada, usada pelos error.tsx. Em produção o Next esconde a mensagem
 * original (pode conter dado sensível) e manda só o "digest", que mostramos como código
 * para cruzar com os logs do servidor.
 */
export function TelaErro({ error, retry, compacta }: { error: unknown; retry: () => void; compacta?: boolean }) {
  const [tentando, iniciar] = useTransition();
  const codigo = error instanceof Error && "digest" in error ? String(error.digest) : null;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={compacta ? "flex flex-col items-start gap-4 py-10" : "flex flex-col items-start gap-4"}>
      <p className="rotulo">Erro</p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Algo deu errado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta tela. Pode ser uma instabilidade momentânea: tente de novo. Seus dados continuam salvos.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={tentando}
          onClick={() => iniciar(() => retry())}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <RotateCw className={tentando ? "size-4 animate-spin" : "size-4"} />
          Tentar de novo
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-md border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Ir para o Início
        </Link>
      </div>
      {codigo && (
        <p className="text-xs text-muted-foreground">
          Se continuar, informe o código <span className="dinheiro text-foreground">{codigo}</span>.
        </p>
      )}
    </div>
  );
}
