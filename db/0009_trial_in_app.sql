-- =====================================================================
-- Lockcopy — 0009 Trial starts in the app, no Stripe needed
-- Every new agency gets 14 days on the Solo plan the moment it is
-- created. The trial ends on its own unless a card was added in Stripe.
-- Billing columns can only be changed by the server (Stripe webhook).
-- Safe to run more than once.
-- =====================================================================

begin;

-- New agencies: trial starts now, billing columns cannot be forged.
create or replace function public.start_trial_on_create()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  new.plan := 'solo';
  new.subscription_status := 'trialing';
  new.trial_ends_at := now() + make_interval(days => coalesce((select trial_days from public.plan_limits where plan = 'solo'), 14));
  new.stripe_customer_id := null;
  new.stripe_subscription_id := null;
  new.current_period_ends_at := null;
  new.grace_period_ends_at := null;
  return new;
end;
$$;

drop trigger if exists organizations_start_trial on public.organizations;
create trigger organizations_start_trial
before insert on public.organizations
for each row execute function public.start_trial_on_create();

-- Signed-in users may edit name, logo and colour only; never billing.
create or replace function public.guard_billing_columns()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    new.plan := old.plan;
    new.subscription_status := old.subscription_status;
    new.trial_ends_at := old.trial_ends_at;
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.current_period_ends_at := old.current_period_ends_at;
    new.grace_period_ends_at := old.grace_period_ends_at;
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_guard_billing on public.organizations;
create trigger organizations_guard_billing
before update on public.organizations
for each row execute function public.guard_billing_columns();

-- A trial without a Stripe subscription stops working when it ends.
create or replace function public.org_can_work(_org uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = _org
      and (
        (o.subscription_status = 'trialing'
          and (o.stripe_subscription_id is not null or o.trial_ends_at is null or o.trial_ends_at > now()))
        or o.subscription_status = 'active'
        or (o.subscription_status = 'past_due'
            and o.grace_period_ends_at is not null
            and o.grace_period_ends_at > now())
      )
  );
$$;

-- Existing agencies that never started a trial get their 14 days now.
update public.organizations
set plan = 'solo', trial_ends_at = now() + interval '14 days'
where stripe_subscription_id is null and trial_ends_at is null and plan = 'teste';

commit;
