# Roadmap — Lockcopy

## Estado
- Camada visual completa e a funcionar (landing com demo, checkout, painel, portal, revisão, exportações).
- SQL do Supabase próprio escrito em `db/`, executado por ordem e validado com 41 verificações funcionais.
- Camada de ligação escrita: `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `src/lib/supabase-types.ts`, `.env.example`.
- Funções de servidor prontas em `src/lib/api.functions.ts`: sessão da agência, lista e detalhe de pedidos, criar pedido, aprovar/devolver campo, ligar/desligar link, lembrete, e portal (`portal_load` / `portal_save` / `portal_register_file`).
- Cobrança escrita em `src/lib/billing.functions.ts` + `src/routes/api/public/stripe-webhook.ts`: checkout com 14 dias de teste e estado aplicado só pelo webhook, com assinatura verificada e eventos registados.
- App ligada ao Supabase do utilizador: entrar/criar conta, conta da agência, pedidos, revisão, portal com autosave e uploads reais, ZIP real, CSV/JSON.
- Ecrã de início do teste abre o checkout do Stripe; faturação abre o portal do Stripe.

## Por fazer
- [ ] Testar o fluxo completo com uma conta real confirmada (falta conta de teste).
- [ ] Trabalhador de emails e lembretes (`claim_notifications` / `finish_notification`).
- [ ] Trabalhador de imagens WebP (`due_images` / `mark_image`), original preservado.
- [ ] Política de privacidade, termos e DPA antes de cobrar.
- [ ] Páginas SEO de comparação e modelos gratuitos para download.

## Bloqueios
- Conta de teste confirmada no Supabase para validar o fluxo com sessão.
- Cobrança real: precisa de `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_AGENCY`, `STRIPE_PRICE_SOLO_YEAR`, `STRIPE_PRICE_AGENCY_YEAR` e `APP_URL`.
