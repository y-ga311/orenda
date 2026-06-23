-- 4択問題に国家試験の出典（第○回・問番号）を追加
-- quest_questions テーブルに適用

ALTER TABLE public.quest_questions
  ADD COLUMN IF NOT EXISTS national_exam_round integer;

ALTER TABLE public.quest_questions
  ADD COLUMN IF NOT EXISTS national_exam_question_no integer;

COMMENT ON COLUMN public.quest_questions.national_exam_round IS '国家試験の回数（例: 115 = 第115回）';
COMMENT ON COLUMN public.quest_questions.national_exam_question_no IS '国家試験の問番号（例: 42 = 問42）';

ALTER TABLE public.quest_questions
  DROP CONSTRAINT IF EXISTS quest_questions_national_exam_round_check;

ALTER TABLE public.quest_questions
  ADD CONSTRAINT quest_questions_national_exam_round_check
  CHECK (national_exam_round IS NULL OR national_exam_round > 0);

ALTER TABLE public.quest_questions
  DROP CONSTRAINT IF EXISTS quest_questions_national_exam_question_no_check;

ALTER TABLE public.quest_questions
  ADD CONSTRAINT quest_questions_national_exam_question_no_check
  CHECK (national_exam_question_no IS NULL OR national_exam_question_no > 0);

ALTER TABLE public.quest_questions
  DROP CONSTRAINT IF EXISTS quest_questions_national_exam_pair_check;

ALTER TABLE public.quest_questions
  ADD CONSTRAINT quest_questions_national_exam_pair_check
  CHECK (
    (national_exam_round IS NULL AND national_exam_question_no IS NULL)
    OR (national_exam_round IS NOT NULL AND national_exam_question_no IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS quest_questions_national_exam_idx
  ON public.quest_questions (national_exam_round, national_exam_question_no)
  WHERE national_exam_round IS NOT NULL;

-- 復習クエスト用ビューにも出典カラムを含める（update-quest-review-items-latest-answer.sql と同等）
CREATE OR REPLACE VIEW public.quest_review_items AS
WITH ranked_answers AS (
  SELECT
    aa.id AS answer_id,
    a.gakusei_id,
    a.completed_at,
    aa.question_id,
    aa.selected_index,
    aa.is_correct,
    aa.answered_at,
    ROW_NUMBER() OVER (
      PARTITION BY a.gakusei_id, aa.question_id
      ORDER BY aa.answered_at DESC, aa.question_number DESC, aa.id DESC
    ) AS recency_rank
  FROM public.quest_attempt_answers aa
  JOIN public.quest_attempts a ON a.id = aa.attempt_id
),
latest_wrong AS (
  SELECT *
  FROM ranked_answers
  WHERE recency_rank = 1
    AND is_correct = false
)
SELECT
  lw.answer_id,
  lw.gakusei_id,
  lw.completed_at,
  q.id AS question_id,
  q.subject_id,
  q.subcategory_id,
  q.body,
  q.choice_1,
  q.choice_2,
  q.choice_3,
  q.choice_4,
  q.correct_index,
  q.explanation,
  q.national_exam_round,
  q.national_exam_question_no,
  lw.selected_index,
  lw.answered_at
FROM latest_wrong lw
JOIN public.quest_questions q ON q.id = lw.question_id
WHERE q.is_active = true;
