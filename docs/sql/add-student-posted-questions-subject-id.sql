-- 投稿問題に科目（subject_id）を追加

ALTER TABLE public.student_posted_questions
  ADD COLUMN IF NOT EXISTS subject_id text;

CREATE INDEX IF NOT EXISTS student_posted_questions_active_subject_idx
  ON public.student_posted_questions (is_active, subject_id, created_at DESC);

COMMENT ON COLUMN public.student_posted_questions.subject_id IS
  '科目ID（kaibou / seiri 等。クエスト科目と同じキー）。既存行は NULL 可。';
