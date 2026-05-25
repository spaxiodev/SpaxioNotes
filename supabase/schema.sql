-- Spaxio Assistant production schema for Supabase.
-- Run this in the Supabase SQL editor before deploying to Vercel.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  focus_area text default 'school, client work, and creative projects',
  calendar_connected boolean not null default false,
  voice_capture boolean not null default true,
  ai_mode text not null default 'local' check (ai_mode in ('local', 'api-ready')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  subscription_status text not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  invite_code text not null default encode(gen_random_bytes(8), 'hex'),
  referred_by_user_id uuid references public.profiles(id) on delete set null,
  referral_discount_eligible boolean not null default false,
  referral_discount_activated_at timestamptz,
  referral_discount_expires_at timestamptz,
  promotion_emails_opt_out boolean not null default false,
  promotion_email_token text not null default encode(gen_random_bytes(24), 'hex'),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists referred_by_user_id uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists referral_discount_eligible boolean not null default false;
alter table public.profiles add column if not exists referral_discount_activated_at timestamptz;
alter table public.profiles add column if not exists referral_discount_expires_at timestamptz;
alter table public.profiles add column if not exists promotion_emails_opt_out boolean not null default false;
alter table public.profiles add column if not exists promotion_email_token text;
alter table public.profiles add column if not exists preferred_language text not null default 'en' check (preferred_language in ('en', 'fr'));

update public.profiles
set invite_code = encode(gen_random_bytes(8), 'hex')
where invite_code is null;

update public.profiles
set promotion_email_token = encode(gen_random_bytes(24), 'hex')
where promotion_email_token is null;

alter table public.profiles alter column invite_code set default encode(gen_random_bytes(8), 'hex');
alter table public.profiles alter column invite_code set not null;
alter table public.profiles alter column promotion_email_token set default encode(gen_random_bytes(24), 'hex');
alter table public.profiles alter column promotion_email_token set not null;

create unique index if not exists profiles_invite_code_key on public.profiles(invite_code);
create unique index if not exists profiles_promotion_email_token_key on public.profiles(promotion_email_token);

create table if not exists public.workspace_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  summary text not null,
  source text not null,
  entities text[] not null default '{}',
  people text[] not null default '{}',
  projects text[] not null default '{}',
  actions text[] not null default '{}',
  urgency integer not null default 2,
  confidence integer not null default 80,
  file_path text,
  recurring_event jsonb,
  created_at timestamptz not null default now()
);

alter table public.memories add column if not exists recurring_event jsonb;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  project text not null default 'Inbox',
  estimate_minutes integer not null default 30,
  due_label text not null default 'This week',
  status text not null default 'todo' check (status in ('todo', 'done')),
  source_memory_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  trigger text not null,
  context text not null,
  source_memory_id uuid,
  done boolean not null default false,
  remind_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reminders add column if not exists remind_at timestamptz;

-- Tracks reminder emails already dispatched by the cron job. Reminders live in
-- workspace_states.state JSON keyed by the client-generated reminder id, so this
-- table is keyed on (user_id, reminder_id) to dedupe across cron runs.
create table if not exists public.reminder_dispatches (
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, reminder_id)
);

alter table public.reminder_dispatches enable row level security;

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists promotions_active_created_at_idx
  on public.promotions (active, created_at desc);

create table if not exists public.promotion_reads (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (promotion_id, user_id)
);

create table if not exists public.promotion_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  unsubscribe_token text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (promotion_id, user_id)
);

create index if not exists promotion_email_deliveries_status_created_at_idx
  on public.promotion_email_deliveries (status, created_at);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_client_managed_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), auth.role());
begin
  if request_role = 'authenticated' then
    if tg_op = 'INSERT' then
      new.plan = 'free';
      new.subscription_status = 'inactive';
      new.stripe_customer_id = null;
      new.stripe_subscription_id = null;
      new.invite_code = encode(gen_random_bytes(8), 'hex');
      new.referred_by_user_id = null;
      new.referral_discount_eligible = false;
      new.referral_discount_activated_at = null;
      new.referral_discount_expires_at = null;
      new.promotion_email_token = encode(gen_random_bytes(24), 'hex');
    elsif tg_op = 'UPDATE' then
      new.plan = old.plan;
      new.subscription_status = old.subscription_status;
      new.stripe_customer_id = old.stripe_customer_id;
      new.stripe_subscription_id = old.stripe_subscription_id;
      new.invite_code = old.invite_code;
      new.referred_by_user_id = old.referred_by_user_id;
      new.referral_discount_eligible = old.referral_discount_eligible;
      new.referral_discount_activated_at = old.referral_discount_activated_at;
      new.referral_discount_expires_at = old.referral_discount_expires_at;
      new.promotion_email_token = old.promotion_email_token;
      new.created_at = old.created_at;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_client_managed_columns on public.profiles;
create trigger protect_profile_client_managed_columns
before insert or update on public.profiles
for each row execute function public.protect_profile_client_managed_columns();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspace_states_updated_at on public.workspace_states;
create trigger touch_workspace_states_updated_at
before update on public.workspace_states
for each row execute function public.touch_updated_at();

drop trigger if exists touch_promotion_email_deliveries_updated_at on public.promotion_email_deliveries;
create trigger touch_promotion_email_deliveries_updated_at
before update on public.promotion_email_deliveries
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspace_states enable row level security;
alter table public.memories enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_reads enable row level security;
alter table public.promotion_email_deliveries enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users own workspace state" on public.workspace_states;
create policy "Users own workspace state"
on public.workspace_states for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users own memories" on public.memories;
create policy "Users own memories"
on public.memories for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users own tasks" on public.tasks;
create policy "Users own tasks"
on public.tasks for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users own reminders" on public.reminders;
create policy "Users own reminders"
on public.reminders for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated can read active promotions" on public.promotions;
create policy "Authenticated can read active promotions"
on public.promotions for select
to authenticated
using (active = true);

drop policy if exists "Users own promotion reads" on public.promotion_reads;
create policy "Users own promotion reads"
on public.promotion_reads for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('spaxio-uploads', 'spaxio-uploads', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own uploads" on storage.objects;
create policy "Users can read own uploads"
on storage.objects for select
to authenticated
using (bucket_id = 'spaxio-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload own files" on storage.objects;
create policy "Users can upload own files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'spaxio-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own uploads" on storage.objects;
create policy "Users can update own uploads"
on storage.objects for update
to authenticated
using (bucket_id = 'spaxio-uploads' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'spaxio-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own uploads" on storage.objects;
create policy "Users can delete own uploads"
on storage.objects for delete
to authenticated
using (bucket_id = 'spaxio-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
