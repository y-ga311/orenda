-- Supabase / PostgreSQL: students にガチャポイント残高カラムを追加する例
-- アプリはカラム名 gacha_points を参照します。

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gacha_points integer NOT NULL DEFAULT 0;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_gacha_points_non_negative;

ALTER TABLE public.students
  ADD CONSTRAINT students_gacha_points_non_negative
  CHECK (gacha_points >= 0);

COMMENT ON COLUMN public.students.gacha_points IS '現在のガチャポイント残高';
