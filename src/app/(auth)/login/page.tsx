import { Suspense } from "react";
import { AvisoTermos, BotaoGoogle, Divisor } from "../botao-google";
import { LoginForm } from "./form";

export const metadata = { title: "Entrar · FinView" };

const ERROS: Record<string, React.ReactNode> = {
  google: (
    <>
      <strong className="font-semibold">Não foi possível entrar com o Google.</strong> Atualize a página (
      <kbd className="dinheiro rounded-[4px] border border-critico/30 px-1 text-xs">Ctrl</kbd> +{" "}
      <kbd className="dinheiro rounded-[4px] border border-critico/30 px-1 text-xs">R</kbd>) e tente de novo. Se o problema
      continuar, fale com <strong className="font-semibold">Otávio Gasque</strong>.
    </>
  ),
  confirmacao: "O link de confirmação é inválido ou expirou. Tente entrar ou cadastre-se de novo.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <Suspense>
        <AvisoDeErro searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-[-0.02em]">Entrar no FinView</h1>
      <p className="mb-7 text-sm text-muted-foreground">Entre para ver suas contas do mês.</p>
      <BotaoGoogle />
      <Divisor />
      <LoginForm />
      <AvisoTermos />
    </>
  );
}

async function AvisoDeErro({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { erro, conta } = await searchParams;
  if (conta === "excluida") {
    return (
      <p role="status" className="mb-6 border-l-2 border-sucesso py-0.5 pl-3 text-sm text-sucesso">
        Sua conta e todos os seus dados foram excluídos.
      </p>
    );
  }
  const mensagem = typeof erro === "string" ? ERROS[erro] : undefined;
  if (!mensagem) return null;
  return (
    <p role="alert" className="mb-6 border-l-2 border-critico py-0.5 pl-3 text-sm leading-relaxed text-critico">
      {mensagem}
    </p>
  );
}
