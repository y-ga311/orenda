-- study_sessions に秒単位の学習時間を追加（科目クエストの短時間解答向け）
-- 既存行は duration_seconds が NULL のまま。アプリは
--   coalesce(duration_seconds, duration_minutes * 60) で集計する。

ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS duration_seconds integer;

ALTER TABLE public.study_sessions
  DROP CONSTRAINT IF EXISTS study_sessions_duration_seconds_non_negative;

ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_duration_seconds_non_negative
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

COMMENT ON COLUMN public.study_sessions.duration_seconds IS
  '学習時間（秒）。科目クエストなど短時間セッション用。NULL の既存行は duration_minutes * 60 として扱う。';
