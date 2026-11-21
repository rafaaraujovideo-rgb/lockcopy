-- =====================================================================
-- Lockcopy — 0006 dados de arranque
-- Limites de plano e os 4 modelos do catálogo, com ids fixos.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Limites por plano
-- ---------------------------------------------------------------------
insert into public.plan_limits
  (plan, requests_limit, users_limit, storage_bytes, price_month_usd, price_year_usd, trial_days)
values
  ('teste',  1,  1, 524288000,   0.00,   0.00, 14),
  ('solo',   15, 1, 5368709120, 19.00, 190.00, 14),
  ('agency', 50, 3, 21474836480, 39.00, 390.00, 14)
on conflict (plan) do update
set requests_limit = excluded.requests_limit,
    users_limit = excluded.users_limit,
    storage_bytes = excluded.storage_bytes,
    price_month_usd = excluded.price_month_usd,
    price_year_usd = excluded.price_year_usd,
    trial_days = excluded.trial_days;

-- ---------------------------------------------------------------------
-- Modelo 1 — Site institucional
-- ---------------------------------------------------------------------
insert into public.templates (id, slug, name, description) values
  ('00000000-0000-4000-8000-000000000001', 'institucional', 'Site institucional',
   'Início, sobre, serviços e contactos.'),
  ('00000000-0000-4000-8000-000000000002', 'landing', 'Landing page',
   'Uma página de campanha com oferta e prova.'),
  ('00000000-0000-4000-8000-000000000003', 'ecommerce', 'E-commerce',
   'Catálogo, fotos de produto e políticas.'),
  ('00000000-0000-4000-8000-000000000004', 'rebranding', 'Rebranding / assets',
   'Logótipos, cores, letras e imagens da marca.')
on conflict (id) do update
set slug = excluded.slug, name = excluded.name, description = excluded.description;

insert into public.template_sections (id, template_id, title, description, order_index) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Início',    'A primeira coisa que se vê.', 1),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Sobre',     'Quem são e como trabalham.', 2),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Serviços',  'O que oferecem.', 3),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Contactos', 'Como se fala convosco.', 4),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000002', 'Oferta',    'A promessa da campanha.', 1),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000002', 'Prova',     'Testemunhos e confiança.', 2),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000003', 'Catálogo',  'Produtos e fotos.', 1),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000003', 'Políticas', 'Envios, devoluções, prazos.', 2),
  ('00000000-0000-4000-8000-000000000109', '00000000-0000-4000-8000-000000000004', 'Marca',     'Tudo o que define a marca.', 1)
on conflict (id) do update
set template_id = excluded.template_id, title = excluded.title,
    description = excluded.description, order_index = excluded.order_index;

insert into public.template_fields
  (id, section_id, label, help_text, field_type, is_required, char_limit, allowed_mime, order_index) values
  -- Institucional
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101',
   'Frase principal', 'Uma linha sobre o que fazem.', 'text', true, 160, null, 1),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101',
   'Fotografia de capa', 'A foto maior do topo da página.', 'image', true, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000102',
   'A vossa história', 'De dois a quatro parágrafos.', 'textarea', true, 4000, null, 1),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000102',
   'Fotos da equipa', 'Retrato ou grupo, o que tiverem.', 'image', false, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000103',
   'Lista de serviços', 'Um serviço por linha.', 'textarea', true, 2000, null, 1),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000104',
   'Morada, telefone e email', 'Como é que vos encontram.', 'textarea', true, 1000, null, 1),
  ('00000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000104',
   'Logótipo', 'SVG ou PNG em fundo transparente.', 'file', true, null,
   array['image/svg+xml','image/png','application/pdf'], 2),
  -- Landing
  ('00000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000105',
   'Título', 'A frase que se lê primeiro.', 'text', true, 120, null, 1),
  ('00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000105',
   'Descrição da oferta', 'O que a pessoa ganha ao agir.', 'textarea', true, 3000, null, 2),
  ('00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000106',
   'Testemunhos', 'Frases curtas de clientes reais.', 'textarea', false, 3000, null, 1),
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000106',
   'Logótipos de clientes', 'Para mostrar ao lado da oferta.', 'image', false, null,
   array['image/jpeg','image/png','image/webp','image/svg+xml'], 2),
  -- E-commerce
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000107',
   'Produtos (nome, preço, descrição)', 'Um produto por bloco.', 'textarea', true, 8000, null, 1),
  ('00000000-0000-4000-8000-000000000213', '00000000-0000-4000-8000-000000000107',
   'Fotos de produto', 'Fundo limpo, se possível.', 'image', true, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000214', '00000000-0000-4000-8000-000000000108',
   'Envios e devoluções', 'Prazos, custos e condições.', 'textarea', false, 4000, null, 1),
  -- Rebranding
  ('00000000-0000-4000-8000-000000000215', '00000000-0000-4000-8000-000000000109',
   'Logótipos atuais', 'Todos os formatos que existirem.', 'file', true, null,
   array['image/svg+xml','image/png','image/jpeg','application/pdf'], 1),
  ('00000000-0000-4000-8000-000000000216', '00000000-0000-4000-8000-000000000109',
   'Cores e letras', 'Códigos de cor e nomes das fontes.', 'text', false, 500, null, 2),
  ('00000000-0000-4000-8000-000000000217', '00000000-0000-4000-8000-000000000109',
   'Referências que gostam', 'Capturas ou links de exemplos.', 'image', false, null,
   array['image/jpeg','image/png','image/webp'], 3)
on conflict (id) do update
set section_id = excluded.section_id, label = excluded.label,
    help_text = excluded.help_text, field_type = excluded.field_type,
    is_required = excluded.is_required, char_limit = excluded.char_limit,
    allowed_mime = excluded.allowed_mime, order_index = excluded.order_index;

commit;
