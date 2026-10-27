// Service worker do FinView: só recebe notificações push e abre o app ao tocar nelas.
// (Sem cache offline: os dados financeiros sempre vêm do servidor.)

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let dados;
  try {
    dados = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icones/icone-192.png",
      badge: "/icones/badge-96.png",
      tag: dados.tag,
      // Nova notificação com a mesma tag substitui a anterior, mas ainda avisa.
      renotify: true,
      lang: "pt-BR",
      data: { url: dados.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url ?? "/dashboard", self.location.origin);
  // Só abre páginas do próprio app.
  if (destino.origin !== self.location.origin) return;

  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const janela of janelas) {
        if (new URL(janela.url).origin === destino.origin && "focus" in janela) {
          await janela.focus();
          return janela.navigate(destino.href);
        }
      }
      return self.clients.openWindow(destino.href);
    })(),
  );
});
