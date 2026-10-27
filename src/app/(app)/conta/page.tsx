import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, Download, LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { GrupoFormulario } from "@/components/app/campos";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsuario } from "@/lib/auth";
import { ExcluirConta } from "./excluir-conta";

export const metadata = { title: "Minha conta · FinView" };

const botaoSecundario =
  "inline-flex h-9 w-fit items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted";

export default function ContaPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Minha conta</h1>

      <div className="flex flex-col">
        <GrupoFormulario titulo="Acesso">
          <Suspense fallback={<Skeleton className="h-5 w-56 rounded-sm" />}>
            <Email />
          </Suspense>
          <div className="flex flex-wrap gap-2">
            <Link href="/esqueci-senha" className={botaoSecundario}>
              Trocar senha
            </Link>
            <form action={sair}>
              <button className={botaoSecundario}>
                <LogOut className="size-4" />
                Sair
              </button>
            </form>
          </div>
        </GrupoFormulario>

        <GrupoFormulario
          titulo="Seus dados"
          descricao="Um arquivo com tudo o que você cadastrou, já decifrado. É o seu direito de portabilidade pela LGPD."
        >
          {/* Link comum (não <Link>): é um download, não uma navegação */}
          <a href="/conta/exportar" download className={botaoSecundario}>
            <Download className="size-4" />
            Baixar meus dados (JSON)
          </a>
        </GrupoFormulario>

        <GrupoFormulario titulo="Privacidade" descricao="Como tratamos seus dados, de acordo com a LGPD.">
          <div className="flex flex-col gap-2 text-sm">
            <Link href="/privacidade" className="inline-flex w-fit items-center gap-1 font-medium underline-offset-4 hover:underline">
              Política de Privacidade
              <ArrowUpRight className="size-3.5" />
            </Link>
            <Link href="/termos" className="inline-flex w-fit items-center gap-1 font-medium underline-offset-4 hover:underline">
              Termos de Uso
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </GrupoFormulario>

        <GrupoFormulario
          titulo="Excluir conta"
          descricao="Apaga sua conta e todos os seus dados na hora. Não dá para desfazer."
        >
          <ExcluirConta />
        </GrupoFormulario>
      </div>
    </div>
  );
}

async function Email() {
  await connection();
  const usuario = await getUsuario();
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">Conectado como </span>
      <span className="font-medium">{usuario.email}</span>
    </p>
  );
}
