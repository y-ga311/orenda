# OrendaSchool 実装プロンプト：学生アプリメニュー設定の更新（11項目）

以下をそのまま OrendaSchool リポジトリの Cursor / Chat に貼り付けて実装してください。

---

## 依頼内容

学生アプリ（Orenda）のホームメニューが **6項目 → 11項目** に増えたため、教員向けの「学生アプリメニュー設定」（`class_app_features` の ON/OFF＋表示順）を追従させてください。

既存のメニュー設定画面がある場合は **それを修正**。無い場合は新規実装。

OrendaSchool 側は「一覧・編集・保存」のみで十分です（学生アプリ側の表示ロジックは実装済み）。

## 変更点（必読）

### 追加された feature key（5つ）

| key | 学生アプリのメニュー名 | 備考 |
|---|---|---|
| `student_quest` | 投稿問題 | 学生投稿の４択・挑戦・いいね（Orenda実装済み） |
| `tsubotomy` | ツボトミー | 画面未実装・メニュー表示のみ |
| `grades` | 成績 | 自分の模擬試験成績（Orenda実装済み） |
| `portfolio` | ポートフォリオ | 画面未実装・メニュー表示のみ |
| `links` | 各種リンク | 学生ポータル等の外部リンク一覧（Orenda実装済み） |

### ラベル変更（key は据え置き）

| key | 旧ラベル | 新ラベル |
|---|---|---|
| `quest` | クエスト | **４択クエスト** |
| `student_quest` | 学生作成問題（仮） | **投稿問題** |
| `grades` | 成績確認（仮） | **成績** |

※ DB の key は変更しない。UI の日本語ラベルだけ合わせる。

### 全11キー（この並びが既定の表示順）

1. `timer` … 学習タイマー  
2. `quest` … ４択クエスト  
3. `student_quest` … 投稿問題  
4. `tsubotomy` … ツボトミー  
5. `grades` … 成績  
6. `portfolio` … ポートフォリオ  
7. `links` … 各種リンク  
8. `record` … 勉強時間  
9. `collection` … コレクション  
10. `ranking` … 交流  
11. `mypage` … マイページ  

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
- **既存 DB の `features` / `menu_order` に新キーが無くても可**  
  Orenda 側は欠落キーを `true`・既定順末尾に補完する。  
  ただし OrendaSchool の保存時は **11キーすべてを明示して書き込む**こと。

## テーブル仕様

```sql
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
```

### `features`（ON/OFF）

| key | 学生アプリのメニュー名 | 影響範囲（参考） |
|---|---|---|
| `timer` | 学習タイマー | タイマー画面・ストップウォッチ |
| `quest` | ４択クエスト | 過去問・教員クエスト |
| `student_quest` | 投稿問題 | 投稿・挑戦・いいね画面（Orenda実装済み） |
| `tsubotomy` | ツボトミー | （画面未実装・メニュー表示のみ） |
| `grades` | 成績 | 自分の模擬試験成績（Orenda実装済み） |
| `portfolio` | ポートフォリオ | （画面未実装・メニュー表示のみ） |
| `links` | 各種リンク | 外部リンク一覧画面（URLはOrenda側固定） |
| `record` | 勉強時間 | 学習時間の振り返り |
| `collection` | コレクション | カード / ガチャ / メダル |
| `ranking` | 交流 | 勉強時間ランキング |
| `mypage` | マイページ | プロフィール編集など |

- 値は **boolean のみ**（`true` = 表示、`false` = 非表示）
- 未知キーは無視、欠落キーは Orenda 側で `true` 扱い
- 保存時は **11キーすべてを明示的に送る**こと

### `menu_order`（表示順）

- **feature key の JSON 配列**（上から順）
- 既定: `["timer","quest","student_quest","tsubotomy","grades","portfolio","links","record","collection","ranking","mypage"]`
- 例（４択クエストを最上段）: `["quest","timer","student_quest","tsubotomy","grades","portfolio","links","record","collection","ranking","mypage"]`
- 保存時は **11キーすべてを重複なく含める**こと
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
  '{"timer":true,"quest":true,"student_quest":true,"tsubotomy":true,"grades":true,"portfolio":true,"links":true,"record":true,"collection":false,"ranking":false,"mypage":true}'::jsonb,
  '["quest","timer","student_quest","tsubotomy","grades","portfolio","links","record","mypage","collection","ranking"]'::jsonb,
  'teacher@example.com'
)
ON CONFLICT (class_name) DO UPDATE
SET features = EXCLUDED.features,
    menu_order = EXCLUDED.menu_order,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
