"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cadastrar, type EstadoForm } from "../actions";
import { Campo } from "../campo";

const estadoInicial: EstadoForm = {};

export function CadastroForm() {
  const [estado, acao, pendente] = useActionState(cadastrar, estadoInicial);

  if (estado.sucesso) {
    return (
      <div aria-live="polite" className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-sucesso-suave text-sucesso">
          <MailCheck className="size-6" />
        </span>
        <p className="font-semibold">Confira seu e-mail</p>
        <p className="text-sm text-muted-foreground">{estado.mensagem}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo nome="email" rotulo="E-mail" tipo="email" autoComplete="email" erros={estado.erros?.email} />
      <Campo nome="senha" rotulo="Senha" tipo="password" autoComplete="new-password" erros={estado.erros?.senha} />
      <Campo
        nome="confirmacao"
        rotulo="Confirme a senha"
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
      <Button size="lg" disabled={pendente} className="mt-1 h-12 rounded-xl text-[15px]">
        {pendente ? "Criando conta…" : "Criar conta"}
      </Button>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
