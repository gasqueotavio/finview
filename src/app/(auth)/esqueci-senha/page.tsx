import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { FormEsqueciSenha } from "./form";

export const metadata = { title: "Esqueci minha senha · FinView" };

export default function EsqueciSenhaPage({ searchParams }: PageProps<"/esqueci-senha">) {
  return (
    <>
      <Link
        href="/login"
        className="mb-8 inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para o login
      </Link>
      <Suspense>
        <AvisoLinkInvalido searchParams={searchParams} />
      </Suspense>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-[-0.02em]">Esqueci minha senha</h1>
      <p className="mb-7 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link para você criar uma nova senha.</p>
      <FormEsqueciSenha />
    </>
  );
}

async function AvisoLinkInvalido({ searchParams }: Pick<PageProps<"/esqueci-senha">, "searchParams">) {
  const { erro } = await searchParams;
  if (erro !== "link") return null;
  return (
    <p role="alert" className="mb-6 border-l-2 border-critico py-0.5 pl-3 text-sm text-critico">
      O link expirou, já foi usado ou foi aberto em outro navegador. Peça um novo abaixo.
    </p>
  );
}
