-- =====================================================================
-- Lockcopy — 0006 seed data
-- Plan limits and the 4 catalogue templates, with fixed ids.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Limits per plan
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
-- Template 1 — Business website
-- ---------------------------------------------------------------------
insert into public.templates (id, slug, name, description) values
  ('00000000-0000-4000-8000-000000000001', 'institucional', 'Business website',
   'Home, about, services and contact.'),
  ('00000000-0000-4000-8000-000000000002', 'landing', 'Landing page',
   'A campaign page with offer and proof.'),
  ('00000000-0000-4000-8000-000000000003', 'ecommerce', 'E-commerce',
   'Catalogue, product photos and policies.'),
  ('00000000-0000-4000-8000-000000000004', 'rebranding', 'Rebranding / assets',
   'Logos, colours, fonts and brand imagery.')
on conflict (id) do update
set slug = excluded.slug, name = excluded.name, description = excluded.description;

insert into public.template_sections (id, template_id, title, description, order_index) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Home',     'The first thing people see.', 1),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'About',    'Who you are and how you work.', 2),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Services', 'What you offer.', 3),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Contact',  'How people reach you.', 4),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000002', 'Offer',    'The campaign promise.', 1),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000002', 'Proof',    'Testimonials and trust.', 2),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000003', 'Catalogue','Products and photos.', 1),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000003', 'Policies', 'Shipping, returns, deadlines.', 2),
  ('00000000-0000-4000-8000-000000000109', '00000000-0000-4000-8000-000000000004', 'Brand',    'Everything that defines the brand.', 1)
on conflict (id) do update
set template_id = excluded.template_id, title = excluded.title,
    description = excluded.description, order_index = excluded.order_index;

insert into public.template_fields
  (id, section_id, label, help_text, field_type, is_required, char_limit, allowed_mime, order_index) values
  -- Business website
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000101',
   'Main headline', 'One line about what you do.', 'text', true, 160, null, 1),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000101',
   'Cover photo', 'The big photo at the top of the page.', 'image', true, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000102',
   'Your story', 'Two to four paragraphs.', 'textarea', true, 4000, null, 1),
  ('00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000102',
   'Team photos', 'Portrait or group, whatever you have.', 'image', false, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000103',
   'List of services', 'One service per line.', 'textarea', true, 2000, null, 1),
  ('00000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000104',
   'Address, phone and email', 'How people find you.', 'textarea', true, 1000, null, 1),
  ('00000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000104',
   'Logo', 'SVG or PNG on a transparent background.', 'file', true, null,
   array['image/svg+xml','image/png','application/pdf'], 2),
  -- Landing
  ('00000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000105',
   'Headline', 'The first sentence people read.', 'text', true, 120, null, 1),
  ('00000000-0000-4000-8000-000000000209', '00000000-0000-4000-8000-000000000105',
   'Offer description', 'What the person gains by acting.', 'textarea', true, 3000, null, 2),
  ('00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000106',
   'Testimonials', 'Short quotes from real clients.', 'textarea', false, 3000, null, 1),
  ('00000000-0000-4000-8000-000000000211', '00000000-0000-4000-8000-000000000106',
   'Client logos', 'To show next to the offer.', 'image', false, null,
   array['image/jpeg','image/png','image/webp','image/svg+xml'], 2),
  -- E-commerce
  ('00000000-0000-4000-8000-000000000212', '00000000-0000-4000-8000-000000000107',
   'Products (name, price, description)', 'One product per block.', 'textarea', true, 8000, null, 1),
  ('00000000-0000-4000-8000-000000000213', '00000000-0000-4000-8000-000000000107',
   'Product photos', 'Clean background, if possible.', 'image', true, null,
   array['image/jpeg','image/png','image/webp','image/heic'], 2),
  ('00000000-0000-4000-8000-000000000214', '00000000-0000-4000-8000-000000000108',
   'Shipping and returns', 'Deadlines, costs and conditions.', 'textarea', false, 4000, null, 1),
  -- Rebranding
  ('00000000-0000-4000-8000-000000000215', '00000000-0000-4000-8000-000000000109',
   'Current logos', 'Every format that exists.', 'file', true, null,
   array['image/svg+xml','image/png','image/jpeg','application/pdf'], 1),
  ('00000000-0000-4000-8000-000000000216', '00000000-0000-4000-8000-000000000109',
   'Colours and fonts', 'Colour codes and font names.', 'text', false, 500, null, 2),
  ('00000000-0000-4000-8000-000000000217', '00000000-0000-4000-8000-000000000109',
   'References you like', 'Screenshots or links to examples.', 'image', false, null,
   array['image/jpeg','image/png','image/webp'], 3)
on conflict (id) do update
set section_id = excluded.section_id, label = excluded.label,
    help_text = excluded.help_text, field_type = excluded.field_type,
    is_required = excluded.is_required, char_limit = excluded.char_limit,
    allowed_mime = excluded.allowed_mime, order_index = excluded.order_index;

commit;
