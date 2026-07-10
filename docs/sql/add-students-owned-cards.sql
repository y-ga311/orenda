-- ガチャで獲得したカード番号一覧（生徒1行・JSON配列）
-- アプリは owned_card_nos を参照してコレクション画面を構築します。

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS owned_card_nos jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.students.owned_card_nos IS
  'ガチャで獲得したカード番号の JSON 配列（1〜99）。重複なし・昇順で保持。';
