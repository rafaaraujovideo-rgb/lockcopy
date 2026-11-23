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
- [x] Interface 100% em inglês (língua global); chat com o utilizador fica em português.
- [ ] Correr `db/0008_english.sql` no Supabase para passar modelos, emails e erros da base de dados para inglês.
- [x] Fluxo completo testado com sessão real (agência, pedido, portal, upload+WebP, aprovar, ajuste, link, exportações).
- [x] `db/0007_webp.sql` corrido e corrigido.
- [ ] Voltar a ligar "Confirm email" no Supabase.
- [x] Cron externo configurado: POST /api/public/cron/notifications com `CRON_SECRET` (cron-job.org, URL dev).
- [x] `BREVO_API_KEY` guardada no cofre de segredos.
- [x] Stripe configurado (modo real): planos Solo/Agency mensal e anual, webhook ligado à pré-visualização, chaves guardadas. Ao publicar, mudar o webhook e `APP_URL` para o domínio final.

## Bloqueios
- [x] Chave secreta do Supabase guardada; fila de emails envia pelo Brevo (teste enviado com sucesso). Remetente atual: o Gmail verificado no Brevo; trocar por um email do domínio quando houver.
- [ ] Primeiro checkout real no Stripe (modo real) — não testado por mim.
- [ ] Voltar a ligar 'Confirm email' no Supabase antes de publicar.

## Nível de mercado
- [x] Bloco 1 — Landing: antes/depois, ZIP de exemplo real, calculadora de poupança.
- [x] Bloco 2 — Entrar em ecrã dividido, onboarding em 3 passos (logótipo, pedido de exemplo, abrir portal).
- [x] Bloco 3 — (campos personalizados no pedido ficam para depois: precisam de SQL novo) Pedido editável, portal por páginas com progresso, upload múltiplo, copiar campo na revisão.
