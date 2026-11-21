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
