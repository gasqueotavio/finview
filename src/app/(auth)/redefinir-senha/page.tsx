import { FormNovaSenha } from "./form";

export const metadata = { title: "Criar nova senha · FinView" };

export default function RedefinirSenhaPage() {
  return (
    <>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-[-0.02em]">Criar nova senha</h1>
      <p className="mb-7 text-sm text-muted-foreground">
        Escolha uma senha nova. Por segurança, os outros aparelhos conectados à sua conta serão desconectados.
      </p>
      <FormNovaSenha />
    </>
  );
}
