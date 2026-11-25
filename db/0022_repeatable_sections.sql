-- 0022 — Repeatable pages: the agency marks a page as repeatable and the
-- client can add another copy of it ("+ Add another") from the portal.
alter table public.sections add column if not exists is_repeatable boolean not null default false;
alter table public.sections add column if not exists repeat_of uuid references public.sections(id) on delete cascade;

-- Which pages are repeatable, and which are copies, for the portal.
create or replace function public.portal_sections_meta(_token uuid)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare r public.requests;
begin
  select * into r from public.requests where token = _token;
  if not found or not public.portal_token_active(_token) then
    raise exception 'link_invalido' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'repeatable', s.is_repeatable, 'repeat_of', s.repeat_of)), '[]'::jsonb)
          from public.sections s where s.request_id = r.id and (s.is_repeatable or s.repeat_of is not null));
end;
$$;

create or replace function public.portal_add_repeat(_token uuid, _section uuid)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  r public.requests;
  base public.sections;
  copies int;
  last_oi int;
  new_id uuid;
begin
  select * into r from public.requests where token = _token;
  if not found or not public.portal_token_active(_token) then
    raise exception 'link_invalido' using errcode = '42501';
  end if;
  select * into base from public.sections where id = _section and request_id = r.id and is_repeatable;
  if not found then raise exception 'not_repeatable' using errcode = '42501'; end if;
  select count(*) into copies from public.sections where repeat_of = base.id;
  if copies >= 19 then raise exception 'too_many_copies' using errcode = '22023'; end if;
  select max(order_index) into last_oi from public.sections where id = base.id or repeat_of = base.id;
  update public.sections set order_index = order_index + 1 where request_id = r.id and order_index > last_oi;
  insert into public.sections (request_id, title, description, order_index, repeat_of)
  values (r.id, base.title || ' ' || (copies + 2), base.description, last_oi + 1, base.id)
  returning id into new_id;
  insert into public.fields (section_id, label, help_text, field_type, is_required, char_limit, allowed_mime, order_index)
  select new_id, label, help_text, field_type, is_required, char_limit, allowed_mime, order_index from public.fields where section_id = base.id;
  insert into public.request_events (request_id, org_id, actor, kind, detail)
  values (r.id, r.org_id, 'client', 'page_added', jsonb_build_object('section_id', new_id, 'of', base.id));
  return new_id;
end;
$$;

create or replace function public.portal_remove_repeat(_token uuid, _section uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare r public.requests;
begin
  select * into r from public.requests where token = _token;
  if not found or not public.portal_token_active(_token) then
    raise exception 'link_invalido' using errcode = '42501';
  end if;
  if not exists (select 1 from public.sections where id = _section and request_id = r.id and repeat_of is not null) then
    raise exception 'not_repeatable' using errcode = '42501';
  end if;
  if exists (select 1 from public.submissions sb join public.fields f on f.id = sb.field_id where f.section_id = _section and btrim(coalesce(sb.value_text, '')) <> '')
     or exists (select 1 from public.submission_files ff join public.fields f on f.id = ff.field_id where f.section_id = _section) then
    raise exception 'copy_not_empty' using errcode = '22023';
  end if;
  delete from public.submissions where field_id in (select id from public.fields where section_id = _section);
  delete from public.sections where id = _section;
end;
$$;

revoke execute on function public.portal_sections_meta(uuid) from public;
revoke execute on function public.portal_add_repeat(uuid, uuid) from public;
revoke execute on function public.portal_remove_repeat(uuid, uuid) from public;
grant execute on function public.portal_sections_meta(uuid) to anon, authenticated, service_role;
grant execute on function public.portal_add_repeat(uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.portal_remove_repeat(uuid, uuid) to anon, authenticated, service_role;
