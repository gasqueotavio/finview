"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { FileScan, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Painel } from "@/components/app/painel";
import { Button } from "@/components/ui/button";
import { aceitarLeituraIA, lerBoletoComIA } from "./ia-actions";
import type { SugestaoIA } from "./sugestao";

const ACEITOS = "application/pdf,image/jpeg,image/png,image/webp";
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
// Fotos acima disso são reduzidas no navegador: o envio fica rápido e cabe com folga no
// limite de 4,5 MB por requisição da Vercel. Boleto não precisa de mais que ~2000 px.
const REDUZIR_ACIMA = 1.5 * 1024 * 1024;
const LADO_MAXIMO = 2000;

async function reduzirFoto(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size <= REDUZIR_ACIMA) return arquivo;
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imagem.width * escala);
    canvas.height = Math.round(imagem.height * escala);
    canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "boleto.jpg", { type: "image/jpeg" }) : arquivo;
  } catch {
    return arquivo; // Formato que o navegador não decodifica: envia como está.
  }
}

export function LeitorBoleto({ consentiu, aoLer }: { consentiu: boolean; aoLer: (s: SugestaoIA) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [aceitou, setAceitou] = useState(consentiu);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [lendo, iniciar] = useTransition();

  function comecar() {
    if (aceitou) entrada.current?.click();
    else setAvisoAberto(true);
  }

  function aceitar() {
    iniciar(async () => {
      const r = await aceitarLeituraIA();
      if (!r.ok) {
        toast.error("Não foi possível registrar o aceite. Tente de novo.");
        return;
      }
      setAceitou(true);
      setAvisoAberto(false);
      entrada.current?.click();
    });
  }

  function ler(arquivo: File) {
    if (arquivo.size > TAMANHO_MAXIMO && !arquivo.type.startsWith("image/")) {
      toast.error("O arquivo passa de 5 MB. Envie uma foto ou um PDF menor.");
      return;
    }
    iniciar(async () => {
      const dados = new FormData();
      dados.set("arquivo", await reduzirFoto(arquivo));
      try {
        const r = await lerBoletoComIA(dados);
        if (!r.ok) {
          if (r.precisaConsentimento) {
            setAceitou(false);
            setAvisoAberto(true);
          }
          toast.error(r.mensagem);
          return;
        }
        aoLer(r.sugestao);
        toast.success("Boleto lido. Confira os campos destacados antes de salvar.", {
          description: `${r.restantes} ${r.restantes === 1 ? "leitura restante" : "leituras restantes"} hoje.`,
        });
      } catch {
        // Requisição barrada antes de chegar à action (ex.: arquivo grande demais para o servidor).
        toast.error("Não foi possível enviar o arquivo. Tente uma foto ou um PDF menor que 4 MB.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Tem o boleto ou a conta?</p>
          <p className="text-[13px] text-muted-foreground">Envie a foto ou o PDF e o formulário é preenchido para você conferir.</p>
        </div>
        <Button type="button" variant="outline" disabled={lendo} onClick={comecar} className="h-9 shrink-0 rounded-md px-3">
          {lendo ? <Loader2 className="animate-spin" /> : <FileScan />}
          {lendo ? "Lendo boleto…" : "Ler boleto com IA"}
        </Button>
        <input
          ref={entrada}
          type="file"
          accept={ACEITOS}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            e.target.value = ""; // permite escolher o mesmo arquivo de novo
            if (arquivo) ler(arquivo);
          }}
        />
      </div>

      <Painel aberto={avisoAberto} aoMudar={setAvisoAberto} titulo="Antes de ler com IA">
        <div className="flex flex-col gap-4 text-sm">
          <p>
            Para ler o boleto, o arquivo é enviado ao <strong className="font-semibold">Google Gemini</strong>, um serviço de IA do
            Google. O FinView não guarda o arquivo: só usa os dados lidos para preencher o formulário, e nada é salvo sem você
            confirmar.
          </p>
          <p className="text-muted-foreground">
            Como usamos o plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele, conforme os termos
            desse plano. Se o documento tiver algo que você não quer compartilhar, preencha à mão.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Detalhes na{" "}
            <Link href="/privacidade" className="font-medium text-foreground underline underline-offset-4">
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="lg" className="h-11 rounded-md text-sm" onClick={() => setAvisoAberto(false)}>
              Agora não
            </Button>
            <Button type="button" size="lg" disabled={lendo} className="h-11 rounded-md text-sm" onClick={aceitar}>
              Concordo e continuar
            </Button>
          </div>
        </div>
      </Painel>
    </>
  );
}
