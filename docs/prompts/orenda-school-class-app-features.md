# OrendaSchool 実装プロンプト：クラス別・学生アプリメニューON/OFF＋表示順

以下をそのまま OrendaSchool リポジトリの Cursor / Chat に貼り付けて実装してください。

---

## 依頼内容

共有 Supabase 上の `class_app_features` を、教員向け管理画面からクラス単位で編集できるようにしてください。  
学生アプリ（Orenda）はログイン時にこの設定を読み、**メニューの表示/非表示**と**ホームメニュー上からの表示順**を制御します。  
**OrendaSchool 側は「一覧・編集・保存」のみ**で十分です（学生アプリ側の表示ロジックは実装済み）。

## 前提

- Orenda と OrendaSchool は **同じ Supabase プロジェクト**を使う
- 学生のクラス名は `students.class`（text）
- 本設定のキーは `class_app_features.class_name`（text, PK）
- **`students.class` と `class_name` は完全一致**させる（前後空白に注意）
- 行が無いクラスは、Orenda 側で **全機能 ON・既定の表示順** 扱い
- テーブル DDL:
  - 新規: Orenda の `docs/sql/create-class-app-features.sql`
  - 既存テーブルに並び順だけ追加: Orenda の `docs/sql/add-class-app-features-menu-order.sql`
  - 未実行なら先に Supabase で実行する

## テーブル仕様

```sql
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
  menu_order jsonb NOT NULL DEFAULT '[
    "timer",
    "quest",
    "record",
    "collection",
    "ranking",
    "mypage"
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
```

### `features`（ON/OFF）

| key | 学生アプリのメニュー名 | 影響範囲（参考） |
|---|---|---|
| `timer` | 学習タイマー | タイマー画面・ストップウォッチ |
| `quest` | クエスト | 問題クエスト一式 |
| `record` | 勉強時間 | 学習時間の振り返り |
| `collection` | コレクション | カード / ガチャ / メダル |
| `ranking` | 交流 | 勉強時間ランキング |
| `mypage` | マイページ | プロフィール編集など |

- 値は **boolean のみ**（`true` = 表示、`false` = 非表示）
- 未知キーは無視、欠落キーは Orenda 側で `true` 扱い
- 保存時は **6キーすべてを明示的に送る**こと

### `menu_order`（表示順）★追加

- **feature key の JSON 配列**（上から順）
- 既定: `["timer","quest","record","collection","ranking","mypage"]`
- 例（クエストを最上段）: `["quest","timer","record","collection","ranking","mypage"]`
- 保存時は **6キーすべてを重複なく含める**こと
- Orenda 側の挙動:
  - 未知キーは無視
  - 欠落キーは既定順で末尾に補完
  - OFF（`features` が false）の項目は並び順に関係なく非表示
- 下部ナビの並びは今回スコープ外（ホームメニューのみ）

### upsert 例

```sql
INSERT INTO public.class_app_features (class_name, features, menu_order, updated_by)
VALUES (
  '1年A',
  '{"timer":true,"quest":true,"record":true,"collection":false,"ranking":false,"mypage":true}'::jsonb,
  '["quest","timer","record","mypage","collection","ranking"]'::jsonb,
  'teacher@example.com'
)
ON CONFLICT (class_name) DO UPDATE
SET features = EXCLUDED.features,
    menu_order = EXCLUDED.menu_order,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
```

## UI 要件

1. **クラス選択**
   - 既存のクラス一覧があるならそれを使う
   - 無ければ `students.class` の DISTINCT、または国家試験日程など既存のクラス名マスタと揃える
   - 表示名と保存する `class_name` は同一文字列

2. **機能トグル（ON/OFF）**
   - 上記6項目をトグル（スイッチ / チェックボックス）
   - ラベルは教員向けに日本語（学習タイマー / クエスト / 勉強時間 / コレクション / 交流 / マイページ）
   - 初期表示:
     - DBに行があればその `features`
     - 無ければデフォルト全 `true`

3. **表示順の編集（必須）**
   - ドラッグ&ドロップ、上下ボタン、番号入力など、既存UIに合う方法で並び替え可能にする
   - 表示ラベルは日本語、保存値は feature key（`timer` 等）
   - OFFの項目も並び順リストに含めてよい（学生側では非表示になるだけ）
   - 初期表示:
     - DBに `menu_order` があればそれ
     - 無ければ既定順 `timer → quest → record → collection → ranking → mypage`

4. **保存**
   - upsert（INSERT … ON CONFLICT DO UPDATE）
   - `features` と `menu_order` を **同時に保存**
   - `updated_at = now()`
   - `updated_by` にはログイン中教員の識別子（メール等）
   - 成功/失敗メッセージを出す

5. **配置**
   - 既存の「クラス設定」「アプリ設定」「管理」系画面があればそこに追加
   - 無ければ「学生アプリメニュー設定」のような独立ページで可
   - 権限: 教員/管理者のみ

## API / データアクセス方針

- OrendaSchool の既存パターンに合わせる
- 読み取り: `select class_name, features, menu_order, updated_at from class_app_features where class_name = ?`
- 書き込み: 上記 upsert。`features` と `menu_order` は両方必須
- `menu_order` カラムが無い場合は Orenda の `docs/sql/add-class-app-features-menu-order.sql` を実行するようエラーメッセージを出すと親切
- RLS がある場合は教員が upsert できるポリシーを既存方針に合わせる

## 受け入れ条件

- [ ] クラスを選んで6機能のON/OFFを保存できる
- [ ] クラスを選んでメニューの上からの表示順を変更・保存できる
- [ ] 再表示で `features` / `menu_order` が復元される
- [ ] 未設定クラスは UI 上デフォルト全ON・既定順
- [ ] 保存後、同じクラスの学生が **再ログイン**すると Orenda のメニュー表示と並びが変わる
- [ ] `class_name` が `students.class` と一致しないと効かないことを注意できると望ましい

## やらないこと

- Orenda（学生アプリ）のコード変更（並び順対応は実装済み）
- メニュー以外の機能制限（API強制拒否など）は今回スコープ外
- 機能キーの追加・リネーム（Orenda と同期が必要なため、勝手に変えない）
- 下部ナビの並び替え（ホームメニューのみ）

## 補足（Orenda 側の挙動）

- ログインレスポンス:
  - `student.appFeatures` … ON/OFF
  - `student.menuOrder` … 表示順配列
- OFFのメニューはホームに出ない。下部ナビも ON/OFF は同様に隠す（並びは固定）
- 無効画面にいる場合はメニューへ戻す
- テーブル未作成・取得失敗時はログイン自体は成功し、全ON・既定順扱い
- `menu_order` カラム未追加時もログインは成功し、既定順になる（`features` だけ読める場合は ON/OFF のみ反映）

---

以上を、OrendaSchool の既存UI・認証・Supabaseアクセスパターンに合わせて実装してください。
