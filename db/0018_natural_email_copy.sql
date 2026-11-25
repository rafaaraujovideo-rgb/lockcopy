-- Lockcopy: natural email wording. Run manually in the external Supabase SQL Editor.
-- Copy only: preserves authorization, recipients, event logging and timing.
-- Existing queued or sent emails are not changed.
begin;

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
            'Please update "' || f.label || '"',
            E'Hi,\n\nThere is a note on "' || f.label || E'" for "' || r.title || E'":\n' || left(_note, 2000)
            || E'\n\nYou can update it through the client link you already have.');
  else
    raise exception 'invalid_decision — use approve or adjust.'
      using errcode = '22001';
  end if;

  return jsonb_build_object('status', s.status, 'note', s.rejection_note);
end;
$$;

revoke execute on function public.review_field(uuid, text, text) from public;
grant execute on function public.review_field(uuid, text, text) to authenticated, service_role;

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
    'Content still needed for ' || r.title,
    E'Hi,\n\nThere ' || case when missing = 1 then 'is ' else 'are ' end || missing || case when missing = 1 then ' item' else ' items' end || ' left for "' || r.title || '". You can finish through the client link you already have. The link stays open until '
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
           E'Hi,\n\n' || r.client_name || ' sent content for "' || r.title || '". ' || ready || ' of ' || total || E' items are ready for review.\n\nOpen the request in Lockcopy to review them.'
    from public.org_members m join auth.users u on u.id = m.user_id
    where m.org_id = r.org_id and m.notify_instant and u.email is not null;
  end if;
  return jsonb_build_object('ready', ready, 'total', total);
end;
$$;
revoke execute on function public.portal_send_to_agency(uuid) from public;
grant execute on function public.portal_send_to_agency(uuid) to anon, authenticated, service_role;

commit;
