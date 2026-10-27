import { AvisoTermos, BotaoGoogle, Divisor } from "../botao-google";
import { CadastroForm } from "./form";

export const metadata = { title: "Criar conta · FinView" };

export default function CadastroPage() {
  return (
    <>
      <h1 className="mb-1.5 text-2xl font-semibold tracking-[-0.02em]">Crie sua conta</h1>
      <p className="mb-7 text-sm text-muted-foreground">Leva menos de um minuto. É grátis.</p>
      <BotaoGoogle />
      <Divisor />
      <CadastroForm />
      <AvisoTermos />
    </>
  );
}
