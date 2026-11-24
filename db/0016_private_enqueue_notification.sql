-- 0016: enqueue_notification is internal only (called by other security-definer
-- functions). Block direct calls from the browser so nobody can queue emails.
revoke execute on function public.enqueue_notification(uuid, uuid, public.notification_channel, text, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.enqueue_notification(uuid, uuid, public.notification_channel, text, text, text, timestamptz, text)
  to service_role;
