-- ============================================================
-- PrepWise — Supabase Schema
-- Run this in the Supabase SQL editor to initialize the database.
-- ============================================================

-- ───────────────────────────────────────────
-- 1. Profiles (extends auth.users)
-- ───────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now() not null
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────
-- 2. Questions
-- ───────────────────────────────────────────
create type if not exists public.question_domain as enum ('reading', 'writing');

create type if not exists public.question_skill as enum (
  'central_idea',
  'command_of_evidence',
  'inferences',
  'words_in_context',
  'cross_text_connections',
  'text_structure',
  'boundaries',
  'form_structure_sense',
  'transitions',
  'rhetorical_synthesis'
);

create type if not exists public.difficulty_level as enum ('easy', 'medium-low', 'medium-high', 'hard');

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  domain      public.question_domain  not null,
  skill       public.question_skill   not null,
  difficulty  public.difficulty_level not null default 'medium',
  passage     text,
  stem        text not null,
  options     jsonb not null,  -- { "A": "...", "B": "...", "C": "...", "D": "..." }
  answer      char(1) not null check (answer in ('A','B','C','D')),
  explanation text not null,
  created_at  timestamptz default now() not null
);

create index if not exists questions_user_id_idx on public.questions (user_id);

-- ───────────────────────────────────────────
-- 3. Sessions
-- ───────────────────────────────────────────
create type if not exists public.domain_filter as enum ('reading', 'writing', 'both');

create table if not exists public.sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  started_at     timestamptz default now() not null,
  completed_at   timestamptz,
  question_count int not null default 10,
  score          int,  -- percentage 0-100
  domain_filter  public.domain_filter not null default 'both',
  feedback_text  text  -- AI-generated feedback (populated after session completes)
);

create index if not exists sessions_user_id_idx on public.sessions (user_id);
create index if not exists sessions_completed_at_idx on public.sessions (completed_at desc);

-- ───────────────────────────────────────────
-- 4. Answers
-- ───────────────────────────────────────────
create table if not exists public.answers (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.sessions (id) on delete cascade,
  question_id         uuid not null references public.questions (id) on delete cascade,
  user_answer         char(1) check (user_answer in ('A','B','C','D')),
  is_correct          boolean,
  time_spent_seconds  int,
  unique (session_id, question_id)
);

create index if not exists answers_session_id_idx on public.answers (session_id);

-- ───────────────────────────────────────────
-- 5. Row Level Security
-- ───────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.questions enable row level security;
alter table public.sessions  enable row level security;
alter table public.answers   enable row level security;

-- profiles: users can read/update their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- questions: users can only read and insert their own
create policy "questions_select_own" on public.questions
  for select using (auth.uid() = user_id);

create policy "questions_insert_own" on public.questions
  for insert with check (auth.uid() = user_id);

create policy "questions_delete_own" on public.questions
  for delete using (auth.uid() = user_id);

-- sessions: users can CRUD their own sessions
create policy "sessions_select_own" on public.sessions
  for select using (auth.uid() = user_id);

create policy "sessions_insert_own" on public.sessions
  for insert with check (auth.uid() = user_id);

create policy "sessions_update_own" on public.sessions
  for update using (auth.uid() = user_id);

-- answers: users can CRUD answers belonging to their sessions
create policy "answers_select_own" on public.answers
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "answers_insert_own" on public.answers
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "answers_update_own" on public.answers
  for update using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- ───────────────────────────────────────────
-- 6. Plan Days (30-day structured program)
-- ───────────────────────────────────────────
-- Run this section independently if adding to an existing DB.

create table if not exists public.plan_days (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  day_number   int  not null check (day_number between 1 and 30),
  session_id   uuid references public.sessions (id) on delete set null,
  score        int,           -- accuracy % when completed
  completed_at timestamptz,
  started_at   timestamptz default now() not null,
  unique (user_id, day_number)
);

create index if not exists plan_days_user_id_idx on public.plan_days (user_id);
create index if not exists plan_days_session_id_idx on public.plan_days (session_id);

alter table public.plan_days enable row level security;

create policy "plan_days_select_own" on public.plan_days
  for select using (auth.uid() = user_id);

create policy "plan_days_insert_own" on public.plan_days
  for insert with check (auth.uid() = user_id);

create policy "plan_days_update_own" on public.plan_days
  for update using (auth.uid() = user_id);

create policy "plan_days_delete_own" on public.plan_days
  for delete using (auth.uid() = user_id);

-- ───────────────────────────────────────────
-- 7. Adaptive difficulty support
-- ───────────────────────────────────────────
-- Run this section independently if adding to an existing DB.

-- Play order within a session, so the adaptive algorithm can replay
-- "what happened so far" deterministically (uuid ids aren't sortable).
alter table public.answers add column if not exists position int not null default 0;

-- Assignment computed after English slot 11 finishes, for slots 12-20.
-- (difficulty is plain text here to match questions.difficulty /
-- sessions.domain_filter, which are text in the live DB, not enums.)
alter table public.plan_days add column if not exists subcategory text;
alter table public.plan_days add column if not exists difficulty text;

-- A user's saved difficulty per SAT category — seeds the next session on
-- that category, and ranks weakest categories for the slot 12-20 assignment.
create table if not exists public.category_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  subcategory  text not null,
  difficulty   text not null,
  updated_at   timestamptz default now() not null,
  unique (user_id, subcategory)
);

create index if not exists category_progress_user_id_idx on public.category_progress (user_id);

alter table public.category_progress enable row level security;

create policy "category_progress_select_own" on public.category_progress
  for select using (auth.uid() = user_id);

create policy "category_progress_insert_own" on public.category_progress
  for insert with check (auth.uid() = user_id);

create policy "category_progress_update_own" on public.category_progress
  for update using (auth.uid() = user_id);
