import { exportarMeusDados } from "@/lib/dados/exportacao";
import { hojeEmBrasilia } from "@/lib/formato";

// Baixa um arquivo JSON com todos os dados do usuário logado (getUsuario redireciona quem não tem sessão).
export async function GET() {
  const dados = await exportarMeusDados();

  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="finview-meus-dados-${hojeEmBrasilia()}.json"`,
      // Dado pessoal: nunca guardar em cache compartilhado.
      "Cache-Control": "private, no-store",
    },
  });
}
