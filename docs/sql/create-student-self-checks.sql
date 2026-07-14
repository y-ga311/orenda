-- 月次セルフチェック結果テーブル
-- PHQ-9（うつ）/ GAD-7（不安）/ PSQI簡易版（睡眠）/ レジリエンス指標 の4スケールを毎月1回記録する

CREATE TABLE IF NOT EXISTS public.student_self_checks (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gakusei_id    text        NOT NULL,
  year_month    text        NOT NULL, -- 'YYYY-MM' 形式（例: 2026-07）

  phq9_answers     jsonb   NOT NULL DEFAULT '[]'::jsonb,  -- [0,1,2,...] 9要素
  phq9_score       integer NOT NULL DEFAULT 0,            -- 合計 0〜27

  gad7_answers     jsonb   NOT NULL DEFAULT '[]'::jsonb,  -- 7要素
  gad7_score       integer NOT NULL DEFAULT 0,            -- 合計 0〜21

  psqi_answers     jsonb   NOT NULL DEFAULT '[]'::jsonb,  -- 5要素（簡易版・0〜3）
  psqi_score       integer NOT NULL DEFAULT 0,            -- 合計 0〜15

  resilience_answers jsonb NOT NULL DEFAULT '[]'::jsonb,  -- 8要素（1〜5）
  resilience_score   integer NOT NULL DEFAULT 0,          -- 合計 8〜40

  completed_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT student_self_checks_uq UNIQUE (gakusei_id, year_month)
);

COMMENT ON TABLE  public.student_self_checks IS '月次セルフチェック結果（PHQ-9 / GAD-7 / PSQI簡易版 / レジリエンス指標）';
COMMENT ON COLUMN public.student_self_checks.year_month IS 'チェック実施月 YYYY-MM';
COMMENT ON COLUMN public.student_self_checks.phq9_score IS 'PHQ-9 合計スコア 0〜27（10以上で中等度以上のうつ症状）';
COMMENT ON COLUMN public.student_self_checks.gad7_score IS 'GAD-7 合計スコア 0〜21（10以上で中等度以上の不安症状）';
COMMENT ON COLUMN public.student_self_checks.psqi_score IS 'PSQI簡易版 合計スコア 0〜15（5以上で睡眠に問題）';
COMMENT ON COLUMN public.student_self_checks.resilience_score IS 'レジリエンス指標 合計スコア 8〜40（24以上で中程度以上）';

-- インデックス
CREATE INDEX IF NOT EXISTS idx_ssc_gakusei_id  ON public.student_self_checks (gakusei_id);
CREATE INDEX IF NOT EXISTS idx_ssc_year_month  ON public.student_self_checks (year_month);
CREATE INDEX IF NOT EXISTS idx_ssc_completed_at ON public.student_self_checks (completed_at DESC);

-- RLS 有効化（service_role は RLS をバイパスするため、アプリ・教員ポータル双方から読み書き可能）
ALTER TABLE public.student_self_checks ENABLE ROW LEVEL SECURITY;
