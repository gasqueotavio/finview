"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { definirNovaSenha, type EstadoForm } from "../actions";
import { Campo } from "../campo";

const estadoInicial: EstadoForm = {};

export function FormNovaSenha() {
  const [estado, acao, pendente] = useActionState(definirNovaSenha, estadoInicial);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo nome="senha" rotulo="Nova senha" tipo="password" autoComplete="new-password" erros={estado.erros?.senha} />
      <Campo
        nome="confirmacao"
        rotulo="Confirme a nova senha"
        tipo="password"
        autoComplete="new-password"
        erros={estado.erros?.confirmacao}
      />
      <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres, com maiúscula, minúscula, número e símbolo.</p>
      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}
      <Button size="lg" disabled={pendente} className="mt-1 h-10 rounded-md text-sm">
        {pendente ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
