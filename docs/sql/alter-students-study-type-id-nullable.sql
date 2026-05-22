-- 既存環境向け: study_type_id を NULL 許容に変更し、全学生を未登録（NULL）にリセット
-- add-students-study-type-id.sql 実行済みで NOT NULL DEFAULT 1 になっている場合に使用

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_study_type_id_valid;

ALTER TABLE public.students
  ALTER COLUMN study_type_id DROP DEFAULT;

ALTER TABLE public.students
  ALTER COLUMN study_type_id DROP NOT NULL;

ALTER TABLE public.students
  ADD CONSTRAINT students_study_type_id_valid
  CHECK (study_type_id IS NULL OR study_type_id BETWEEN 1 AND 6);

UPDATE public.students
  SET study_type_id = NULL;

COMMENT ON COLUMN public.students.study_type_id IS '得意な勉強タイプ（1〜6。NULL = 未登録。type1.png〜type6.png に対応）';
