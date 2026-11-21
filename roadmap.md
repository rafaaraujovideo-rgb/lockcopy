# Roadmap — Lockcopy

## Estado
- Camada visual completa e a funcionar (landing com demo, checkout, painel, portal, revisão, exportações).
- SQL do Supabase próprio escrito em `db/`, executado por ordem e validado com 41 verificações funcionais.
- Camada de ligação escrita: `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `src/lib/supabase-types.ts`, `.env.example`.
- Funções de servidor prontas em `src/lib/api.functions.ts`: sessão da agência, lista e detalhe de pedidos, criar pedido, aprovar/devolver campo, ligar/desligar link, lembrete, e portal (`portal_load` / `portal_save` / `portal_register_file`).
- Cobrança escrita em `src/lib/billing.functions.ts` + `src/routes/api/public/stripe-webhook.ts`: checkout com 14 dias de teste e estado aplicado só pelo webhook, com assinatura verificada e eventos registados.

## Em curso
- [ ] Ligar a aplicação ao Supabase do utilizador (à espera do URL e da chave publicável no `.env`).

## Por fazer
- [ ] Páginas do painel e do portal a chamar as funções de servidor em vez da loja de demonstração.
- [ ] Ecrã de preços a abrir o checkout do Stripe.
- [ ] Trabalhador de emails e lembretes (`claim_notifications` / `finish_notification`).
- [ ] Trabalhador de imagens WebP (`due_images` / `mark_image`), original preservado.
- [ ] ZIP real organizado por página.
- [ ] Política de privacidade, termos e DPA antes de cobrar.
- [ ] Páginas SEO de comparação e modelos gratuitos para download.

## Bloqueios
- Ligação ao Supabase: o utilizador vai colar o URL do projeto e a chave publicável (`sb_publishable_...`).
- Cobrança real: precisa de `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_AGENCY` e `APP_URL`.
- Bucket `client-uploads` (privado, 50 MB) criado no painel do Supabase.
