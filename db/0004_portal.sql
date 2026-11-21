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
  public.request_in_org(uuid),
  public.org_limit(uuid, text),
  public.org_can_work(uuid)
to authenticated, service_role;

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
