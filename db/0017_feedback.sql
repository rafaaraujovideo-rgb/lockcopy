-- Feedback sent from inside the app. Users can only add their own; only the owner reads it (server, service role).
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  kind text not null check (kind in ('idea','problem','question')),
  message text not null check (char_length(message) between 3 and 4000),
  page text,
  created_at timestamptz not null default now()
);
grant insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
drop policy if exists "feedback insert own" on public.feedback;
create policy "feedback insert own" on public.feedback for insert to authenticated
  with check (user_id = auth.uid() and (org_id is null or public.is_org_member(org_id)));
