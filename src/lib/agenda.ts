import { createHash, randomBytes } from "node:crypto";
import { formatarMoeda } from "@/lib/formato";

export type EventoConta = {
  id: string;
  descricao: string;
  valor: number;
  estimado: boolean;
  paga: boolean;
  vencimento: string; // AAAA-MM-DD
};

/** Token do link de agenda (256 bits) e o hash que fica no banco. */
export function novoTokenAgenda() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDoToken(token) };
}

export function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// ---------------------------------------------------------------------------
// iCalendar (RFC 5545)

// Texto: escapa \ ; , e quebras de linha.
const escapar = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const encoder = new TextEncoder();

// Linhas com mais de 75 bytes são "dobradas" (CRLF + espaço), sem partir caracteres acentuados.
function dobrar(linha: string) {
  const partes: string[] = [];
  let atual = "";
  let bytes = 0;
  for (const ch of linha) {
    const tamanho = encoder.encode(ch).length;
    const limite = partes.length === 0 ? 75 : 74; // a continuação já começa com 1 espaço
    if (bytes + tamanho > limite) {
      partes.push(atual);
      atual = "";
      bytes = 0;
    }
    atual += ch;
    bytes += tamanho;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

const dataIcs = (iso: string) => iso.replace(/-/g, "");

function diaSeguinte(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function carimboUtc(agora: Date) {
  return agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function gerarIcs(eventos: EventoConta[], opcoes: { siteUrl: string; agora?: Date }) {
  const carimbo = carimboUtc(opcoes.agora ?? new Date());
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FinView//Vencimentos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:FinView · Vencimentos",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "X-WR-CALDESC:Contas a pagar cadastradas no FinView",
    // Sugestão de atualização a cada 6h (cada aplicativo de agenda decide o intervalo real).
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  for (const e of eventos) {
    const valor = `${e.estimado && !e.paga ? "≈ " : ""}${formatarMoeda(e.valor)}`;
    const titulo = e.paga ? `✓ ${e.descricao} (paga)` : `${e.descricao} · ${valor}`;
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@finview`,
      `DTSTAMP:${carimbo}`,
      // Dia inteiro: não ocupa horário na agenda.
      `DTSTART;VALUE=DATE:${dataIcs(e.vencimento)}`,
      `DTEND;VALUE=DATE:${dataIcs(diaSeguinte(e.vencimento))}`,
      "TRANSP:TRANSPARENT",
      `SUMMARY:${escapar(titulo)}`,
      `DESCRIPTION:${escapar(`${e.paga ? "Paga" : e.estimado ? "Valor estimado" : "A pagar"}: ${valor}\nAbrir no FinView: ${opcoes.siteUrl}/dashboard?mes=${e.vencimento.slice(0, 7)}`)}`,
      `URL:${opcoes.siteUrl}/dashboard?mes=${e.vencimento.slice(0, 7)}`,
      "END:VEVENT",
    );
  }

  linhas.push("END:VCALENDAR");
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
