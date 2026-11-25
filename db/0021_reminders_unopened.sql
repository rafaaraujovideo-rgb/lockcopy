-- 0021: automatic reminders also chase clients who never opened the link.
-- Before, a request stayed 'draft' until the client typed something, so it got no reminders,
-- and fields without any answer were not counted as missing. Safe to run more than once.

create or replace function public.queue_auto_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  off int;
  k text;
  missing int;
  agency text;
  dur text;
  subj text;
  msg text;
  n int := 0;
begin
  for r in
    select q.* from public.requests q
    where q.due_date is not null and q.revoked_at is null
      and q.status in ('draft', 'sent', 'in_progress') and q.expires_at > now()
  loop
    off := (r.due_date - current_date);
    if off not in (3, 0, -2) then continue; end if;
    k := 'auto_reminder_' || case when off < 0 then 'after_' || (-off) when off = 0 then 'due' else 'before_' || off end;
    if exists (select 1 from public.notifications where request_id = r.id and kind = k) then continue; end if;
    select count(*) into missing
      from public.fields f join public.sections s on s.id = f.section_id
      where s.request_id = r.id
        and not exists (select 1 from public.submissions x where x.field_id = f.id and x.status in ('submitted', 'approved'));
    if missing = 0 then continue; end if;
    select coalesce(name, 'Your agency') into agency from public.organizations where id = r.org_id;
    dur := abs(off) || ' day' || case when abs(off) = 1 then '' else 's' end;
    subj := case when off < 0 then 'Still waiting on content for ' || r.title
                 when off = 0 then 'Content for ' || r.title || ' is due today'
                 else 'Content for ' || r.title || ' is due in ' || dur end;
    msg := 'Hi,' || E'\n\n' || 'The content for "' || r.title || '" '
        || case when off < 0 then 'was due ' || dur || ' ago' when off = 0 then 'is due today' else 'is due in ' || dur end
        || '. ' || coalesce(agency, 'Your agency') || ' is still waiting on ' || missing || ' item' || case when missing = 1 then '' else 's' end
        || '. Your saved answers are still there. You can finish here:' || E'\n\n'
        || 'https://lockcopy.com/c/' || r.token || E'\n\nThanks!';
    insert into public.notifications (org_id, request_id, channel, kind, recipient, subject, body)
    values (r.org_id, r.id, 'email', k, r.client_email, subj, msg);
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.queue_auto_reminders() from public, anon, authenticated;
grant execute on function public.queue_auto_reminders() to service_role;
