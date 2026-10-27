/** Tipografia de documento: títulos numerados, parágrafos com respiro, listas com marcador. */
export function Documento({ titulo, vigencia, children }: { titulo: string; vigencia: string; children: React.ReactNode }) {
  return (
    <article
      className={[
        "text-[15px] leading-relaxed text-foreground/90",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-[-0.01em] [&_h2]:text-foreground",
        "[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
      ].join(" ")}
    >
      <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{titulo}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vigente desde {vigencia}</p>
      <div className="mt-8">{children}</div>
    </article>
  );
}
