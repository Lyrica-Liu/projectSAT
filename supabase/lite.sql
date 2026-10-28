-- ============================================================
-- 800Path Lite — database changes
-- Run this in the Supabase SQL editor (safe to re-run). Additive only: the website keeps
-- working exactly as before. Also kept as section 13 of schema.sql.
-- ============================================================

-- Lite's endless card stream is a session too, so its answers feed the same skill map.
-- A stream is "completed" from its first graded answer (completed_at moves forward with each
-- one), so closing the app mid-stream loses nothing and it never shows up as "resume".
alter table public.sessions add column if not exists kind text not null default 'set';
alter table public.sessions drop constraint if exists sessions_kind_check;
alter table public.sessions add constraint sessions_kind_check check (kind in ('set', 'stream'));
-- How a stream picks its next question (mode, category pool, starting tiers) — fixed when it
-- starts, so each card doesn't have to reload the whole skill map. See lib/lite/stream.ts.
alter table public.sessions add column if not exists stream_plan jsonb;

-- When each answer was graded: today's count for the daily goal.
alter table public.answers add column if not exists answered_at timestamptz;

-- Vocab flashcards: one row per word a student has reviewed (spaced repetition, see
-- lib/vocab/srs.ts). Words they haven't seen yet have no row.
create table if not exists public.vocab_progress (
  user_id          uuid not null references auth.users (id) on delete cascade,
  word             text not null,
  box              int  not null default 1 check (box between 1 and 5),
  due_at           timestamptz not null,
  reviews          int  not null default 0,
  lapses           int  not null default 0,
  last_reviewed_at timestamptz,
  primary key (user_id, word)
);

create index if not exists vocab_progress_due_idx on public.vocab_progress (user_id, due_at);

alter table public.vocab_progress enable row level security;

drop policy if exists "vocab_progress_select_own" on public.vocab_progress;
create policy "vocab_progress_select_own" on public.vocab_progress
  for select using (auth.uid() = user_id);
drop policy if exists "vocab_progress_insert_own" on public.vocab_progress;
create policy "vocab_progress_insert_own" on public.vocab_progress
  for insert with check (auth.uid() = user_id);
drop policy if exists "vocab_progress_update_own" on public.vocab_progress;
create policy "vocab_progress_update_own" on public.vocab_progress
  for update using (auth.uid() = user_id);
