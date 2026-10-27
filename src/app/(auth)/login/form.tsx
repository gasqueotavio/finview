"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { entrar, type EstadoForm } from "../actions";
import { Campo } from "../campo";

const estadoInicial: EstadoForm = {};

export function LoginForm() {
  const [estado, acao, pendente] = useActionState(entrar, estadoInicial);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo nome="email" rotulo="E-mail" tipo="email" autoComplete="email" erros={estado.erros?.email} />
      <div className="flex flex-col gap-1.5">
        <Campo nome="senha" rotulo="Senha" tipo="password" autoComplete="current-password" erros={estado.erros?.senha} />
        <Link
          href="/esqueci-senha"
          className="w-fit self-end text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      {estado.mensagem && (
        <p aria-live="polite" className="text-sm text-critico">
          {estado.mensagem}
        </p>
      )}
      <Button size="lg" disabled={pendente} className="mt-1 h-10 rounded-md text-sm">
        {pendente ? "Entrando…" : "Entrar"}
      </Button>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-foreground underline underline-offset-4">
          Criar conta grátis
        </Link>
      </p>
    </form>
  );
}
