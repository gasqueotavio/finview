import { Suspense } from "react";
import { BotaoGoogle, Divisor } from "../botao-google";
import { LoginForm } from "./form";

export const metadata = { title: "Entrar · FinView" };

const ERROS: Record<string, string> = {
  google: "Não foi possível entrar com o Google. Tente novamente.",
  confirmacao: "O link de confirmação é inválido ou expirou. Tente entrar ou cadastre-se de novo.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <Suspense>
        <AvisoDeErro searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Entrar no FinView</h1>
      <p className="mb-8 text-sm text-muted-foreground">Entre para ver suas contas do mês.</p>
      <BotaoGoogle />
      <Divisor />
      <LoginForm />
    </>
  );
}

async function AvisoDeErro({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? ERROS[erro] : undefined;
  if (!mensagem) return null;
  return (
    <p role="alert" className="mb-6 rounded-xl bg-critico-suave p-3 text-sm text-critico">
      {mensagem}
    </p>
  );
}
