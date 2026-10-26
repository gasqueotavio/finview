import { Campo as CampoBase, estiloInput } from "@/components/app/campos";
import { Input } from "@/components/ui/input";

type CampoProps = {
  nome: string;
  rotulo: string;
  tipo?: string;
  autoComplete?: string;
  erros?: string[];
};

export function Campo({ nome, rotulo, tipo = "text", autoComplete, erros }: CampoProps) {
  return (
    <CampoBase rotulo={rotulo} htmlFor={nome} erro={erros?.[0]}>
      <Input
        id={nome}
        name={nome}
        type={tipo}
        autoComplete={autoComplete}
        required
        aria-invalid={Boolean(erros?.length)}
        className={estiloInput}
      />
    </CampoBase>
  );
}
