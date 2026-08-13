-- Run this in Supabase SQL Editor for existing projects (schema.sql already
-- includes this column for fresh installs).
alter table questions add column if not exists explanation text;
