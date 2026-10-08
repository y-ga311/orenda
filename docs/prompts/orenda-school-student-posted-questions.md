# OrendaSchool 実装プロンプト：学生投稿問題の管理・閲覧

以下をそのまま OrendaSchool リポジトリの Cursor / Chat に貼り付けて実装してください。

---

## 依頼内容

学生アプリ（Orenda）の「投稿問題」機能で、学生が投稿した４択問題・いいね・いいね報酬の状況を、**教員向けに一覧・詳細・非表示（モデレーション）** できるようにしてください。

Orenda（学生側）の投稿・挑戦・いいねは実装済みです。OrendaSchool は **同じ Supabase を参照して管理 UI を追加**すれば足ります。

## 前提

- Orenda と OrendaSchool は **同じ Supabase プロジェクト**を使う
- 学生識別子は `students.gakusei_id`（text）
- 投稿者表示名は原則 `students.nickname`（空なら「ニックネーム未設定」。氏名の復号は不要・非推奨）
- テーブル DDL（未作成なら Supabase で実行）:
  - Orenda の `docs/sql/create-student-posted-questions.sql`
  - 既存環境に科目カラムだけ無い場合: `docs/sql/add-student-posted-questions-subject-id.sql`
  - いいね報酬台帳だけ無い場合: `docs/sql/add-student-posted-question-like-rewards.sql`
- メニュー ON/OFF の feature key は `student_quest`（`class_app_features`）。今回の画面とは別管理

## 学生アプリ側の仕様（参考）

- 学生は４択問題を投稿できる（科目必須・解説任意）
- 他の学生が挑戦（正誤判定）・いいねできる
- **自分の投稿にはいいね不可**
- いいねが付くと投稿者にガチャ **10pt** 付与
- 同一ユーザーがいいね解除→再いいねしてもポイントは **1回のみ**（報酬台帳で抑止）
- 学生が削除すると `is_active = false`（論理削除）

## テーブル仕様

### `student_posted_questions`（本体）

| カラム | 型 | 説明 |
|---|---|---|
| `id` | uuid PK | 問題ID |
| `author_gakusei_id` | text | 投稿者の `students.gakusei_id` |
| `subject_id` | text | 科目キー（下記マスタ）。既存行は NULL の可能性あり |
| `body` | text | 問題文（最大800） |
| `choice_1`〜`choice_4` | text | 選択肢（各最大200） |
| `correct_index` | smallint | 正解（0〜3 = 選択肢1〜4） |
| `explanation` | text | 解説（空文字可） |
| `like_count` | integer | いいね数（非正規化。表示用） |
| `is_active` | boolean | `true`=公開 / `false`=非表示（削除・モデレーション） |
| `created_at` | timestamptz | 投稿日時 |
| `updated_at` | timestamptz | 更新日時 |

### `student_posted_question_likes`（現在のいいね状態）

| カラム | 型 | 説明 |
|---|---|---|
| `question_id` | uuid | FK → `student_posted_questions.id` |
| `gakusei_id` | text | いいねした学生 |
| `created_at` | timestamptz | いいね日時 |
| PK | `(question_id, gakusei_id)` | 1人1問題あたり現在1件 |

### `student_posted_question_like_rewards`（ポイント付与履歴）

| カラム | 型 | 説明 |
|---|---|---|
| `question_id` | uuid | FK |
| `liker_gakusei_id` | text | いいねした側 |
| `author_gakusei_id` | text | 投稿者（報酬受取側） |
| `points_awarded` | integer | 付与pt（通常10） |
| `created_at` | timestamptz | 初回付与日時 |
| PK | `(question_id, liker_gakusei_id)` | 重複付与防止 |

## 科目マスタ（`subject_id` → 表示名）

学生アプリと同じキーを使うこと。未知キーは「科目未設定」等でフォールバック。

| subject_id | 表示名 |
|---|---|
| `kaibou` | 解剖学 |
| `seiri` | 生理学 |
| `byouri` | 病理学概論 |
| `souron` | 臨床医学総論 |
| `kakuron` | 臨床医学各論 |
| `reha` | リハビリテーション医学 |
| `tougai` | 東洋医学概論 |
| `keiketu` | 経絡経穴概論 |
| `tourin` | 東洋医学臨床論 |
| `hari` | はり理論 |
| `kyu` | きゅう理論 |
| `iryogairon` | 医療概論 |
| `eisei` | 衛生学・公衆衛生学 |
| `kankeihouki` | 関係法規 |

## 実装してほしい画面

### 1. 投稿問題一覧

