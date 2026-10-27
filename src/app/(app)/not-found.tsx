import { NaoEncontrado } from "@/components/app/nao-encontrado";

// notFound() dentro do app (ex.: compromisso que não existe): mantém a navegação.
export default function NaoEncontradoNoApp() {
  return <NaoEncontrado compacta />;
}
