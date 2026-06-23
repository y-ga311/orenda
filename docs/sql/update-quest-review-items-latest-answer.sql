-- 復習リスト: 各問題の「最新回答」が不正解のものだけ表示
-- 復習クエストで正解した回答を保存するとリストから外れる
-- 前提: quest_attempts / quest_attempt_answers テーブル作成済み

ALTER TABLE public.quest_attempts
  DROP CONSTRAINT IF EXISTS quest_attempts_quest_scope_check;

ALTER TABLE public.quest_attempts
  ADD CONSTRAINT quest_attempts_quest_scope_check
  CHECK (quest_scope IN ('subject', 'teacher', 'review'));

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
