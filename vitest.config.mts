import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const caminho = (relativo: string) => fileURLToPath(new URL(relativo, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": caminho("./src"),
      // O pacote "server-only" lança erro fora do servidor do Next; nos testes ele não faz nada.
      "server-only": caminho("./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
