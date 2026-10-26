import { z } from "zod";

// Mesmas regras configuradas no Supabase Auth (supabase/config.toml e dashboard).
export const senhaSchema = z
  .string()
  .min(10, "A senha deve ter pelo menos 10 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")
  .regex(/[a-z]/, "Inclua ao menos uma letra minúscula")
  .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula")
  .regex(/[0-9]/, "Inclua ao menos um número")
  .regex(/[^A-Za-z0-9]/, "Inclua ao menos um símbolo");

export const loginSchema = z.object({
  email: z.email("E-mail inválido").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha"),
});

export const cadastroSchema = z
  .object({
    email: z.email("E-mail inválido").trim().toLowerCase(),
    senha: senhaSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });
