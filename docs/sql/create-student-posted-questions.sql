-- 学生投稿問題（４択）といいね
-- 学生アプリの「投稿問題」メニューから投稿・挑戦する。

CREATE TABLE IF NOT EXISTS public.student_posted_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_gakusei_id text NOT NULL,
  subject_id text NOT NULL,
  body text NOT NULL,
  choice_1 text NOT NULL,
  choice_2 text NOT NULL,
  choice_3 text NOT NULL,
  choice_4 text NOT NULL,
  correct_index smallint NOT NULL,
  explanation text NOT NULL DEFAULT '',
  like_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_posted_questions_correct_index_check
    CHECK (correct_index >= 0 AND correct_index <= 3),
  CONSTRAINT student_posted_questions_like_count_check
    CHECK (like_count >= 0),
  CONSTRAINT student_posted_questions_subject_id_check
    CHECK (char_length(btrim(subject_id)) >= 1 AND char_length(subject_id) <= 40),
  CONSTRAINT student_posted_questions_body_check
    CHECK (char_length(btrim(body)) >= 1 AND char_length(body) <= 800),
  CONSTRAINT student_posted_questions_choice_1_check
    CHECK (char_length(btrim(choice_1)) >= 1 AND char_length(choice_1) <= 200),
  CONSTRAINT student_posted_questions_choice_2_check
    CHECK (char_length(btrim(choice_2)) >= 1 AND char_length(choice_2) <= 200),
  CONSTRAINT student_posted_questions_choice_3_check
    CHECK (char_length(btrim(choice_3)) >= 1 AND char_length(choice_3) <= 200),
  CONSTRAINT student_posted_questions_choice_4_check
    CHECK (char_length(btrim(choice_4)) >= 1 AND char_length(choice_4) <= 200)
);

CREATE INDEX IF NOT EXISTS student_posted_questions_active_created_idx
  ON public.student_posted_questions (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS student_posted_questions_active_likes_idx
  ON public.student_posted_questions (is_active, like_count DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS student_posted_questions_author_idx
  ON public.student_posted_questions (author_gakusei_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_posted_questions_active_subject_idx
  ON public.student_posted_questions (is_active, subject_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.student_posted_question_likes (
  question_id uuid NOT NULL
    REFERENCES public.student_posted_questions (id) ON DELETE CASCADE,
  gakusei_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, gakusei_id)
);

CREATE INDEX IF NOT EXISTS student_posted_question_likes_gakusei_idx
  ON public.student_posted_question_likes (gakusei_id, created_at DESC);

-- いいね解除→再いいねでのポイント重複付与を防ぐ台帳（1投稿者×1いいねユーザーあたり1回）
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

COMMENT ON TABLE public.student_posted_questions IS
  '学生が投稿した４択問題。is_active=false で非表示。';

COMMENT ON TABLE public.student_posted_question_likes IS
  '学生投稿問題へのいいね（1人1問題あたり現在のいいね状態）。';

COMMENT ON TABLE public.student_posted_question_like_rewards IS
  '投稿問題いいね報酬の付与履歴。解除後の再いいねではポイントを再付与しない。';

COMMENT ON COLUMN public.student_posted_questions.like_count IS
  'いいね数の非正規化カウンタ。likes テーブルと同期させる。';

COMMENT ON COLUMN public.student_posted_questions.correct_index IS
  '正解の選択肢 index（0〜3 = 選択肢1〜4）。';

COMMENT ON COLUMN public.student_posted_questions.subject_id IS
  '科目ID（kaibou / seiri 等。クエスト科目と同じキー）。';
