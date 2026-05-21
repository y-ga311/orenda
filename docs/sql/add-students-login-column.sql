-- students: 最終ログイン日時（日本時間基準で「その日初回ログイン」判定に使用）

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS students_login timestamptz;

COMMENT ON COLUMN public.students.students_login IS '最終ログイン日時（UTC保存。日次ボーナスは Asia/Tokyo の暦日で判定）';
