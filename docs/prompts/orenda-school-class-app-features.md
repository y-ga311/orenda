# OrendaSchool 実装プロンプト：クラス別・学生アプリメニューON/OFF

以下をそのまま OrendaSchool リポジトリの Cursor / Chat に貼り付けて実装してください。

---

## 依頼内容

共有 Supabase 上の `class_app_features` を、教員向け管理画面からクラス単位で編集できるようにしてください。  
学生アプリ（Orenda）はログイン時にこの設定を読み、メニュー・下部ナビ・画面遷移を制御します。**OrendaSchool 側は「一覧・編集・保存」のみ**で十分です（学生アプリ側の表示ロジックは実装済み）。

## 前提

- Orenda と OrendaSchool は **同じ Supabase プロジェクト**を使う
- 学生のクラス名は `students.class`（text）
- 本設定のキーは `class_app_features.class_name`（text, PK）
- **`students.class` と `class_name` は完全一致**させる（前後空白に注意）
- 行が無いクラスは、Orenda 側で **全機能 ON** 扱い
- テーブル DDL は Orenda リポジトリの `docs/sql/create-class-app-features.sql` にある。未作成なら先に Supabase で実行する

## テーブル仕様（既定）

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
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
```

### `features` JSON キーと学生アプリ上のメニュー対応

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
- 保存時は **6キーすべてを明示的に送る**こと（部分更新でキー欠落を作らない）

### upsert 例

```sql
INSERT INTO public.class_app_features (class_name, features, updated_by)
VALUES (
  '1年A',
  '{"timer":true,"quest":true,"record":true,"collection":false,"ranking":false,"mypage":true}'::jsonb,
  'teacher@example.com'
)
ON CONFLICT (class_name) DO UPDATE
SET features = EXCLUDED.features,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
```

## UI 要件

1. **クラス選択**
   - 既存のクラス一覧があるならそれを使う
   - 無ければ `students.class` の DISTINCT、または国家試験日程など既存のクラス名マスタと揃える
   - 表示名と保存する `class_name` は同一文字列

2. **機能トグル**
   - 上記6項目をトグル（スイッチ / チェックボックス）
   - ラベルは教員向けに日本語（例: 学習タイマー / クエスト / 勉強時間 / コレクション / 交流 / マイページ）
   - 初期表示:
     - DBに行があればその `features`
     - 無ければデフォルト全 `true`（未保存でも UI 上は全ONでよい）

3. **保存**
   - upsert（INSERT … ON CONFLICT DO UPDATE）
   - `updated_at = now()`
   - `updated_by` にはログイン中教員の識別子（メール等、既存の監査方針に合わせる）
   - 成功/失敗メッセージを出す

4. **配置**
   - 既存の「クラス設定」「アプリ設定」「管理」系画面があればそこに追加
   - 無ければ「学生アプリメニュー設定」のような独立ページで可
   - 権限: 教員/管理者のみ（既存の認証・認可に従う）

## API / データアクセス方針

- OrendaSchool の既存パターン（Supabase client / Route Handler / Server Action 等）に合わせる
- 読み取り: `select * from class_app_features where class_name = ?`（またはクラス一覧と left join）
- 書き込み: 上記 upsert。`features` はオブジェクトで6キー必須
- RLS がある場合は、教員が upsert できるポリシーを既存テーブル方針に合わせて追加（service role で書いているならそれに合わせる）

## 受け入れ条件

- [ ] クラスを選んで6機能のON/OFFを保存できる
- [ ] 再表示で保存内容が復元される
- [ ] 未設定クラスは UI 上デフォルト全ON、DB行は任意（保存したときだけ作成でよい）
- [ ] 保存後、同じクラスの学生が **再ログイン**すると Orenda のメニューが切り替わる
- [ ] `class_name` が `students.class` と一致しないと効かないことを UI またはヘルプ文言で注意できると望ましい

## やらないこと

- Orenda（学生アプリ）のコード変更
- メニュー以外の機能制限（API強制拒否など）は今回スコープ外
- 機能キーの追加・リネーム（Orenda と同期が必要なため、勝手に変えない）

## 補足（Orenda 側の挙動）

- ログインレスポンスの `student.appFeatures` で受け取る
- OFFのメニューはホームに出ない。下部ナビも同様に隠す
- 無効画面にいる場合はメニューへ戻す
- テーブル未作成・取得失敗時はログイン自体は成功し、全ON扱い

---

以上を、OrendaSchool の既存UI・認証・Supabaseアクセスパターンに合わせて実装してください。
