import type { MetadataRoute } from "next";

// Permite instalar o FinView na tela de início (no iPhone, condição para receber notificações).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinView",
    short_name: "FinView",
    description: "Suas contas do mês em dia",
    lang: "pt-BR",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#f7f7f4",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
