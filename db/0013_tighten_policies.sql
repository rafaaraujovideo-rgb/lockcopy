-- Replace "allow everything" access rules with real checks.

-- Agencies: only a signed-in user can create one, starting with no storage used.
-- (Billing columns are already forced by the start-trial trigger.)
drop policy if exists "criar organizacao propria" on public.organizations;
create policy "criar organizacao propria"
on public.organizations for insert to authenticated
with check (auth.uid() is not null and storage_used_bytes = 0);

-- Plan limits: readable only by signed-in users.
drop policy if exists "limites visiveis" on public.plan_limits;
create policy "limites visiveis"
on public.plan_limits for select to authenticated
using (auth.uid() is not null);
