-- Lockcopy — 0012: clients can leave a question or note on any field.
begin;

alter table public.submissions add column if not exists client_note text;

create or replace function public.portal_set_note(_token uuid, _field uuid, _note text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  clean text;
begin
  select * into r from public.requests where token = _token;
  if not found or r.revoked_at is not null or r.expires_at <= now() or r.status = 'archived' then
    raise exception 'invalid_link — this link is no longer available.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.fields f join public.sections s on s.id = f.section_id where f.id = _field and s.request_id = r.id) then
    raise exception 'unknown_field — this field is not part of this request.' using errcode = '42501';
  end if;
  clean := nullif(btrim(left(coalesce(_note, ''), 2000)), '');
  insert into public.submissions (field_id, request_id, org_id, client_note, updated_by)
  values (_field, r.id, r.org_id, clean, 'client')
  on conflict (field_id) do update set client_note = excluded.client_note, updated_at = now();
  return jsonb_build_object('note', clean);
end;
$$;

create or replace function public.portal_notes(_token uuid)
returns jsonb
language sql security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(s.field_id, s.client_note), '{}'::jsonb)
  from public.submissions s
  join public.requests r on r.id = s.request_id
  where r.token = _token and r.revoked_at is null and r.expires_at > now() and r.status <> 'archived'
    and s.client_note is not null;
$$;

revoke execute on function public.portal_set_note(uuid, uuid, text) from public;
grant execute on function public.portal_set_note(uuid, uuid, text) to anon, authenticated, service_role;
revoke execute on function public.portal_notes(uuid) from public;
grant execute on function public.portal_notes(uuid) to anon, authenticated, service_role;

commit;