```

## UI 修正要件（既存画面がある場合）

1. **機能トグルを11項目に拡張**
   - 追加: 投稿問題 / ツボトミー / 成績 / ポートフォリオ / 各種リンク
   - ラベル変更: クエスト → **４択クエスト**
   - （旧ラベルがある場合）学生作成問題 → **投稿問題**、成績確認 → **成績**
   - DB 読込時に新キーが欠落していたら UI 上は `true` として表示し、保存時に11キー揃えて書く

2. **表示順リストも11項目に拡張**
   - 既存 `menu_order` に新キーが無い場合は、既定順の位置（`quest` の直後に `student_quest` → `tsubotomy` → `grades` → `portfolio` → `links`）へ挿入して表示
   - または既定順末尾に足してもよいが、**保存時は11キーすべてを重複なく含める**

3. **定数・型・バリデーション**
   - feature key 配列を6/9/10固定にしている箇所があれば11に更新
   - 保存前バリデーション: 11キーすべて存在・boolean・`menu_order` は11キーの順列

4. **クラス選択・保存・権限・配置**は既存どおりでよい  
   - upsert で `features` と `menu_order` を同時保存
   - `updated_by` にログイン教員の識別子

## UI 要件（新規実装の場合）

1. **クラス選択**（既存クラス一覧 or `students.class` の DISTINCT）
2. **11項目の ON/OFF トグル**
3. **11項目の表示順編集**（DnD / 上下ボタンなど）
4. **保存**（上記 upsert）
5. 教員/管理者のみアクセス可

## API / データアクセス方針

- OrendaSchool の既存パターンに合わせる
- 読み取り: `select class_name, features, menu_order, updated_at from class_app_features where class_name = ?`
- 書き込み: 上記 upsert。`features` と `menu_order` は両方必須（11キー）
- `menu_order` カラムが無い場合は Orenda の `docs/sql/add-class-app-features-menu-order.sql` を実行するよう案内
- RLS がある場合は教員が upsert できるポリシーを既存方針に合わせる

## 受け入れ条件

- [ ] トグルが11項目（学習タイマー / ４択クエスト / 投稿問題 / ツボトミー / 成績 / ポートフォリオ / 各種リンク / 勉強時間 / コレクション / 交流 / マイページ）
- [ ] 旧「クエスト」ラベルが「４択クエスト」になっている（key は `quest` のまま）
- [ ] 表示順も11項目で並び替え・保存できる
- [ ] 既存DBに新キーが無いクラスでも、編集画面で新5項目が表示され、保存すると11キーが書き込まれる
- [ ] 再表示で `features` / `menu_order` が復元される
- [ ] 保存後、同じクラスの学生が **再ログイン**すると Orenda のメニュー表示と並びが変わる

## やらないこと

- Orenda（学生アプリ）のコード変更
- メニュー以外の機能制限（API強制拒否など）
- feature key の独自追加・リネーム（Orenda と同期が必要なため勝手に変えない）
- 下部ナビの並び替え（ホームメニューのみ）
- ツボトミー / ポートフォリオの画面本体の実装（メニュー表示制御だけでよい）
- 投稿問題・成績・各種リンクの中身（Orenda側実装済み。メニューON/OFF・並びのみ）

## 補足（Orenda 側の挙動）

- ログインレスポンス:
  - `student.appFeatures` … ON/OFF
  - `student.menuOrder` … 表示順配列
- OFFのメニューはホームに出ない。下部ナビも ON/OFF は同様に隠す（並びは固定）
- 欠落キーは Orenda 側で `true`・既定順末尾に補完
- テーブル未作成・取得失敗時はログイン成功＋全ON・既定順

---

以上を、OrendaSchool の既存UI・認証・Supabaseアクセスパターンに合わせて実装（または既存メニュー設定画面を修正）してください。
