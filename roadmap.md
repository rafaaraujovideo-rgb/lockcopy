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
- [x] Fluxo completo testado com sessão real (agência, pedido, portal, upload+WebP, aprovar, ajuste, link, exportações).
- [x] `db/0007_webp.sql` corrido e corrigido.
- [ ] Voltar a ligar "Confirm email" no Supabase.
- [ ] Configurar cron externo para POST /api/public/cron/notifications com `CRON_SECRET`.
- [ ] Chaves Stripe e Brevo nas variáveis de ambiente.

## Bloqueios
- Emails reais: precisa de `BREVO_API_KEY` (remetente verificado no Brevo).
- Cobrança real: precisa de `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO`, `STRIPE_PRICE_AGENCY`, `STRIPE_PRICE_SOLO_YEAR`, `STRIPE_PRICE_AGENCY_YEAR` e `APP_URL`.
