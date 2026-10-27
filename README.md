# FinView

Controle financeiro pessoal para quem quer pagar todas as contas do mês em dia. O FinView reúne gastos avulsos, contas recorrentes, parcelamentos, financiamentos e impostos anuais (IPVA, IPTU), avisa quando algo está para vencer e mostra quanto ainda falta pagar.

Desenvolvido por Otávio Gasque.

## Funcionalidades

- **Início:** quanto falta pagar no mês, vencimentos agrupados por dia, pagamento em um toque (com "Desfazer") e gastos por categoria.
- **Compromissos:** contas fixas, assinaturas, parcelamentos, financiamentos e consórcios, geradas automaticamente mês a mês. Dá para editar, quitar antecipadamente, cancelar (mantendo o histórico) ou excluir.
- **Contas anuais:** IPVA e IPTU com planejamento por ano (cota única ou parcelado) e uma comparação de qual opção compensa.
- **Valor variável:** contas como luz e água nascem como estimativa e são confirmadas quando o valor real chega.
- **Catálogo:** checklist de ~90 contas comuns no Brasil, para nenhuma ficar de fora.
- **Lembretes:** notificações push (computador, Android e iPhone com o app instalado) 3 dias antes, na véspera, no dia e para contas atrasadas.
- **Agenda:** link `.ics` secreto para assinar os vencimentos no Google Agenda, Apple Calendar ou Outlook.
- **Conta:** login por e-mail e senha ou Google, recuperação de senha, exportação de todos os dados (JSON) e exclusão da conta.

## Tecnologias

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack) e React 19
- [Supabase](https://supabase.com): Postgres, autenticação e `pg_cron`
- Tailwind CSS 4, componentes [shadcn/ui](https://ui.shadcn.com) e IBM Plex Sans/Mono
- Zod para validação, `web-push` para notificações
- Hospedagem na [Vercel](https://vercel.com) (funções em `pdx1`, perto do banco em `us-west-2`)

## Segurança e privacidade

- **Criptografia na aplicação:** descrições, observações e nomes de categorias são cifrados com AES-256-GCM antes de chegar ao banco, com uma chave derivada para cada usuário (HKDF a partir de `FINVIEW_ENCRYPTION_KEY`). Valores e datas ficam em claro para os totais serem calculados no banco.
- **Row Level Security** em todas as tabelas: cada usuário só enxerga os próprios dados, inclusive dentro das funções SQL.
- **Senhas fortes** obrigatórias, cabeçalhos de segurança (HSTS, `X-Frame-Options`, `nosniff`) e sessões renovadas pelo `proxy.ts`.
- **LGPD:** [Política de Privacidade](src/app/(legal)/privacidade/page.tsx) e [Termos de Uso](src/app/(legal)/termos/page.tsx) públicos, portabilidade (exportar dados) e eliminação (excluir conta) dentro do app.

> **Importante:** guarde a `FINVIEW_ENCRYPTION_KEY` num gerenciador de senhas. Sem ela, os textos cifrados ficam ilegíveis para sempre.

## Rodando localmente

Pré-requisitos: Node.js 20+ e um projeto no Supabase.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha. Cada variável está explicada no próprio arquivo:

   | Variável | Para quê |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Conexão com o Supabase |
   | `NEXT_PUBLIC_SITE_URL` | Endereço do site (links de e-mail e da agenda) |
   | `FINVIEW_ENCRYPTION_KEY` | Chave mestra da criptografia (32 bytes em base64) |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Notificações push (`npx web-push generate-vapid-keys`) |
   | `CRON_SECRET` | Protege a rota do envio diário de lembretes |
   | `SUPABASE_SECRET_KEY` | Chave secreta do Supabase, usada só pelo envio diário (nunca com `NEXT_PUBLIC_`) |

3. Aplique as migrations no banco e gere os tipos:

   ```bash
   npx supabase link --project-ref <id-do-projeto>
   npx supabase db push --linked
   npm run db:types
   ```

4. Rode o servidor de desenvolvimento e abra [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

Para disparar os lembretes sem esperar o horário agendado:

```powershell
$s = (Select-String .env.local -Pattern '^CRON_SECRET=(.*)').Matches[0].Groups[1].Value
Invoke-RestMethod http://localhost:3000/api/cron/notificacoes -Headers @{ Authorization = "Bearer $s" }
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run db:types` | Regenera `src/types/database.ts` a partir do banco |

## Estrutura

```
src/
  app/
    (app)/          telas logadas: início, compromissos, lançamentos, minha conta
    (auth)/         login, cadastro, recuperação de senha
    (legal)/        política de privacidade e termos de uso
    agenda/         link .ics da agenda (autenticado pelo token)
    api/cron/       envio diário dos lembretes (chamado pelo cron da Vercel)
    auth/           retorno do login com Google e dos links de e-mail
  components/
    app/            componentes do FinView (navegação, campos, valores, painéis)
    ui/             componentes base do shadcn/ui
  lib/
    dados/          leitura do banco já decifrada (camada de acesso a dados)
    supabase/       clientes do Supabase (sessão, público e administrativo)
    validations/    esquemas Zod dos formulários
    crypto.ts       criptografia por usuário
  proxy.ts          renovação de sessão e proteção das rotas
supabase/
  migrations/       esquema do banco, funções, RLS e cron
public/
  sw.js             service worker das notificações
  icones/           ícones do app instalável
```

## Deploy

O projeto está pronto para a Vercel: importe o repositório, cadastre as variáveis do `.env.local` (com `NEXT_PUBLIC_SITE_URL` apontando para o endereço público) e atualize a Site URL e as Redirect URLs em **Supabase → Authentication → URL Configuration**. O [`vercel.json`](vercel.json) fixa a região das funções e agenda o envio dos lembretes todo dia às 8h (horário de Brasília).
