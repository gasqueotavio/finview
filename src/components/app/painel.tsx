"use client";

import { useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

const CONSULTA_DESKTOP = "(min-width: 768px)";

function useDesktop() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(CONSULTA_DESKTOP);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA_DESKTOP).matches,
    () => false,
  );
}

type Props = {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  children: React.ReactNode;
};

/** Gaveta que sobe de baixo no celular; diálogo centralizado no desktop. */
export function Painel({ aberto, aoMudar, titulo, descricao, children }: Props) {
  const desktop = useDesktop();

  if (desktop) {
    return (
      <Dialog open={aberto} onOpenChange={aoMudar}>
        <DialogContent className="gap-0 rounded-2xl p-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-2 text-left">
            <DialogTitle>{titulo}</DialogTitle>
            {descricao ? <DialogDescription>{descricao}</DialogDescription> : null}
          </DialogHeader>
          <div className="px-6 pb-6">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={aberto} onOpenChange={aoMudar}>
      <DrawerContent className="rounded-t-3xl">
        <DrawerHeader className="px-5 text-left">
          <DrawerTitle>{titulo}</DrawerTitle>
          {descricao ? <DrawerDescription>{descricao}</DrawerDescription> : null}
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
