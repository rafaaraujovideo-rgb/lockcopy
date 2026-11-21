-- =====================================================================
-- Lockcopy — 0008 English content
-- Switches catalogue templates, notification emails and database error
-- messages to English. Safe to run on an already-installed database:
-- everything is idempotent (fixed ids, create or replace).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Templates, sections and fields (fixed ids from 0006)
-- ---------------------------------------------------------------------
update public.templates set name = 'Business website',     description = 'Home, about, services and contact.'        where id = '00000000-0000-4000-8000-000000000001';
update public.templates set name = 'Landing page',         description = 'A campaign page with offer and proof.'     where id = '00000000-0000-4000-8000-000000000002';
update public.templates set name = 'E-commerce',           description = 'Catalogue, product photos and policies.'   where id = '00000000-0000-4000-8000-000000000003';
update public.templates set name = 'Rebranding / assets',  description = 'Logos, colours, fonts and brand imagery.'  where id = '00000000-0000-4000-8000-000000000004';

update public.template_sections set title = 'Home',      description = 'The first thing people see.'          where id = '00000000-0000-4000-8000-000000000101';
update public.template_sections set title = 'About',     description = 'Who you are and how you work.'        where id = '00000000-0000-4000-8000-000000000102';
update public.template_sections set title = 'Services',  description = 'What you offer.'                      where id = '00000000-0000-4000-8000-000000000103';
update public.template_sections set title = 'Contact',   description = 'How people reach you.'                where id = '00000000-0000-4000-8000-000000000104';
update public.template_sections set title = 'Offer',     description = 'The campaign promise.'                where id = '00000000-0000-4000-8000-000000000105';
update public.template_sections set title = 'Proof',     description = 'Testimonials and trust.'              where id = '00000000-0000-4000-8000-000000000106';
update public.template_sections set title = 'Catalogue', description = 'Products and photos.'                 where id = '00000000-0000-4000-8000-000000000107';
update public.template_sections set title = 'Policies',  description = 'Shipping, returns, deadlines.'        where id = '00000000-0000-4000-8000-000000000108';
update public.template_sections set title = 'Brand',     description = 'Everything that defines the brand.'   where id = '00000000-0000-4000-8000-000000000109';

update public.template_fields set label = 'Main headline',                        help_text = 'One line about what you do.'              where id = '00000000-0000-4000-8000-000000000201';
update public.template_fields set label = 'Cover photo',                          help_text = 'The big photo at the top of the page.'    where id = '00000000-0000-4000-8000-000000000202';
update public.template_fields set label = 'Your story',                           help_text = 'Two to four paragraphs.'                  where id = '00000000-0000-4000-8000-000000000203';
update public.template_fields set label = 'Team photos',                          help_text = 'Portrait or group, whatever you have.'    where id = '00000000-0000-4000-8000-000000000204';
update public.template_fields set label = 'List of services',                     help_text = 'One service per line.'                    where id = '00000000-0000-4000-8000-000000000205';
update public.template_fields set label = 'Address, phone and email',             help_text = 'How people find you.'                     where id = '00000000-0000-4000-8000-000000000206';
update public.template_fields set label = 'Logo',                                 help_text = 'SVG or PNG on a transparent background.'  where id = '00000000-0000-4000-8000-000000000207';
update public.template_fields set label = 'Headline',                             help_text = 'The first sentence people read.'          where id = '00000000-0000-4000-8000-000000000208';
update public.template_fields set label = 'Offer description',                    help_text = 'What the person gains by acting.'         where id = '00000000-0000-4000-8000-000000000209';
update public.template_fields set label = 'Testimonials',                         help_text = 'Short quotes from real clients.'          where id = '00000000-0000-4000-8000-000000000210';
update public.template_fields set label = 'Client logos',                         help_text = 'To show next to the offer.'               where id = '00000000-0000-4000-8000-000000000211';
update public.template_fields set label = 'Products (name, price, description)',  help_text = 'One product per block.'                   where id = '00000000-0000-4000-8000-000000000212';
update public.template_fields set label = 'Product photos',                       help_text = 'Clean background, if possible.'           where id = '00000000-0000-4000-8000-000000000213';
update public.template_fields set label = 'Shipping and returns',                 help_text = 'Deadlines, costs and conditions.'         where id = '00000000-0000-4000-8000-000000000214';
update public.template_fields set label = 'Current logos',                        help_text = 'Every format that exists.'                where id = '00000000-0000-4000-8000-000000000215';
update public.template_fields set label = 'Colours and fonts',                    help_text = 'Colour codes and font names.'             where id = '00000000-0000-4000-8000-000000000216';
update public.template_fields set label = 'References you like',                  help_text = 'Screenshots or links to examples.'        where id = '00000000-0000-4000-8000-000000000217';

-- ---------------------------------------------------------------------
-- review_field: English emails and error messages
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
-- set_request_link: English error message
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
-- send_reminder: English email and error message
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