- パス例: `/admin/posted-questions` など既存管理UIに合わせて配置
- 権限: 教員 / 管理者のみ
- 表示列（例）:
  - 投稿日時
  - 科目
  - 問題文（先頭80文字程度＋全文は詳細へ）
  - 投稿者（nickname / gakusei_id）
  - いいね数（`like_count`）
  - 公開状態（`is_active`）
- フィルタ:
  - 公開のみ / 非表示のみ / すべて
  - 科目（`subject_id`）
  - 投稿者学籍ID or ニックネーム部分一致
  - 期間（任意）
- ソート: 新着（`created_at` DESC）／いいね多い順（`like_count` DESC）
- ページネーション（20〜50件）推奨

### 2. 投稿問題詳細

- 問題文・4選択肢・正解・解説をすべて表示
- 投稿者情報（gakusei_id / nickname / class）
- いいね一覧（任意）: `student_posted_question_likes` を join してニックネーム表示
- いいね報酬履歴（任意）: `student_posted_question_like_rewards`（付与ptの合計も出せるとよい）

### 3. モデレーション（非表示 / 再公開）

- 教員が問題を非表示にする: `is_active = false`、`updated_at = now()`
- 再公開: `is_active = true`
- **物理 DELETE はしない**（いいね・報酬台帳が CASCADE するため）
- 学生アプリは `is_active = true` のみ表示するため、非表示にすると学生側から消える
- 操作ログとして `updated_by` 相当が無い場合は、画面上の操作者表示や既存監査方針に合わせる（必須ではない）

## データ取得クエリ例

### 一覧（公開中・新着）

```sql
SELECT
  q.id,
  q.subject_id,
  q.body,
  q.like_count,
  q.is_active,
  q.created_at,
  q.author_gakusei_id,
  s.nickname,
  s.class
FROM public.student_posted_questions q
LEFT JOIN public.students s
  ON s.gakusei_id = q.author_gakusei_id
WHERE q.is_active = true
ORDER BY q.created_at DESC
LIMIT 50;
```

### 非表示にする

```sql
UPDATE public.student_posted_questions
SET is_active = false,
    updated_at = now()
WHERE id = :question_id;
```

### いいね報酬の合計（投稿者別・任意の集計）

```sql
SELECT
  author_gakusei_id,
  COUNT(*) AS reward_events,
  SUM(points_awarded) AS total_points
FROM public.student_posted_question_like_rewards
GROUP BY author_gakusei_id
ORDER BY total_points DESC;
```

## UI 要件

1. 既存の管理メニューに「投稿問題」または「学生投稿問題」を追加
2. 一覧 → 詳細の導線を明確に
3. 非表示操作は確認ダイアログを出す
4. 正解・解説は教員には見せてよい（学生挑戦時はサーバ採点）
5. 氏名（暗号化 name）は一覧に出さない。nickname / gakusei_id / class で十分

## やらないこと

- Orenda（学生アプリ）のコード変更
- 教員からの新規投稿作成（今回は閲覧・モデレーション中心）
- いいね報酬の手動再付与・取り消し（台帳とガチャ残高の不整合リスク）
- feature key のリネーム（`student_quest` のまま）

## 受け入れ条件

- [ ] 教員が投稿問題一覧を見られる（科目・投稿者・いいね数・公開状態）
- [ ] 科目・公開状態で絞り込める
- [ ] 詳細で問題文・選択肢・正解・解説を確認できる
- [ ] 非表示にすると学生アプリ側の一覧から消える（`is_active=false`）
- [ ] 再公開できる
- [ ] 教員/管理者以外はアクセスできない

## 補足（Orenda 学生側 API・参考）

学生アプリ内部 API（OrendaSchool から呼ぶ必要はない。DB直参照で可）:

| method | path | 用途 |
|---|---|---|
| GET | `/api/posted-questions` | 一覧（`sort` / `mine` / `subject`） |
| POST | `/api/posted-questions` | 投稿 |
| GET | `/api/posted-questions/[id]` | 挑戦用詳細（正解は含めない） |
| POST | `/api/posted-questions/[id]/answer` | 採点 |
| POST | `/api/posted-questions/[id]/like` | いいねトグル＋初回報酬 |
| DELETE | `/api/posted-questions/[id]` | 自分の投稿を論理削除 |

いいね報酬: `GACHA_POINTS_PER_POSTED_QUESTION_LIKE = 10`

---

以上を、OrendaSchool の既存UI・認証・Supabaseアクセスパターンに合わせて実装してください。
