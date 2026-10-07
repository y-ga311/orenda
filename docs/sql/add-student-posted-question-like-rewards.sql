-- 既存環境向け: 投稿問題いいね報酬の重複付与防止台帳
-- （create-student-posted-questions.sql を未実行ならそちらを先に実行）

CREATE TABLE IF NOT EXISTS public.student_posted_question_like_rewards (
  question_id uuid NOT NULL
    REFERENCES public.student_posted_questions (id) ON DELETE CASCADE,
  liker_gakusei_id text NOT NULL,
  author_gakusei_id text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, liker_gakusei_id),
  CONSTRAINT student_posted_question_like_rewards_points_check
    CHECK (points_awarded > 0)
);

CREATE INDEX IF NOT EXISTS student_posted_question_like_rewards_author_idx
  ON public.student_posted_question_like_rewards (author_gakusei_id, created_at DESC);

COMMENT ON TABLE public.student_posted_question_like_rewards IS
  '投稿問題いいね報酬の付与履歴。解除後の再いいねではポイントを再付与しない。';
