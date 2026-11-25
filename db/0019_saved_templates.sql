-- 0019: agencies can save their own reusable templates.
-- Catalogue templates keep org_id null; saved ones belong to one agency
-- and are only visible to its members.

alter table public.templates add column if not exists org_id uuid references public.organizations (id) on delete cascade;
create index if not exists templates_org_idx on public.templates (org_id);

drop policy if exists "modelos ativos visiveis" on public.templates;
create policy "modelos ativos visiveis"
on public.templates for select to anon, authenticated
using (is_active and (org_id is null or public.is_org_member(org_id)));

drop policy if exists "seccoes de modelos ativos" on public.template_sections;
create policy "seccoes de modelos ativos"
on public.template_sections for select to anon, authenticated
using (exists (select 1 from public.templates t where t.id = template_id and t.is_active
  and (t.org_id is null or public.is_org_member(t.org_id))));

drop policy if exists "campos de modelos ativos" on public.template_fields;
create policy "campos de modelos ativos"
on public.template_fields for select to anon, authenticated
using (exists (
  select 1 from public.template_sections s
  join public.templates t on t.id = s.template_id
  where s.id = section_id and t.is_active and (t.org_id is null or public.is_org_member(t.org_id))
));

-- Save: _sections = [{ "title": text, "fields": [{ "label", "help", "type", "limit" }] }]
create or replace function public.save_org_template(_org uuid, _name text, _sections jsonb)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  tid uuid;
  sid uuid;
  s jsonb;
  f jsonb;
  si int := 0;
  fi int;
  n int;
begin
  if not public.is_org_member(_org) then
    raise exception 'no_access' using errcode = '42501';
  end if;
  if coalesce(btrim(_name), '') = '' then
    raise exception 'template_name_required' using errcode = '22023';
  end if;
  select count(*) into n from public.templates where org_id = _org and is_active;
  if n >= 50 then
    raise exception 'template_limit' using errcode = '22023';
  end if;
  if jsonb_typeof(_sections) <> 'array' or jsonb_array_length(_sections) = 0 or jsonb_array_length(_sections) > 30 then
    raise exception 'template_empty' using errcode = '22023';
  end if;

  insert into public.templates (slug, name, description, org_id)
  values ('org-' || gen_random_uuid(), left(btrim(_name), 80), 'Saved template', _org)
  returning id into tid;

  for s in select * from jsonb_array_elements(_sections) loop
    if jsonb_array_length(coalesce(s->'fields', '[]'::jsonb)) = 0 then continue; end if;
    insert into public.template_sections (template_id, title, order_index)
    values (tid, left(coalesce(nullif(btrim(s->>'title'), ''), 'Page'), 200), si)
    returning id into sid;
    si := si + 1;
    fi := 0;
    for f in select * from jsonb_array_elements(s->'fields') limit 100 loop
      insert into public.template_fields (section_id, label, help_text, field_type, char_limit, order_index)
      values (
        sid,
        left(coalesce(nullif(btrim(f->>'label'), ''), 'Question'), 200),
        nullif(left(coalesce(f->>'help', ''), 300), ''),
        case when f->>'type' in ('text', 'textarea', 'image', 'file') then (f->>'type')::public.field_type else 'text' end,
        case when (f->>'limit') ~ '^\d+$' and (f->>'limit')::int between 1 and 20000 then (f->>'limit')::int end,
        fi
      );
      fi := fi + 1;
    end loop;
  end loop;

  if si = 0 then
    raise exception 'template_empty' using errcode = '22023';
  end if;
  return tid;
end;
$$;

create or replace function public.delete_org_template(_template uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare o uuid;
begin
  select org_id into o from public.templates where id = _template;
  if o is null or not public.is_org_member(o) then
    raise exception 'no_access' using errcode = '42501';
  end if;
  update public.templates set is_active = false where id = _template;
end;
$$;

revoke execute on function public.save_org_template(uuid, text, jsonb) from public, anon;
revoke execute on function public.delete_org_template(uuid) from public, anon;
grant execute on function public.save_org_template(uuid, text, jsonb) to authenticated, service_role;
grant execute on function public.delete_org_template(uuid) to authenticated, service_role;

-- Requests may only use catalogue templates or the agency's own.
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

  select * into t from public.templates
  where id = _template and is_active and (org_id is null or org_id = _org);
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
