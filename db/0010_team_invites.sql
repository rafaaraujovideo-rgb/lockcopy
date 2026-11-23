-- =====================================================================
-- Lockcopy — 0010 team invites (Agency plan: up to 3 users)
-- Run once in the Supabase SQL Editor. Safe to run again.
-- =====================================================================
begin;

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (length(email) between 3 and 200),
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz
);
create index if not exists org_invites_org_idx on public.org_invites (org_id);

grant select, insert, delete on public.org_invites to authenticated;
grant all on public.org_invites to service_role;
alter table public.org_invites enable row level security;

drop policy if exists "owner sees invites" on public.org_invites;
create policy "owner sees invites" on public.org_invites for select to authenticated
using (public.org_has_role(org_id, 'owner'));
drop policy if exists "owner creates invites" on public.org_invites;
create policy "owner creates invites" on public.org_invites for insert to authenticated
with check (public.org_has_role(org_id, 'owner') and invited_by = auth.uid());
drop policy if exists "owner revokes invites" on public.org_invites;
create policy "owner revokes invites" on public.org_invites for delete to authenticated
using (public.org_has_role(org_id, 'owner'));

-- Members of my agency, with their email (auth.users is not readable directly).
create or replace function public.list_org_members(_org uuid)
returns table (user_id uuid, email text, role public.org_role, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from public.org_members m join auth.users u on u.id = m.user_id
  where m.org_id = _org and public.is_org_member(_org)
  order by m.created_at;
$$;
grant execute on function public.list_org_members(uuid) to authenticated;

-- What an invite link shows before accepting.
create or replace function public.invite_preview(_token text)
returns table (org_name text, email text, expired boolean, accepted boolean)
language sql stable security definer set search_path = public
as $$
  select o.name, i.email, i.expires_at < now(), i.accepted_at is not null
  from public.org_invites i join public.organizations o on o.id = i.org_id
  where i.token = _token;
$$;
grant execute on function public.invite_preview(text) to anon, authenticated;

-- Accept: only the invited email, once, before expiry. Members limit trigger still applies.
create or replace function public.accept_invite(_token text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  inv public.org_invites;
  me text;
begin
  if auth.uid() is null then
    raise exception 'convite_sessao' using errcode = '42501';
  end if;
  select * into inv from public.org_invites where token = _token for update;
  if not found or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'convite_invalido' using errcode = '42501';
  end if;
  select lower(email) into me from auth.users where id = auth.uid();
  if me is distinct from lower(inv.email) then
    raise exception 'convite_email' using errcode = '42501';
  end if;
  if not exists (select 1 from public.org_members where org_id = inv.org_id and user_id = auth.uid()) then
    insert into public.org_members (org_id, user_id, role) values (inv.org_id, auth.uid(), 'member');
  end if;
  update public.org_invites set accepted_at = now() where id = inv.id;
  return inv.org_id;
end;
$$;
grant execute on function public.accept_invite(text) to authenticated;

commit;

-- =====================================================================
-- Client "Send to agency": logs the hand-off and emails every member.
-- =====================================================================
begin;

create or replace function public.portal_send_to_agency(_token uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r public.requests;
  total int;
  ready int;
  recent boolean;
begin
  if not public.portal_token_active(_token) then
    raise exception 'link_invalido' using errcode = '42501';
  end if;
  select * into r from public.requests where token = _token;
  select count(*) into total from public.fields f join public.sections s on s.id = f.section_id where s.request_id = r.id;
  select count(*) into ready from public.submissions where request_id = r.id and status in ('submitted', 'approved');
  select exists (select 1 from public.request_events where request_id = r.id and kind = 'client_sent' and created_at > now() - interval '10 minutes') into recent;
  if not recent then
    insert into public.request_events (request_id, org_id, actor, kind, detail)
    values (r.id, r.org_id, 'client', 'client_sent', jsonb_build_object('ready', ready, 'total', total));
    insert into public.notifications (org_id, request_id, channel, kind, recipient, subject, body)
    select r.org_id, r.id, 'email', 'client_sent', u.email,
           r.client_name || ' sent their content',
           r.client_name || ' sent ' || ready || ' of ' || total || ' items for "' || r.title || '". Open Lockcopy to review.'
    from public.org_members m join auth.users u on u.id = m.user_id
    where m.org_id = r.org_id and m.notify_instant and u.email is not null;
  end if;
  return jsonb_build_object('ready', ready, 'total', total);
end;
$$;
revoke execute on function public.portal_send_to_agency(uuid) from public;
grant execute on function public.portal_send_to_agency(uuid) to anon, authenticated, service_role;

commit;
