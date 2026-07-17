-- Example seed data. Replace video_url values with your real Supabase Storage
-- or Drive links, and edit questions/options to match your real content.
-- Run after schema.sql.

with ch as (
  insert into chapters (title, description, order_index) values
    ('Caissa', 'Learn the CircleChess coaching method', 1),
    ('CRM', 'Managing students and parents in the CRM', 2),
    ('Classroom', 'Running an effective online classroom', 3)
  returning id, title
),
mod1 as (
  insert into modules (chapter_id, title, description, video_url, order_index)
  select id, 'Welcome to Caissa', 'Introduction to the Caissa method', 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/videos/caissa-1.mp4', 1
  from ch where title = 'Caissa'
  returning id
)
insert into questions (module_id, question_text, order_index)
select id, 'What is the primary goal of the Caissa method?', 1 from mod1
returning id;

-- Then insert options for that question id, e.g.:
-- insert into options (question_id, option_text, is_correct, order_index) values
--   ('<question-id>', 'Correct answer', true, 1),
--   ('<question-id>', 'Wrong answer', false, 2);
