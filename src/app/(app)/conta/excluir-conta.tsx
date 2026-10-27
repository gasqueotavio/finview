"use client";

import { useActionState, useState } from "react";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { excluirConta, type EstadoExclusao } from "./actions";

const estadoInicial: EstadoExclusao = {};

export function ExcluirConta() {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, pendente] = useActionState(excluirConta, estadoInicial);
  const [texto, setTexto] = useState("");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-fit rounded-md border-critico/40 text-critico hover:bg-critico-suave hover:text-critico"
        onClick={() => setAberto(true)}
      >
        Excluir minha conta
      </Button>

      <Painel aberto={aberto} aoMudar={setAberto} titulo="Excluir sua conta?">
        <form action={acao} className="flex flex-col gap-4">
          <p className="text-sm">
            Todos os seus gastos, compromissos, categorias e o histórico de pagamentos serão apagados na hora, e você será
            desconectado.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Quer guardar uma cópia antes? Feche esta janela e use <strong className="font-medium">Baixar meus dados</strong>.
          </p>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Para confirmar, digite EXCLUIR
            <Input
              name="confirmacao"
              autoComplete="off"
              autoCapitalize="characters"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="h-10 rounded-md bg-card text-base md:text-sm"
            />
          </label>
          {estado.mensagem && (
            <p aria-live="polite" className="text-sm text-critico">
              {estado.mensagem}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" size="lg" variant="outline" className="h-11 rounded-md text-sm" onClick={() => setAberto(false)}>
              Voltar
            </Button>
            <Button
              size="lg"
              variant="destructive"
              disabled={pendente || texto.trim().toUpperCase() !== "EXCLUIR"}
              className="h-11 rounded-md text-sm"
            >
              {pendente ? "Excluindo…" : "Excluir conta"}
            </Button>
          </div>
        </form>
      </Painel>
    </>
  );
}
