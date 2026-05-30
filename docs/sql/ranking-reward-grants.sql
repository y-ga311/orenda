-- 学習ランキング1位報酬の付与履歴（二重付与防止）
-- 週間: 月曜 0:00 JST 起算の先週1位へ 500pt
-- 月間: 先月1位へ 1000pt

CREATE TABLE IF NOT EXISTS public.ranking_reward_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL,
  period_key text NOT NULL,
  gakusei_id text NOT NULL,
  rank integer NOT NULL DEFAULT 1,
  points_awarded integer NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ranking_reward_grants_period_type_check
    CHECK (period_type IN ('week', 'month')),
  CONSTRAINT ranking_reward_grants_points_awarded_check
    CHECK (points_awarded >= 0),
  CONSTRAINT ranking_reward_grants_unique_period_student
    UNIQUE (period_type, period_key, gakusei_id)
);

CREATE INDEX IF NOT EXISTS ranking_reward_grants_period_idx
  ON public.ranking_reward_grants (period_type, period_key);

CREATE INDEX IF NOT EXISTS ranking_reward_grants_gakusei_idx
  ON public.ranking_reward_grants (gakusei_id, granted_at DESC);

COMMENT ON TABLE public.ranking_reward_grants IS
  '学習ランキング1位へのガチャpt付与履歴。__none__ は1位不在の締め済み期間。';
