# SQL do Lockcopy para um Supabase próprio

Estes ficheiros são para um projeto Supabase criado e gerido por ti.
Não são migrações do Lovable Cloud: o Cloud continua desligado neste projeto.

## Como correr

**Recomendado:** no SQL Editor do projeto, criar uma query nova, colar TODO o
conteúdo de `ALL_IN_ONE.sql` e carregar em **Run**. É a junção exata dos seis
ficheiros, pela mesma ordem, cada um na sua transação.

Antes de colar: criar o bucket `client-uploads` (ver abaixo), porque as
políticas de storage apontam para ele.

No fim, a última query mostra um resumo — tabelas, políticas de RLS, políticas
de storage, planos e modelos ativos. Se os números aparecerem, a instalação
ficou completa.

O script pára à partida com uma mensagem clara se as tabelas já existirem,
para não correr duas vezes por engano.

Os seis ficheiros separados continuam disponíveis, se preferires correr um de
cada vez:

1. `0001_schema.sql` — tipos, tabelas, privilégios e RLS ligada
2. `0002_functions.sql` — limites de plano, quota, papéis, filas
3. `0003_rls.sql` — políticas de isolamento por organização
4. `0004_portal.sql` — funções do portal público e da agência
5. `0005_storage_policies.sql` — políticas do bucket de ficheiros
6. `0006_seed_templates.sql` — limites por plano e os 4 modelos

## Bucket de ficheiros (fora do SQL)

O Supabase não aceita criar buckets por SQL. Criar o bucket uma vez, no
dashboard (Storage → New bucket): nome `client-uploads`, **privado**, limite
de ficheiro 50 MB.

Se usares a CLI, o comando é `supabase storage buckets create client-uploads`
(confirma as opções de privacidade e de limite na tua versão da CLI).

- **Privado**, sempre. Os links de leitura são assinados e de curta duração.
- Limite de 50 MB por ficheiro, igual à validação do portal.
- Caminho obrigatório: `<org_id>/<token>/<field_id>/<nome-do-ficheiro>`.
  A função `portal_register_file` rejeita qualquer caminho fora dessa pasta.

## O que fica garantido no servidor

- **Isolamento:** um membro só lê pedidos, secções, respostas e anexos da
  própria organização. Não há políticas que deixem um utilizador ler a
  organização de outra pessoa.
- **Portal sem conta:** o papel `anon` não tem políticas nas tabelas. O
  cliente só passa por `portal_load`, `portal_save`, `portal_upload_prefix`
  e `portal_register_file`, todas com verificação de token.
- **Link controlado:** `revoked_at` e `expires_at` fecham o acesso;
  `set_request_link` revoga e reabre, sempre com registo no histórico.
- **Limites:** gatilhos bloqueiam novos pedidos ao atingir 1/15/50, novos
  membros ao atingir 1/3, e anexos que ultrapassem 500 MB/5 GB/20 GB.
  Os pedidos já abertos continuam a receber conteúdos.
- **Cobrança:** `start_trial` e `apply_subscription` só correm com a chave
  de serviço. O teste de 14 dias começa depois de o Stripe confirmar o
  cartão, nunca antes.
- **Tolerância:** `past_due` com `grace_period_ends_at` no futuro continua
  a deixar trabalhar; sem isso, criar pedidos falha.
- **Papéis:** o papel vive em `org_members`, nunca na tabela de
  utilizadores. Só o proprietário muda papéis e o último proprietário não
  pode ser removido.
- **Notificações:** fila em `notifications` com `attempts`, `last_error` e
  `scheduled_for`; `claim_notifications` usa `FOR UPDATE SKIP LOCKED` para
  dois trabalhadores não enviarem o mesmo email.
- **Imagens:** `image_status` marca `pending` só para JPEG/PNG/WebP; HEIC,
  SVG e PDF ficam `none` com o original preservado.
- **RGPD:** `deletion_jobs` guarda a purga programada com motivo e estado.

## Validação

Os seis ficheiros foram executados por ordem num Postgres 17 com papéis
`anon` / `authenticated` / `service_role` e um `auth.uid()` simulado, e
passaram 41 verificações funcionais: isolamento entre organizações, limite de
pedidos por plano, portal por token, aprovação que tranca o campo, ajuste que
devolve o campo ao cliente, lembrete em fila, caminhos de storage, quota do
plano, revogação que liberta vaga, último proprietário e membro que se tenta
promover.

## Chaves e variáveis

| Variável | Onde | Para quê |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | endereço do projeto |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | leituras e portal |
| `LOCKCOPY_DB_SECRET_KEY` | só servidor | webhooks, purga, imagens (aceita também `SUPABASE_SERVICE_ROLE_KEY`) |

A chave de serviço nunca vai para o browser nem para o repositório.

## Ainda por ligar

O SQL está validado, a camada de ligação existe (`src/integrations/supabase/`)
e as funções de servidor já estão escritas: sessão, pedidos, revisão, portal
(`src/lib/api.functions.ts`) e cobrança com webhook Stripe
(`src/lib/billing.functions.ts`, `src/routes/api/public/stripe-webhook.ts`).
Falta:

1. Correr o SQL no teu projeto e criar o bucket `client-uploads`.
2. Passar as páginas (`/app`, `/c/$token`, `/comecar`) da loja de demonstração
   para as funções de servidor, com a loja como plano B enquanto não houver
   sessão.
3. Preencher as chaves Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_AGENCY`) e apontar o webhook.
4. Trabalhador de emails a usar `claim_notifications` + `finish_notification`.
5. Trabalhador de imagens a usar `due_images` + `mark_image`.
6. Purga a usar `due_purges` + `finish_purge`.
7. Política de privacidade, termos e DPA antes de cobrar.
