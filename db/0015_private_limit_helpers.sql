-- Plan-limit and billing helpers are only used inside SECURITY DEFINER
-- triggers, so no client role needs to call them directly.
begin;
revoke execute on function public.org_limit(uuid, text), public.org_can_work(uuid)
  from public, anon, authenticated;
grant execute on function public.org_limit(uuid, text), public.org_can_work(uuid)
  to service_role;
commit;
