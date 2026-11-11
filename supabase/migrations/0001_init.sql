-- Operation Date — initial schema
-- Run with: supabase db push
-- All client access goes through the `game-api` Edge Function using the
-- service-role key. RLS is enabled and no anon/authenticated policies are
-- created on purpose.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  telegram_username text,
  first_name text,
  last_name text,
  language_code text,
  init_data_hash text not null,
  current_screen text,
  completed_screens text[] not null default '{}',
  client_version text,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  state jsonb not null,
  state_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.puzzle_results (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions (id) on delete cascade,
  puzzle_id text not null check (puzzle_id in ('chronology', 'photo', 'cipher', 'menu')),
  solved boolean not null default false,
  attempts integer not null default 0 check (attempts >= 0),
  hints_used integer not null default 0 check (hints_used between 0 and 3),
  assisted boolean not null default false,
  solved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, puzzle_id)
);

create table if not exists public.discovered_secrets (
  session_id uuid not null references public.sessions (id) on delete cascade,
  secret_id text not null,
  discovered_at timestamptz not null default now(),
  primary key (session_id, secret_id)
);

create table if not exists public.date_preferences (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  scenario text,
  selected_stops text[] not null default '{}',
  ordered_stops text[] not null default '{}',
  route_built boolean not null default false,
  preferred_date date,
  preferred_time time,
  updated_at timestamptz not null default now()
);

create table if not exists public.final_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions (id) on delete cascade,
  response_type text not null check (response_type in ('yes', 'other_date', 'discuss')),
  preferred_date date,
  preferred_time time,
  message text check (message is null or char_length(message) <= 1000),
  scenario text,
  delivery text not null default 'telegram' check (delivery in ('telegram', 'pending', 'demo')),
  telegram_message_id bigint,
  progress_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists puzzle_results_session_idx on public.puzzle_results (session_id);
create index if not exists discovered_secrets_session_idx on public.discovered_secrets (session_id);
create index if not exists final_responses_created_idx on public.final_responses (created_at desc);

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
before update on public.user_progress
for each row execute function public.set_updated_at();

drop trigger if exists puzzle_results_set_updated_at on public.puzzle_results;
create trigger puzzle_results_set_updated_at
before update on public.puzzle_results
for each row execute function public.set_updated_at();

drop trigger if exists date_preferences_set_updated_at on public.date_preferences;
create trigger date_preferences_set_updated_at
before update on public.date_preferences
for each row execute function public.set_updated_at();

drop trigger if exists final_responses_set_updated_at on public.final_responses;
create trigger final_responses_set_updated_at
before update on public.final_responses
for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;
alter table public.user_progress enable row level security;
alter table public.puzzle_results enable row level security;
alter table public.discovered_secrets enable row level security;
alter table public.date_preferences enable row level security;
alter table public.final_responses enable row level security;

-- The anon key is public. The browser never talks to these tables directly;
-- it only invokes the game-api function. The service-role key bypasses RLS.
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.user_progress from anon, authenticated;
revoke all on table public.puzzle_results from anon, authenticated;
revoke all on table public.discovered_secrets from anon, authenticated;
revoke all on table public.date_preferences from anon, authenticated;
revoke all on table public.final_responses from anon, authenticated;

comment on table public.sessions is 'One row per Telegram user. init_data_hash is a SHA-256 of verified initData, never the raw payload.';
comment on table public.final_responses is 'Latest respectful answer from Alexandra. Upserted per session so edits replace earlier answers.';
