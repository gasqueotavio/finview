import {
  Car,
  CreditCard,
  GraduationCap,
  HandHeart,
  HeartPulse,
  House,
  Landmark,
  PawPrint,
  PiggyBank,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  Tv,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONE_POR_CATEGORIA: Record<string, LucideIcon> = {
  moradia: House,
  contas_consumo: Zap,
  saude: HeartPulse,
  seguros: ShieldCheck,
  transporte: Car,
  educacao: GraduationCap,
  assinaturas: Tv,
  financeiro: CreditCard,
  impostos: Landmark,
  familia: Users,
  pets: PawPrint,
  cuidados: Sparkles,
  alimentacao: ShoppingCart,
  investimentos: PiggyBank,
  contribuicoes: HandHeart,
  outros: Tag,
};

export function iconeDaCategoria(chave: string | null | undefined): LucideIcon {
  return (chave && ICONE_POR_CATEGORIA[chave]) || Receipt;
}

/** Ícone da categoria num círculo tingido com a cor dela (a cor identifica; o ícone garante leitura sem cor). */
export function BolhaCategoria({
  chave,
  cor,
  tamanho = "md",
  className,
}: {
  chave: string | null | undefined;
  cor: string | null | undefined;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icone = (chave && ICONE_POR_CATEGORIA[chave]) || Receipt;
  const base = cor ?? "#94a3b8";
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        tamanho === "sm" && "size-8 [&_svg]:size-4",
        tamanho === "md" && "size-10 [&_svg]:size-[18px]",
        tamanho === "lg" && "size-12 [&_svg]:size-5",
        className,
      )}
      style={{ backgroundColor: `color-mix(in oklch, ${base} 16%, transparent)`, color: base }}
    >
      <Icone strokeWidth={2.2} />
    </span>
  );
}
