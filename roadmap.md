# Roadmap — Lockcopy

## Estado
- Camada visual completa e a funcionar (landing com demo, checkout, painel, portal, revisão, exportações).
- SQL do Supabase próprio escrito em `db/`, executado por ordem e validado com 41 verificações funcionais.
- Camada de ligação escrita: `src/integrations/supabase/client.ts`, `client.server.ts`, `src/lib/supabase-types.ts`, `.env.example`.

## Em curso
- [ ] Ligar a aplicação ao Supabase do utilizador (à espera do URL e da chave publicável no `.env`).

## Por fazer
- [ ] Sessão e criação de conta de agência (funções de servidor).
- [ ] Portal do cliente a ler/escrever por `portal_load` / `portal_save` e upload direto.
- [ ] Rota `api/public/stripe-webhook` a confirmar cartão e a iniciar o teste de 14 dias.
- [ ] Trabalhador de emails e lembretes (`claim_notifications` / `finish_notification`).
- [ ] Trabalhador de imagens WebP (`due_images` / `mark_image`), original preservado.
- [ ] ZIP real organizado por página.
- [ ] Política de privacidade, termos e DPA antes de cobrar.
- [ ] Páginas SEO de comparação e modelos gratuitos para download.

## Bloqueios
- Ligação ao Supabase: o utilizador vai colar o URL do projeto e a chave publicável (`sb_publishable_...`).
- Cobrança real: precisa de chave Stripe.
