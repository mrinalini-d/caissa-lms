-- Caissa LMS schema
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

create extension if not exists "pgcrypto";

-- Chapters: Caissa, CRM, Classroom
create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- Modules: one video + one quiz each, belongs to a chapter
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  title text not null,
  description text,
  video_url text not null,       -- Supabase Storage or Drive link
  duration_seconds int,
  order_index int not null default 0,
  pass_score_pct int not null default 70,
  created_at timestamptz not null default now()
);

-- Questions belong to a module's quiz
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  question_text text not null,
  order_index int not null default 0
);

-- Options for each question (MCQ)
create table if not exists options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index int not null default 0
);

-- Per-user progress on each module
create table if not exists user_progress (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  module_id uuid not null references modules(id) on delete cascade,
  video_watched boolean not null default false,
  video_watched_at timestamptz,
  quiz_passed boolean not null default false,
  best_score_pct int,
  attempts int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_email, module_id)
);

-- Per-attempt quiz history (audit trail of scores)
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  module_id uuid not null references modules(id) on delete cascade,
  score_pct int not null,
  passed boolean not null,
  answers jsonb,                 -- { question_id: option_id }
  created_at timestamptz not null default now()
);

create index if not exists idx_modules_chapter on modules(chapter_id);
create index if not exists idx_questions_module on questions(module_id);
create index if not exists idx_options_question on options(question_id);
create index if not exists idx_progress_user on user_progress(user_email);
create index if not exists idx_attempts_user on quiz_attempts(user_email);

-- RLS: lock down direct client access; all reads/writes go through server routes
-- using the service_role key, which bypasses RLS.
alter table chapters enable row level security;
alter table modules enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table user_progress enable row level security;
alter table quiz_attempts enable row level security;
