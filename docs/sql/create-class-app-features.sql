-- クラス単位の学生アプリメニュー表示設定（ON/OFF + 表示順）
-- OrendaSchool 側で編集し、Orenda（学生アプリ）がログイン時に参照する。
-- students.class と class_name を一致させること。

CREATE TABLE IF NOT EXISTS public.class_app_features (
  class_name text PRIMARY KEY,
  features jsonb NOT NULL DEFAULT '{
    "timer": true,
    "quest": true,
    "student_quest": true,
    "tsubotomy": true,
    "grades": true,
    "portfolio": true,
    "links": true,
    "record": true,
    "collection": true,
    "ranking": true,
    "mypage": true
  }'::jsonb,
  menu_order jsonb NOT NULL DEFAULT '[
    "timer",
    "quest",
    "student_quest",
    "tsubotomy",
    "grades",
    "portfolio",
    "links",
    "record",
    "collection",
    "ranking",
    "mypage"
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

-- 既存テーブル向け（CREATE TABLE IF NOT EXISTS では追加されない）
ALTER TABLE public.class_app_features
  ADD COLUMN IF NOT EXISTS menu_order jsonb;

UPDATE public.class_app_features
SET menu_order = '[
  "timer",
  "quest",
  "student_quest",
  "tsubotomy",
  "grades",
  "portfolio",
  "links",
  "record",
  "collection",
  "ranking",
  "mypage"
]'::jsonb
WHERE menu_order IS NULL;

ALTER TABLE public.class_app_features
  ALTER COLUMN menu_order SET DEFAULT '[
    "timer",
    "quest",
    "student_quest",
    "tsubotomy",
    "grades",
    "portfolio",
    "links",
    "record",
    "collection",
    "ranking",
    "mypage"
  ]'::jsonb;

ALTER TABLE public.class_app_features
  ALTER COLUMN menu_order SET NOT NULL;

COMMENT ON TABLE public.class_app_features IS
  'クラスごとの学生アプリメニューON/OFFと表示順。未登録クラスはアプリ側で全機能ON・既定順扱い。';

COMMENT ON COLUMN public.class_app_features.class_name IS
  'students.class と同じクラス名文字列';

COMMENT ON COLUMN public.class_app_features.features IS
  '機能フラグ JSON。キー: timer / quest / student_quest / tsubotomy / grades / portfolio / links / record / collection / ranking / mypage';

COMMENT ON COLUMN public.class_app_features.menu_order IS
  'ホームメニューの上からの表示順（feature key の JSON 配列）。欠落キーはアプリ側で末尾に補完。';

-- OrendaSchool からの upsert 例:
-- INSERT INTO public.class_app_features (class_name, features, menu_order, updated_by)
-- VALUES (
--   '1年A',
--   '{"timer":true,"quest":true,"student_quest":true,"tsubotomy":true,"grades":true,"portfolio":true,"links":true,"record":true,"collection":false,"ranking":false,"mypage":true}'::jsonb,
--   '["quest","timer","student_quest","tsubotomy","grades","portfolio","links","record","mypage","collection","ranking"]'::jsonb,
--   'teacher@example.com'
-- )
-- ON CONFLICT (class_name) DO UPDATE
-- SET features = EXCLUDED.features,
--     menu_order = EXCLUDED.menu_order,
--     updated_at = now(),
--     updated_by = EXCLUDED.updated_by;
