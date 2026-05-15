# ログインボタンとポップアップ

## 重要：Pencil（`.pen`）ではボタンは「動きません」

`pencil-home.pen` は**見た目のデザインファイル**です。  
**クリックでポップアップを開く**ようなインタラクションは **Pencil 上では実装できません**（コードやイベントがありません）。

- ホームの **`Login Button`（`kzs9a`）** … `button.png` ＋「ログイン」テキストの**見た目だけ**
- **`Login Popup Overlay`（`tNBTM`）** … 通常は `enabled: false` で非表示。デザイン確認時だけ `true` にして表示

---

## ボタン＋ポップアップの「動く」実装（推奨）

リポジトリ **直下**に用意しています。

### 方法 A（いちばん簡単）

ターミナルで **Orenda フォルダ**に移動してから：

```bash
python3 run_home_demo.py
```

- ブラウザが **`http://127.0.0.1:8765/home-interactive.html`** を開きます
- 下部の **ログイン** をクリック／タップすると **ポップアップ**が開きます
- 終了するときはターミナルで **Enter**

### 方法 B（手動でサーバー）

```bash
cd /path/to/Orenda
python3 -m http.server 8765
```

ブラウザで `http://127.0.0.1:8765/home-interactive.html` を開く。

> **`file://` で HTML だけ開く**と、ブラウザによっては画像がブロックされることがあります。**必ずローカルサーバー経由**で開いてください。

---

## ファイル一覧

| ファイル | 説明 |
|----------|------|
| `home-interactive.html` | ホーム画面＋クリックでログインモーダル（画像は `source-images/`） |
| `run_home_demo.py` | 上記を確実に動かすためのサーバー＋ブラウザ起動 |
| `demo/home-login-interactive.html` | 旧配置（`../source-images/`）。**代わりにルートの `home-interactive.html` を使うことを推奨** |

---

## アプリ（Flutter / iOS / Android）に載せるとき

1. 画面下部に `button.png` と「ログイン」テキストを `Stack` で重ねる  
2. `onTap` / `onPressed` でモーダルまたは別画面を表示  
3. フォームの見た目は `tNBTM` 以下のノードを参照  
