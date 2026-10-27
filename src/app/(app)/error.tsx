"use client";

import { TelaErro } from "@/components/app/tela-erro";

// Erros dentro do app: a barra lateral e a navegação continuam funcionando.
export default function ErroDoApp({ error, retry }: { error: unknown; retry: () => void }) {
  return <TelaErro error={error} retry={retry} compacta />;
}
