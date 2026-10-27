"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pedirNovaSenha, type EstadoForm } from "../actions";
import { Campo } from "../campo";

const estadoInicial: EstadoForm = {};

export function FormEsqueciSenha() {
  const [estado, acao, pendente] = useActionState(pedirNovaSenha, estadoInicial);

  if (estado.sucesso) {
    return (
      <div aria-live="polite" className="flex flex-col gap-2 border-y py-6">
        <p className="flex items-center gap-2 font-semibold">
          <MailCheck className="size-4 text-sucesso" />
          Confira seu e-mail
        </p>
        <p className="text-sm text-muted-foreground">{estado.mensagem}</p>
        <p className="text-xs text-muted-foreground">Não chegou? Veja a caixa de spam. O link vale por 1 hora.</p>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo nome="email" rotulo="E-mail" tipo="email" autoComplete="email" erros={estado.erros?.email} />
      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}
      <Button size="lg" disabled={pendente} className="mt-1 h-10 rounded-md text-sm">
        {pendente ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
