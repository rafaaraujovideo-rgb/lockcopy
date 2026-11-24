-- 1) Un-archiving a request must respect the plan's active-request limit.
create or replace function public.enforce_request_limit_on_reactivate()
returns trigger language plpgsql security definer set search_path = public as $$
declare n bigint; lim bigint;
begin
  if (old.status = 'archived' or old.revoked_at is not null)
     and new.status <> 'archived' and new.revoked_at is null then
    if not public.org_can_work(new.org_id) then
      raise exception 'conta_sem_plano — regularize a subscrição antes de criar novos pedidos.' using errcode = '42501';
    end if;
    select count(*) into n from public.requests
    where org_id = new.org_id and id <> new.id and status <> 'archived' and revoked_at is null;
    lim := public.org_limit(new.org_id, 'requests');
    if n >= lim then
      raise exception 'limite_pedidos — atingiu o limite de % pedidos ativos. Os pedidos em curso continuam a receber conteúdos.', lim using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists requests_limit_reactivate on public.requests;
create trigger requests_limit_reactivate before update on public.requests
for each row execute function public.enforce_request_limit_on_reactivate();

-- 2) Instant email after a client hands over content only sends that request's emails.
create or replace function public.claim_portal_notifications(_token uuid, _batch integer default 10)
returns setof public.notifications language plpgsql security definer set search_path = public as $$
declare r public.notifications;
begin
  for r in
    select n.* from public.notifications n
    join public.requests q on q.id = n.request_id
    where q.token = _token and n.status = 'queued' and n.scheduled_for <= now()
    order by n.scheduled_for limit _batch for update of n skip locked
  loop
    update public.notifications set status = 'processing', attempts = attempts + 1, last_error = null where id = r.id;
    r.status := 'processing'; r.attempts := r.attempts + 1;
    return next r;
  end loop;
end $$;
revoke execute on function public.claim_portal_notifications(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_portal_notifications(uuid, integer) to service_role;

-- 3) Plan limits: each user only reads the limits of their own agency's plan.
drop policy if exists "limites visiveis" on public.plan_limits;
create policy "limites visiveis" on public.plan_limits for select to authenticated
using (exists (select 1 from public.organizations o where o.plan = plan_limits.plan and public.is_org_member(o.id))
       or plan = 'teste');
