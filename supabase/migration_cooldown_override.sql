-- Run this in Supabase SQL Editor for existing projects (schema.sql already
-- includes this column for fresh installs).
alter table user_progress add column if not exists cooldown_cleared_at timestamptz;
