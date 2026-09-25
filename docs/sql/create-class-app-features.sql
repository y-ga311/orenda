-- クラス単位の学生アプリメニュー表示設定
-- OrendaSchool 側で編集し、Orenda（学生アプリ）がログイン時に参照する。
-- students.class と class_name を一致させること。

CREATE TABLE IF NOT EXISTS public.class_app_features (
  class_name text PRIMARY KEY,
  features jsonb NOT NULL DEFAULT '{
    "timer": true,
    "quest": true,
    "record": true,
    "collection": true,
    "ranking": true,
    "mypage": true
  }'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

COMMENT ON TABLE public.class_app_features IS
  'クラスごとの学生アプリメニューON/OFF。未登録クラスはアプリ側で全機能ON扱い。';

COMMENT ON COLUMN public.class_app_features.class_name IS
  'students.class と同じクラス名文字列';

COMMENT ON COLUMN public.class_app_features.features IS
  '機能フラグ JSON。キー: timer / quest / record / collection / ranking / mypage';

-- OrendaSchool からの upsert 例:
-- INSERT INTO public.class_app_features (class_name, features, updated_by)
-- VALUES (
--   '1年A',
--   '{"timer":true,"quest":true,"record":true,"collection":false,"ranking":false,"mypage":true}'::jsonb,
--   'teacher@example.com'
-- )
-- ON CONFLICT (class_name) DO UPDATE
-- SET features = EXCLUDED.features,
--     updated_at = now(),
--     updated_by = EXCLUDED.updated_by;
