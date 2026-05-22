-- students: 得意な勉強タイプ（1〜6。NULL = 未登録）

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS study_type_id smallint;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_study_type_id_valid;

ALTER TABLE public.students
  ADD CONSTRAINT students_study_type_id_valid
  CHECK (study_type_id IS NULL OR study_type_id BETWEEN 1 AND 6);

COMMENT ON COLUMN public.students.study_type_id IS '得意な勉強タイプ（1〜6。NULL = 未登録。type1.png〜type6.png に対応）';
