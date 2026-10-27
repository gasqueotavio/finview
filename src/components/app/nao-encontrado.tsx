import Link from "next/link";

export function NaoEncontrado({ compacta }: { compacta?: boolean }) {
  return (
    <div className={compacta ? "flex flex-col items-start gap-4 py-10" : "flex flex-col items-start gap-4"}>
      <p className="rotulo">Erro 404</p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">Página não encontrada</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        O endereço pode estar errado, ou o item foi excluído ou pertence a outra conta.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Ir para o Início
      </Link>
    </div>
  );
}
