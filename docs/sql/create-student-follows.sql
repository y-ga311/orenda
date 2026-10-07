-- 学生同士のフォロー関係（相互フォローで相手の学習詳細を公開）
-- follower が followee をフォローする片方向エッジ。
-- 相互 = (A→B) と (B→A) の両方が存在する状態。

CREATE TABLE IF NOT EXISTS public.student_follows (
  follower_gakusei_id text NOT NULL,
  followee_gakusei_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_gakusei_id, followee_gakusei_id),
  CONSTRAINT student_follows_no_self_check
    CHECK (follower_gakusei_id <> followee_gakusei_id)
);

CREATE INDEX IF NOT EXISTS student_follows_followee_idx
  ON public.student_follows (followee_gakusei_id, created_at DESC);

CREATE INDEX IF NOT EXISTS student_follows_follower_idx
  ON public.student_follows (follower_gakusei_id, created_at DESC);

COMMENT ON TABLE public.student_follows IS
  '学生フォロー。相互フォロー時のみ相手の科目別勉強時間・メダル・カードを閲覧可。';

COMMENT ON COLUMN public.student_follows.follower_gakusei_id IS
  'フォローした側の students.gakusei_id';

COMMENT ON COLUMN public.student_follows.followee_gakusei_id IS
  'フォローされた側の students.gakusei_id';
