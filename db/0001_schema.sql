-- =====================================================================
-- Lockcopy — 0001 esquema base
-- Copiar para o SQL Editor de um projeto Supabase próprio e executar.
-- Ordem: 0001 → 0006. Não é uma migração do Lovable Cloud.
-- =====================================================================

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.app_plan as enum ('teste', 'solo', 'agency');
create type public.org_role as enum ('owner', 'member');
create type public.request_status as enum ('draft', 'sent', 'in_progress', 'completed', 'archived');
create type public.field_type as enum ('text', 'textarea', 'image', 'file', 'select');
create type public.submission_status as enum ('pending', 'submitted', 'approved', 'rejected');
create type public.file_status as enum ('ready', 'rejected');
create type public.image_status as enum ('none', 'pending', 'processing', 'done', 'failed');
create type public.notification_status as enum ('queued', 'processing', 'sent', 'failed', 'cancelled');
create type public.notification_channel as enum ('email', 'sms', 'in_app');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type public.deletion_status as enum ('scheduled', 'running', 'done', 'failed');
create type public.actor_kind as enum ('agency', 'client', 'system');

-- ---------------------------------------------------------------------
-- Limites por plano (única fonte para o servidor)
-- ---------------------------------------------------------------------
create table public.plan_limits (
  plan public.app_plan primary key,
  requests_limit integer not null check (requests_limit > 0),
  users_limit integer not null check (users_limit > 0),
  storage_bytes bigint not null check (storage_bytes > 0),
  price_month_usd numeric(10, 2) not null,
  price_year_usd numeric(10, 2) not null,
  trial_days integer not null default 14 check (trial_days >= 0)
);

GRANT SELECT ON public.plan_limits TO anon, authenticated;
GRANT ALL ON public.plan_limits TO service_role;

-- ---------------------------------------------------------------------
-- Organizações (a agência)
-- ---------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  logo_url text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9a-fA-F]{6}$'),
  plan public.app_plan not null default 'teste',
  subscription_status public.subscription_status not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  grace_period_ends_at timestamptz,
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

-- ---------------------------------------------------------------------
-- Membros da agência (papéis fora da tabela de utilizadores)
-- ---------------------------------------------------------------------
create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null default 'member',
  notify_instant boolean not null default true,
  notify_daily_digest boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, user_id, role)
);

create index org_members_user_idx on public.org_members (user_id);
create index org_members_org_idx on public.org_members (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;

-- ---------------------------------------------------------------------
-- Modelos (catálogo público de partidas)
-- ---------------------------------------------------------------------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0
);

create table public.template_fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.template_sections (id) on delete cascade,
  label text not null,
  help_text text,
  field_type public.field_type not null default 'text',
  is_required boolean not null default false,
  char_limit integer check (char_limit is null or char_limit between 1 and 20000),
  allowed_mime text[],
  order_index integer not null default 0
);

GRANT SELECT ON public.templates, public.template_sections, public.template_fields TO anon, authenticated;
GRANT ALL ON public.templates, public.template_sections, public.template_fields TO service_role;

-- ---------------------------------------------------------------------
-- Pedidos de recolha
-- ---------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  client_name text not null check (char_length(client_name) between 1 and 160),
  client_email text not null check (client_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  client_phone text,
  status public.request_status not null default 'draft',
  token uuid not null unique default gen_random_uuid(),
  password_hash text,
  due_date date,
  expires_at timestamptz not null default (now() + interval '45 days'),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requests_org_idx on public.requests (org_id);
create index requests_token_idx on public.requests (token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;

-- ---------------------------------------------------------------------
-- Secções e campos do pedido
-- ---------------------------------------------------------------------
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0
);

create table public.fields (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  label text not null,
  help_text text,
  field_type public.field_type not null default 'text',
  is_required boolean not null default false,
  char_limit integer check (char_limit is null or char_limit between 1 and 20000),
  allowed_mime text[],
  order_index integer not null default 0
);

create index sections_request_idx on public.sections (request_id);
create index fields_section_idx on public.fields (section_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections, public.fields TO authenticated;
GRANT ALL ON public.sections, public.fields TO service_role;

-- ---------------------------------------------------------------------
-- Respostas do cliente (um texto por campo, estado e nota de ajuste)
-- ---------------------------------------------------------------------
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null unique references public.fields (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  value_text text not null default '',
  status public.submission_status not null default 'pending',
  rejection_note text,
  version integer not null default 1,
  updated_by public.actor_kind not null default 'client',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_request_idx on public.submissions (request_id);
create index submissions_org_idx on public.submissions (org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

-- ---------------------------------------------------------------------
-- Anexos (vários por resposta; original sempre preservado)
-- ---------------------------------------------------------------------
create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  field_id uuid not null references public.fields (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 260),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status public.file_status not null default 'ready',
  image_status public.image_status not null default 'none',
  webp_storage_path text,
  image_error text,
  created_at timestamptz not null default now()
);

create index submission_files_request_idx on public.submission_files (request_id);
create index submission_files_field_idx on public.submission_files (field_id);
create index submission_files_image_idx on public.submission_files (image_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_files TO authenticated;
GRANT ALL ON public.submission_files TO service_role;

-- ---------------------------------------------------------------------
-- Histórico / auditoria do pedido
-- ---------------------------------------------------------------------
create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  org_id uuid not null references public.organizations (id) on delete cascade,
  actor public.actor_kind not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  kind text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index request_events_request_idx on public.request_events (request_id);

GRANT SELECT, INSERT ON public.request_events TO authenticated;
GRANT ALL ON public.request_events TO service_role;

-- ---------------------------------------------------------------------
-- Fila e registo de notificações
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  request_id uuid references public.requests (id) on delete set null,
  channel public.notification_channel not null default 'email',
  kind text,
  recipient text not null,
  subject text not null,
  body text not null default '',
  status public.notification_status not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_due_idx on public.notifications (status, scheduled_for);

GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- ---------------------------------------------------------------------
-- Eventos de subscrição (Stripe)
-- ---------------------------------------------------------------------
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations (id) on delete cascade,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;

-- ---------------------------------------------------------------------
-- Eliminação programada (RGPD: retenção anunciada e depois purga)
-- ---------------------------------------------------------------------
create table public.deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  request_id uuid references public.requests (id) on delete cascade,
  scheduled_for timestamptz not null,
  reason text not null default 'cancelamento',
  status public.deletion_status not null default 'scheduled',
  detail jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index deletion_jobs_due_idx on public.deletion_jobs (status, scheduled_for);

GRANT SELECT ON public.deletion_jobs TO authenticated;
GRANT ALL ON public.deletion_jobs TO service_role;

-- ---------------------------------------------------------------------
-- RLS ligada em tudo; políticas em 0003_rls.sql
-- ---------------------------------------------------------------------
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_jobs ENABLE ROW LEVEL SECURITY;

commit;
