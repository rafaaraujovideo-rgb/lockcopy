-- =====================================================================
-- Lockcopy — instalação completa (0001 → 0006 num só ficheiro)
-- Copiar TODO este ficheiro para o SQL Editor de um projeto Supabase
-- próprio e carregar em Run. Não é uma migração do Lovable Cloud.
--
-- Corre uma única vez. Se já estiver instalado, pára à partida com
-- uma mensagem clara em vez de rebentar a meio.
-- Pré-requisito: bucket privado `client-uploads` criado antes (db/README.md).
-- =====================================================================

do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename in ('organizations', 'requests', 'submission_files')
  ) then
    raise exception 'Lockcopy já está instalado nesta base de dados — não corras o script outra vez sem apagar as tabelas primeiro.';
  end if;
end $$;

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
-- =====================================================================
-- Lockcopy — 0002 funções de apoio, limites e regras de negócio
-- Limites de plano, quota, cobrança e filas são verificados no servidor.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Pertença sem recursão de RLS (SECURITY DEFINER)
-- ---------------------------------------------------------------------
create or replace function public.is_org_member(_org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = _org and user_id = auth.uid()
  );
$$;

create or replace function public.org_has_role(_org uuid, _role public.org_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = _org and user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.request_in_org(_request uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.requests r
    where r.id = _request and public.is_org_member(r.org_id)
  );
$$;

-- ---------------------------------------------------------------------
-- Limite do plano
-- ---------------------------------------------------------------------
create or replace function public.org_limit(_org uuid, _kind text)
returns bigint
language sql stable security definer
set search_path = public
as $$
  select coalesce(case _kind
    when 'requests' then l.requests_limit
    when 'users' then l.users_limit
    when 'storage' then l.storage_bytes
    else null
  end, 0)
  from public.organizations o
  join public.plan_limits l on l.plan = o.plan
  where o.id = _org;
$$;

-- ---------------------------------------------------------------------
-- A conta pode trabalhar? (teste, ativo, ou tolerância de 7 dias)
-- ---------------------------------------------------------------------
create or replace function public.org_can_work(_org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = _org
      and (
        o.subscription_status in ('trialing', 'active')
        or (o.subscription_status = 'past_due'
            and o.grace_period_ends_at is not null
            and o.grace_period_ends_at > now())
      )
  );
$$;

-- ---------------------------------------------------------------------
-- Limite de pedidos ativos (bloqueia criar; links abertos continuam)
-- ---------------------------------------------------------------------
create or replace function public.enforce_request_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  n bigint;
  lim bigint;
begin
  if not public.org_can_work(new.org_id) then
    raise exception 'conta_sem_plano — regularize a subscrição antes de criar novos pedidos.'
      using errcode = '42501';
  end if;

  select count(*) into n
  from public.requests
  where org_id = new.org_id
    and status <> 'archived'
    and revoked_at is null;

  lim := public.org_limit(new.org_id, 'requests');

  if n >= lim then
    raise exception 'limite_pedidos — atingiu o limite de % pedidos ativos. Os pedidos em curso continuam a receber conteúdos.', lim
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger requests_enforce_limit
before insert on public.requests
for each row execute function public.enforce_request_limit();

-- ---------------------------------------------------------------------
-- Quota de armazenamento
-- ---------------------------------------------------------------------
create or replace function public.enforce_storage_quota()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  used bigint;
  lim bigint;
begin
  select storage_used_bytes into used from public.organizations where id = new.org_id;
  lim := public.org_limit(new.org_id, 'storage');

  if used + new.size_bytes > lim then
    raise exception 'sem_espaco — sem espaço disponível no plano. Apague ficheiros ou faça upgrade.'
      using errcode = '42501';
  end if;

  update public.organizations
  set storage_used_bytes = storage_used_bytes + new.size_bytes, updated_at = now()
  where id = new.org_id;

  return new;
end;
$$;

create trigger submission_files_enforce_quota
before insert on public.submission_files
for each row execute function public.enforce_storage_quota();

create or replace function public.release_storage_quota()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.organizations
  set storage_used_bytes = greatest(0, storage_used_bytes - old.size_bytes), updated_at = now()
  where id = old.org_id;
  return old;
end;
$$;

create trigger submission_files_release_quota
after delete on public.submission_files
for each row execute function public.release_storage_quota();

-- ---------------------------------------------------------------------
-- Proteger o último proprietário
-- ---------------------------------------------------------------------
create or replace function public.protect_last_owner()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  n bigint;
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    select count(*) into n from public.org_members where org_id = old.org_id and role = 'owner';
    if n <= 1 then
      raise exception 'ultimo_proprietario — não pode remover o único proprietário da conta.'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    select count(*) into n from public.org_members where org_id = old.org_id and role = 'owner';
    if n <= 1 then
      raise exception 'ultimo_proprietario — a conta tem de manter pelo menos um proprietário.'
        using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger org_members_protect_owner
before delete or update on public.org_members
for each row execute function public.protect_last_owner();

-- ---------------------------------------------------------------------
-- Limite de membros do plano
-- ---------------------------------------------------------------------
create or replace function public.enforce_members_limit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  n bigint;
  lim bigint;
begin
  select count(distinct user_id) into n from public.org_members where org_id = new.org_id;
  lim := public.org_limit(new.org_id, 'users');
  if n >= lim then
    raise exception 'limite_membros — atingiu o limite de % utilizadores do plano.', lim
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger org_members_enforce_limit
before insert on public.org_members
for each row execute function public.enforce_members_limit();

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_touch before update on public.organizations
for each row execute function public.touch_updated_at();
create trigger requests_touch before update on public.requests
for each row execute function public.touch_updated_at();
create trigger submissions_touch before update on public.submissions
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Estado da subscrição (só service_role chama)
-- ---------------------------------------------------------------------
create or replace function public.apply_subscription(
  _org uuid,
  _sub_id text default null,
  _status public.subscription_status default null,
  _plan public.app_plan default null,
  _trial_ends timestamptz default null,
  _period_ends timestamptz default null,
  _grace_ends timestamptz default null,
  _customer_id text default null
)
returns void
language sql security definer
set search_path = public
as $$
  update public.organizations set
    stripe_subscription_id = coalesce(_sub_id, stripe_subscription_id),
    subscription_status = coalesce(_status, subscription_status),
    plan = coalesce(_plan, plan),
    trial_ends_at = coalesce(_trial_ends, trial_ends_at),
    current_period_ends_at = coalesce(_period_ends, current_period_ends_at),
    grace_period_ends_at = coalesce(_grace_ends, grace_period_ends_at),
    stripe_customer_id = coalesce(_customer_id, stripe_customer_id),
    updated_at = now()
  where id = _org;
$$;

revoke execute on function public.apply_subscription(uuid, text, public.subscription_status, public.app_plan, timestamptz, timestamptz, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.apply_subscription(uuid, text, public.subscription_status, public.app_plan, timestamptz, timestamptz, timestamptz, text)
  to service_role;

-- Início do teste: só depois de o Stripe confirmar o cartão.
create or replace function public.start_trial(_org uuid, _plan public.app_plan)
returns void
language sql security definer
set search_path = public
as $$
  update public.organizations set
    plan = _plan,
    subscription_status = 'trialing',
    trial_ends_at = now() + make_interval(days => (select trial_days from public.plan_limits where plan = _plan)),
    updated_at = now()
  where id = _org;
$$;

revoke execute on function public.start_trial(uuid, public.app_plan) from public, anon, authenticated;
grant execute on function public.start_trial(uuid, public.app_plan) to service_role;

-- ---------------------------------------------------------------------
-- Notificações: enfileirar, reivindicar, concluir
-- ---------------------------------------------------------------------
create or replace function public.enqueue_notification(
  _org uuid,
  _request uuid,
  _channel public.notification_channel,
  _recipient text,
  _subject text,
  _body text,
  _scheduled timestamptz default now(),
  _kind text default null
)
returns uuid
language sql security definer
set search_path = public
as $$
  insert into public.notifications (org_id, request_id, channel, kind, recipient, subject, body, scheduled_for)
  values (_org, _request, _channel, _kind, _recipient, _subject, _body, _scheduled)
  returning id;
$$;

grant execute on function public.enqueue_notification(uuid, uuid, public.notification_channel, text, text, text, timestamptz, text)
  to authenticated, service_role;

create or replace function public.claim_notifications(_batch integer default 10)
returns setof public.notifications
language plpgsql security definer
set search_path = public
as $$
declare
  r public.notifications;
begin
  for r in
    select * from public.notifications
    where status = 'queued' and scheduled_for <= now()
    order by scheduled_for
    limit _batch
    for update skip locked
  loop
    update public.notifications
    set status = 'processing', attempts = attempts + 1, last_error = null
    where id = r.id;
    r.status := 'processing';
    r.attempts := r.attempts + 1;
    return next r;
  end loop;
  return;
end;
$$;

revoke execute on function public.claim_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_notifications(integer) to service_role;

create or replace function public.finish_notification(_id uuid, _ok boolean, _err text default null)
returns void
language sql security definer
set search_path = public
as $$
  update public.notifications set
    status = case when _ok then 'sent'::public.notification_status else 'failed'::public.notification_status end,
    last_error = _err,
    sent_at = case when _ok then now() else sent_at end
  where id = _id;
$$;

revoke execute on function public.finish_notification(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finish_notification(uuid, boolean, text) to service_role;

-- ---------------------------------------------------------------------
-- Processamento de imagens (WebP, original preservado)
-- ---------------------------------------------------------------------
create or replace function public.due_images(_batch integer default 20)
returns setof public.submission_files
language sql stable security definer
set search_path = public
as $$
  select * from public.submission_files
  where image_status = 'pending'
  order by created_at
  limit _batch;
$$;

revoke execute on function public.due_images(integer) from public, anon, authenticated;
grant execute on function public.due_images(integer) to service_role;

create or replace function public.mark_image(
  _file uuid,
  _status public.image_status,
  _webp_path text default null,
  _err text default null
)
returns void
language sql security definer
set search_path = public
as $$
  update public.submission_files set
    image_status = _status,
    webp_storage_path = coalesce(_webp_path, webp_storage_path),
    image_error = _err
  where id = _file;
$$;

revoke execute on function public.mark_image(uuid, public.image_status, text, text) from public, anon, authenticated;
grant execute on function public.mark_image(uuid, public.image_status, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Eliminação programada
-- ---------------------------------------------------------------------
create or replace function public.schedule_purge(_org uuid, _when timestamptz, _reason text)
returns uuid
language sql security definer
set search_path = public
as $$
  insert into public.deletion_jobs (org_id, scheduled_for, reason)
  values (_org, _when, _reason)
  returning id;
$$;

revoke execute on function public.schedule_purge(uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function public.schedule_purge(uuid, timestamptz, text) to service_role;

create or replace function public.due_purges(_batch integer default 5)
returns setof public.deletion_jobs
language sql stable security definer
set search_path = public
as $$
  select * from public.deletion_jobs
  where status = 'scheduled' and scheduled_for <= now()
  order by scheduled_for
  limit _batch;
$$;

revoke execute on function public.due_purges(integer) from public, anon, authenticated;
grant execute on function public.due_purges(integer) to service_role;

create or replace function public.finish_purge(_id uuid, _ok boolean, _err text default null)
returns void
language sql security definer
set search_path = public
as $$
  update public.deletion_jobs set
    status = case when _ok then 'done'::public.deletion_status else 'failed'::public.deletion_status end,
    detail = detail || jsonb_build_object('error', _err),
    completed_at = case when _ok then now() else completed_at end
  where id = _id;
$$;

revoke execute on function public.finish_purge(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.finish_purge(uuid, boolean, text) to service_role;

-- ---------------------------------------------------------------------
-- Extratores de caminho de storage, tolerantes a lixo
-- ---------------------------------------------------------------------
create or replace function public.org_from_path(_path text)
returns uuid
language plpgsql immutable
as $$
begin
  return split_part(_path, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.token_from_path(_path text)
returns uuid
language plpgsql immutable
as $$
begin
  return split_part(_path, '/', 2)::uuid;
exception when others then
  return null;
end;
$$;

commit;
-- =====================================================================
-- Lockcopy — 0003 políticas de RLS (isolamento por organização)
-- O cliente final não tem políticas aqui: só passa pelas funções de 0004.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Catálogo público (limites e modelos)
-- ---------------------------------------------------------------------
create policy "limites visiveis"
on public.plan_limits for select to authenticated
using (auth.uid() is not null);

create policy "modelos ativos visiveis"
on public.templates for select to anon, authenticated
using (is_active);

create policy "seccoes de modelos ativos"
on public.template_sections for select to anon, authenticated
using (exists (select 1 from public.templates t where t.id = template_id and t.is_active));

create policy "campos de modelos ativos"
on public.template_fields for select to anon, authenticated
using (exists (
  select 1 from public.template_sections s
  join public.templates t on t.id = s.template_id
  where s.id = section_id and t.is_active
));

-- ---------------------------------------------------------------------
-- Organizações
-- ---------------------------------------------------------------------
create policy "membros leem a organizacao"
on public.organizations for select to authenticated
using (public.is_org_member(id));

-- Qualquer utilizador autenticado abre a sua própria agência;
-- um trigger torna-o proprietário (0004).
create policy "criar organizacao propria"
on public.organizations for insert to authenticated
with check (auth.uid() is not null and storage_used_bytes = 0);

create policy "proprietario altera a organizacao"
on public.organizations for update to authenticated
using (public.org_has_role(id, 'owner'))
with check (public.org_has_role(id, 'owner'));

-- Sem política de delete: apagar conta é trabalho do servidor.

-- ---------------------------------------------------------------------
-- Membros
-- ---------------------------------------------------------------------
create policy "membros veem o seu equipo"
on public.org_members for select to authenticated
using (public.is_org_member(org_id));

create policy "proprietario convida membros"
on public.org_members for insert to authenticated
with check (public.org_has_role(org_id, 'owner'));

create policy "membros editam preferencias, proprietario edita tudo"
on public.org_members for update to authenticated
using (public.org_has_role(org_id, 'owner') or user_id = auth.uid())
with check (public.org_has_role(org_id, 'owner') or user_id = auth.uid());

create policy "membro sai, proprietario remove"
on public.org_members for delete to authenticated
using (public.org_has_role(org_id, 'owner') or user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create policy "agencia le os seus pedidos"
on public.requests for select to authenticated
using (public.is_org_member(org_id));

create policy "agencia cria pedidos"
on public.requests for insert to authenticated
with check (public.is_org_member(org_id));

create policy "agencia altera os seus pedidos"
on public.requests for update to authenticated
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy "proprietario apaga pedidos"
on public.requests for delete to authenticated
using (public.org_has_role(org_id, 'owner'));

-- ---------------------------------------------------------------------
-- Secções e campos
-- ---------------------------------------------------------------------
create policy "le seccoes do pedido"
on public.sections for select to authenticated
using (public.request_in_org(request_id));

create policy "cria seccoes do pedido"
on public.sections for insert to authenticated
with check (public.request_in_org(request_id));

create policy "altera seccoes do pedido"
on public.sections for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "apaga seccoes do pedido"
on public.sections for delete to authenticated
using (public.request_in_org(request_id));

-- `fields` não tem request_id: sobe pela secção.
create policy "le campos do pedido"
on public.fields for select to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "cria campos do pedido"
on public.fields for insert to authenticated
with check (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "altera campos do pedido"
on public.fields for update to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
))
with check (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

create policy "apaga campos do pedido"
on public.fields for delete to authenticated
using (exists (
  select 1 from public.sections s
  where s.id = section_id and public.request_in_org(s.request_id)
));

-- ---------------------------------------------------------------------
-- Respostas
-- ---------------------------------------------------------------------
create policy "agencia le respostas"
on public.submissions for select to authenticated
using (public.request_in_org(request_id));

create policy "agencia corrige respostas"
on public.submissions for insert to authenticated
with check (public.request_in_org(request_id));

create policy "agencia altera respostas"
on public.submissions for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "agencia apaga respostas"
on public.submissions for delete to authenticated
using (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Anexos (leitura e remoção pela agência; entrada só pelo portal)
-- ---------------------------------------------------------------------
create policy "agencia le anexos"
on public.submission_files for select to authenticated
using (public.request_in_org(request_id));

create policy "agencia marca anexos"
on public.submission_files for update to authenticated
using (public.request_in_org(request_id))
with check (public.request_in_org(request_id));

create policy "agencia apaga anexos"
on public.submission_files for delete to authenticated
using (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Histórico
-- ---------------------------------------------------------------------
create policy "le historico do pedido"
on public.request_events for select to authenticated
using (public.request_in_org(request_id));

create policy "registra eventos do pedido"
on public.request_events for insert to authenticated
with check (public.request_in_org(request_id));

-- ---------------------------------------------------------------------
-- Notificações, subscrição e purga: leitura pela agência, escrita do servidor
-- ---------------------------------------------------------------------
create policy "agencia ve as suas notificacoes"
on public.notifications for select to authenticated
using (public.is_org_member(org_id));

create policy "agencia ve eventos de subscricao"
on public.subscription_events for select to authenticated
using (org_id is not null and public.is_org_member(org_id));

create policy "agencia ve a fila de purga"
on public.deletion_jobs for select to authenticated
using (public.is_org_member(org_id));

commit;
-- =====================================================================
-- Lockcopy — 0004 funções do portal público e operações da agência
-- O portal do cliente só fala com estas funções: as tabelas ficam
-- fechadas ao papel `anon` e o token é a única chave de acesso.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Fechar execução pública por omissão nas funções de apoio
-- ---------------------------------------------------------------------
revoke execute on function
  public.is_org_member(uuid),
  public.org_has_role(uuid, public.org_role),
  public.request_in_org(uuid),
  public.org_limit(uuid, text),
  public.org_can_work(uuid),
  public.org_from_path(text),
  public.token_from_path(text)
from public, anon, authenticated;

grant execute on function
  public.is_org_member(uuid),
  public.org_has_role(uuid, public.org_role),
  public.request_in_org(uuid)
to authenticated, service_role;

grant execute on function public.org_limit(uuid, text), public.org_can_work(uuid)
to service_role;

-- Os dois extratores de caminho são usados nas políticas de storage
-- por `anon` e `authenticated`, por isso precisam de execução pública.
grant execute on function public.org_from_path(text), public.token_from_path(text)
to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Torar-se proprietário da organização recém-criada
-- ---------------------------------------------------------------------
create or replace function public.become_owner_of_new_org()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.org_members (org_id, user_id, role)
  values (new.id, auth.uid(), 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger organizations_become_owner
after insert on public.organizations
for each row execute function public.become_owner_of_new_org();

-- ---------------------------------------------------------------------
-- Ninguém escala papéis sem ser proprietário
-- ---------------------------------------------------------------------
create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.org_has_role(new.org_id, 'owner') then
    raise exception 'sem_permissoes — só o proprietário altera papéis.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger org_members_guard_role
before update on public.org_members
for each row execute function public.guard_role_change();

-- ---------------------------------------------------------------------
-- Token: está ativo?
-- ---------------------------------------------------------------------
create or replace function public.portal_token_active(_token uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.requests r
    where r.token = _token
      and r.revoked_at is null
      and r.expires_at > now()
      and r.status <> 'archived'
  );
$$;

revoke execute on function public.portal_token_active(uuid) from public;
grant execute on function public.portal_token_active(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- O caminho de storage tem de pertencer ao org do próprio token
-- ---------------------------------------------------------------------
create or replace function public.path_matches_token(_path text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.requests r
    where r.token = public.token_from_path(_path)
      and r.revoked_at is null
      and r.expires_at > now()
      and r.status <> 'archived'
      and split_part(_path, '/', 1) = r.org_id::text
  );
$$;

revoke execute on function public.path_matches_token(text) from public;
grant execute on function public.path_matches_token(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Carregar o pedido completo para o portal
-- ---------------------------------------------------------------------
create or replace function public.portal_load(_token uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  r public.requests;
begin
  select * into r from public.requests where token = _token;

  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'link_invalido — este link já não está disponível.'
      using errcode = '42501';
  end if;

  return jsonb_build_object(
    'request', (
      select to_jsonb(x) from (
        select r.id, r.title, r.client_name, r.client_email, r.status,
               r.due_date, r.expires_at,
               o.name as agency_name, o.logo_url, o.brand_color
        from public.organizations o
        where o.id = r.org_id
      ) x
    ),
    'sections', (
      select coalesce(jsonb_agg(sec.section order by sec.oi), '[]'::jsonb)
      from (
        select s.order_index as oi,
               jsonb_build_object(
                 'id', s.id,
                 'title', s.title,
                 'description', s.description,
                 'order_index', s.order_index,
                 'fields', (
                   select coalesce(jsonb_agg(fld.fld order by fld.oi), '[]'::jsonb)
                   from (
                     select fl.order_index as oi,
                            jsonb_build_object(
                              'id', fl.id,
                              'label', fl.label,
                              'help_text', fl.help_text,
                              'field_type', fl.field_type,
                              'is_required', fl.is_required,
                              'char_limit', fl.char_limit,
                              'allowed_mime', fl.allowed_mime,
                              'order_index', fl.order_index
                            ) as fld
                     from public.fields fl
                     where fl.section_id = s.id
                   ) fld
                 )
               ) as section
        from public.sections s
        where s.request_id = r.id
      ) sec
    ),
    'submissions', (
      select coalesce(jsonb_agg(sub.s order by sub.oi), '[]'::jsonb)
      from (
        select fl.order_index as oi,
               jsonb_build_object(
                 'field_id', sb.field_id,
                 'value_text', sb.value_text,
                 'status', sb.status,
                 'rejection_note', sb.rejection_note,
                 'version', sb.version,
                 'updated_at', sb.updated_at,
                 'files', (
                   select coalesce(jsonb_agg(fil.f order by fil.ct), '[]'::jsonb)
                   from (
                     select ff.created_at as ct,
                            jsonb_build_object(
                              'id', ff.id,
                              'file_name', ff.file_name,
                              'size_bytes', ff.size_bytes,
                              'mime_type', ff.mime_type,
                              'image_status', ff.image_status,
                              'storage_path', ff.storage_path,
                              'webp_storage_path', ff.webp_storage_path
                            ) as f
                     from public.submission_files ff
                     where ff.field_id = sb.field_id and ff.status = 'ready'
                   ) fil
                 )
               ) as s
        from public.submissions sb
        join public.fields fl on fl.id = sb.field_id
        where sb.request_id = r.id
      ) sub
    )
  );
end;
$$;

revoke execute on function public.portal_load(uuid) from public;
grant execute on function public.portal_load(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Guardar texto do cliente (autosave)
-- ---------------------------------------------------------------------
create or replace function public.portal_save(_token uuid, _field uuid, _text text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  f public.fields;
  s public.submissions;
  clean text;
begin
  select * into r from public.requests where token = _token;

  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'link_invalido — este link já não está disponível.'
      using errcode = '42501';
  end if;

  select * into f from public.fields where id = _field;
  if not found or f.section_id not in (select id from public.sections where request_id = r.id) then
    raise exception 'campo_inexistente — campo não pertence a este pedido.'
      using errcode = '42501';
  end if;

  clean := left(coalesce(_text, ''), 20000);

  if f.char_limit is not null and char_length(clean) > f.char_limit then
    raise exception 'texto_longo — texto com % caracteres; o limite é %.', char_length(clean), f.char_limit
      using errcode = '22001';
  end if;

  if exists (select 1 from public.submissions where field_id = _field and status = 'approved') then
    raise exception 'campo_trancado — este campo já foi aprovado pela agência.'
      using errcode = '42501';
  end if;

  insert into public.submissions (field_id, request_id, org_id, value_text, status, updated_by)
  values (
    _field, r.id, r.org_id, clean,
    case when btrim(clean) = '' then 'pending'::public.submission_status
         else 'submitted'::public.submission_status end,
    'client'
  )
  on conflict (field_id) do update
  set value_text = excluded.value_text,
      status = case
        when submissions.status = 'approved' then submissions.status
        else excluded.status end,
      version = submissions.version + 1,
      updated_by = 'client',
      updated_at = now()
  returning * into s;

  insert into public.request_events (request_id, org_id, actor, kind, detail)
  values (r.id, r.org_id, 'client', 'text_saved',
          jsonb_build_object('field_id', _field, 'chars', char_length(clean)));

  return jsonb_build_object('status', s.status, 'version', s.version, 'saved_at', s.updated_at);
end;
$$;

revoke execute on function public.portal_save(uuid, uuid, text) from public;
grant execute on function public.portal_save(uuid, uuid, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Registar um ficheiro já enviado para o bucket
-- ---------------------------------------------------------------------
create or replace function public.portal_register_file(
  _token uuid,
  _field uuid,
  _path text,
  _name text,
  _mime text,
  _size bigint
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  f public.fields;
  ff public.submission_files;
  prefix text;
  max_bytes constant bigint := 50 * 1024 * 1024;
begin
  select * into r from public.requests where token = _token;

  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'link_invalido — este link já não está disponível.'
      using errcode = '42501';
  end if;

  select * into f from public.fields where id = _field;
  if not found or f.section_id not in (select id from public.sections where request_id = r.id) then
    raise exception 'campo_inexistente — campo não pertence a este pedido.'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.submissions where field_id = _field and status = 'approved') then
    raise exception 'campo_trancado — este campo já foi aprovado pela agência.'
      using errcode = '42501';
  end if;

  if _size is null or _size <= 0 or _size > max_bytes then
    raise exception 'ficheiro_invalido — ficheiro vazio ou acima de 50 MB.'
      using errcode = '22001';
  end if;

  if f.allowed_mime is not null and not (_mime = any (f.allowed_mime)) then
    raise exception 'tipo_negado — tipo de ficheiro não aceite neste campo.'
      using errcode = '42501';
  end if;

  prefix := r.org_id || '/' || r.token || '/' || f.id || '/';
  if _path is null or left(_path, char_length(prefix)) <> prefix then
    raise exception 'caminho_invalido — caminho de armazenamento não corresponde ao pedido.'
      using errcode = '42501';
  end if;

  insert into public.submission_files
    (org_id, request_id, field_id, file_name, storage_path, mime_type, size_bytes, status, image_status)
  values
    (r.org_id, r.id, f.id, left(_name, 260), _path, _mime, _size, 'ready',
     case when _mime in ('image/jpeg', 'image/png', 'image/webp')
          then 'pending'::public.image_status
          else 'none'::public.image_status end)
  returning * into ff;

  insert into public.submissions (field_id, request_id, org_id, value_text, status, updated_by)
  values (_field, r.id, r.org_id, '', 'submitted', 'client')
  on conflict (field_id) do update
  set status = case
        when submissions.status = 'approved' then submissions.status
        else 'submitted'::public.submission_status end,
      version = submissions.version + 1,
      updated_by = 'client',
      updated_at = now();

  insert into public.request_events (request_id, org_id, actor, kind, detail)
  values (r.id, r.org_id, 'client', 'file_added',
          jsonb_build_object('field_id', _field, 'file_id', ff.id, 'name', ff.file_name, 'bytes', ff.size_bytes));

  return jsonb_build_object('file_id', ff.id, 'image_status', ff.image_status);
end;
$$;

revoke execute on function public.portal_register_file(uuid, uuid, text, text, text, bigint) from public;
grant execute on function public.portal_register_file(uuid, uuid, text, text, text, bigint) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Prefixo de upload para o browser
-- ---------------------------------------------------------------------
create or replace function public.portal_upload_prefix(_token uuid, _field uuid)
returns text
language sql stable security definer
set search_path = public
as $$
  select r.org_id || '/' || r.token || '/' || f.id || '/'
  from public.requests r
  join public.sections s on s.request_id = r.id
  join public.fields f on f.section_id = s.id
  where r.token = _token and f.id = _field
    and r.revoked_at is null and r.expires_at > now() and r.status <> 'archived';
$$;

revoke execute on function public.portal_upload_prefix(uuid, uuid) from public;
grant execute on function public.portal_upload_prefix(uuid, uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Criar pedido a partir de um modelo
-- ---------------------------------------------------------------------
create or replace function public.create_request_from_template(
  _org uuid,
  _template uuid,
  _title text,
  _client_name text,
  _client_email text,
  _client_phone text default null,
  _due_date date default null,
  _expires_at timestamptz default now() + interval '45 days'
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  t public.templates;
  sec public.template_sections;
  fld public.template_fields;
  new_sec uuid;
begin
  if not public.org_has_role(_org, 'owner') and not public.is_org_member(_org) then
    raise exception 'sem_permissoes — sem acesso a esta conta.' using errcode = '42501';
  end if;

  select * into t from public.templates where id = _template and is_active;
  if not found then
    raise exception 'modelo_inexistente — modelo não encontrado.' using errcode = '42501';
  end if;

  insert into public.requests
    (org_id, title, client_name, client_email, client_phone, status, due_date, expires_at)
  values
    (_org, left(_title, 200), left(_client_name, 160), lower(btrim(_client_email)), _client_phone,
     'draft', _due_date, _expires_at)
  returning * into r;

  for sec in select * from public.template_sections where template_id = _template order by order_index loop
    insert into public.sections (request_id, title, description, order_index)
    values (r.id, sec.title, sec.description, sec.order_index)
    returning id into new_sec;

    for fld in select * from public.template_fields where section_id = sec.id order by order_index loop
      insert into public.fields
        (section_id, label, help_text, field_type, is_required, char_limit, allowed_mime, order_index)
      values
        (new_sec, fld.label, fld.help_text, fld.field_type, fld.is_required,
         fld.char_limit, fld.allowed_mime, fld.order_index);
    end loop;
  end loop;

  insert into public.request_events (request_id, org_id, actor, actor_user_id, kind, detail)
  values (r.id, _org, 'agency', auth.uid(), 'request_created',
          jsonb_build_object('template', t.slug, 'template_id', t.id));

  return jsonb_build_object('id', r.id, 'token', r.token, 'expires_at', r.expires_at);
end;
$$;

revoke execute on function public.create_request_from_template(uuid, uuid, text, text, text, text, date, timestamptz) from public;
grant execute on function public.create_request_from_template(uuid, uuid, text, text, text, text, date, timestamptz) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Rever campo: aprovar ou pedir ajuste (com notificação enfileirada)
-- ---------------------------------------------------------------------
create or replace function public.review_field(_field uuid, _decision text, _note text default null)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  s public.submissions;
  r public.requests;
  f public.fields;
  link text;
begin
  select * into s from public.submissions where field_id = _field;
  if not found then
    raise exception 'no_answer — there is no answer in this field yet.' using errcode = '42501';
  end if;

  if not public.request_in_org(s.request_id) then
    raise exception 'no_permission — no access to this request.' using errcode = '42501';
  end if;

  select * into r from public.requests where id = s.request_id;
  select * into f from public.fields where id = _field;

  if _decision = 'approve' then
    update public.submissions
    set status = 'approved', rejection_note = null, updated_by = 'agency', updated_at = now()
    where id = s.id
    returning * into s;

    insert into public.request_events (request_id, org_id, actor, actor_user_id, kind, detail)
    values (r.id, r.org_id, 'agency', auth.uid(), 'field_approved',
            jsonb_build_object('field_id', _field, 'label', f.label));
  elsif _decision = 'adjust' then
    if btrim(coalesce(_note, '')) = '' then
      raise exception 'note_required — explain what needs to be fixed.'
        using errcode = '22001';
    end if;

    update public.submissions
    set status = 'rejected', rejection_note = left(_note, 2000), updated_by = 'agency', updated_at = now()
    where id = s.id
    returning * into s;

    insert into public.request_events (request_id, org_id, actor, actor_user_id, kind, detail)
    values (r.id, r.org_id, 'agency', auth.uid(), 'field_adjust_requested',
            jsonb_build_object('field_id', _field, 'label', f.label, 'note', left(_note, 2000)));

    insert into public.notifications (org_id, request_id, channel, kind, recipient, subject, body)
    values (r.org_id, r.id, 'email', 'ajuste', r.client_email,
            'The agency needs a change to one piece of content',
            'The agency asked for a fix in "' || f.label || '": ' || left(_note, 2000)
            || ' — open your link to send it again.');
  else
    raise exception 'invalid_decision — use approve or adjust.'
      using errcode = '22001';
  end if;

  return jsonb_build_object('status', s.status, 'note', s.rejection_note);
end;
$$;

revoke execute on function public.review_field(uuid, text, text) from public;
grant execute on function public.review_field(uuid, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Ligar / desligar o link
-- ---------------------------------------------------------------------
create or replace function public.set_request_link(_request uuid, _revoke boolean)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
begin
  if not public.request_in_org(_request) then
    raise exception 'no_permission — no access to this request.' using errcode = '42501';
  end if;

  update public.requests
  set revoked_at = case when _revoke then now() else null end,
      status = case when _revoke then 'archived'::public.request_status else 'sent'::public.request_status end,
      updated_at = now()
  where id = _request
  returning * into r;

  insert into public.request_events (request_id, org_id, actor, actor_user_id, kind, detail)
  values (r.id, r.org_id, 'agency', auth.uid(),
          case when _revoke then 'link_revoked' else 'link_reopened' end, '{}'::jsonb);

  return jsonb_build_object('revoked', r.revoked_at is not null, 'status', r.status);
end;
$$;

revoke execute on function public.set_request_link(uuid, boolean) from public;
grant execute on function public.set_request_link(uuid, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Lembrete neutro para o cliente
-- ---------------------------------------------------------------------
create or replace function public.send_reminder(_request uuid)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  missing bigint;
  n uuid;
begin
  if not public.request_in_org(_request) then
    raise exception 'no_permission — no access to this request.' using errcode = '42501';
  end if;

  select * into r from public.requests where id = _request;

  select count(*) into missing
  from public.submissions
  where request_id = _request and status = 'pending';

  n := public.enqueue_notification(
    r.org_id, r.id, 'email', r.client_email,
    'Content still missing for your website',
    'There are ' || missing || ' items left. You can send everything through the link you already have — it stays open until '
      || to_char(r.expires_at, 'DD Mon YYYY') || '.'
  );

  insert into public.request_events (request_id, org_id, actor, actor_user_id, kind, detail)
  values (r.id, r.org_id, 'agency', auth.uid(), 'reminder_sent',
          jsonb_build_object('missing', missing, 'notification_id', n));

  return jsonb_build_object('notification_id', n, 'missing', missing);
end;
$$;

revoke execute on function public.send_reminder(uuid) from public;
grant execute on function public.send_reminder(uuid) to authenticated, service_role;

commit;
-- =====================================================================
-- Lockcopy — 0005 políticas de armazenamento
-- Bucket `client-uploads` (privado) criado antes: ver db/README.md.
-- Caminho obrigatório: <org_id>/<token>/<field_id>/<nome-do-ficheiro>
-- =====================================================================

begin;

-- O cliente final só escreve dentro da pasta do próprio link.
create policy "cliente envia para o seu link"
on storage.objects for insert to anon
with check (
  bucket_id = 'client-uploads'
  and public.path_matches_token(name)
);

-- E só lê o que está na pasta desse link.
create policy "cliente le o seu link"
on storage.objects for select to anon
using (
  bucket_id = 'client-uploads'
  and public.path_matches_token(name)
);

-- A agência lê e gere tudo dentro das suas pastas.
create policy "agencia le os seus ficheiros"
on storage.objects for select to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

create policy "agencia altera os seus ficheiros"
on storage.objects for update to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
)
with check (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

create policy "agencia apaga os seus ficheiros"
on storage.objects for delete to authenticated
using (
  bucket_id = 'client-uploads'
  and public.is_org_member(public.org_from_path(name))
);

-- `service_role` ignora RLS: trata de URLs assinadas e da purga.

commit;
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
  -- Institucional
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

-- ---------------------------------------------------------------------
-- Verificação rápida: se estes números aparecerem, a instalação ficou completa.
-- ---------------------------------------------------------------------
select
  (select count(*) from pg_tables where schemaname = 'public')                       as tabelas,
  (select count(*) from pg_policies where schemaname = 'public')                     as politicas_rls,
  (select count(*) from pg_policies where schemaname = 'storage')                    as politicas_storage,
  (select count(*) from public.plan_limits)                                          as planos,
  (select count(*) from public.templates where is_active)                            as modelos_ativos;
