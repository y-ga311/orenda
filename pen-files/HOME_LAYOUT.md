# ホーム画面（`pencil-home.pen`）のサイズを手動で変える

ホーム（`JHI7R`）は **`layout: "vertical"`**（ロゴ → キャラ `fill_container` → ログイン）。

## Pencil と Cursor で見た目が変わらないとき

- Pencil で **`pencil-home.pen` を閉じてから開き直す**、または **ファイルを再読み込み**してください。  
- Cursor だけで JSON を直した場合、Pencil が別バッファを開いていると同期ずれします。  
- 白い全画面の **`Frame`（`bi8Au`）** は **`enabled: false`** にしてあります（誤って前面に出さないため）。

## バランスの取り方（大きさ × 見切れ）

| 方針 | 向いていること |
|------|----------------|
| **`fit` + 大きい枠** | 見切れなし。ロゴは **縦枠を大きく**すると `fit` でも大きく表示（横長ロゴ向け）。 |
| **`fill` + トリミング済みPNG** | 枠いっぱいに拡大。**余白や空を先に画像側で切る**と、人物が切れにくい。 |

**キャラ**は **`character01-tight.png`**（元 `character01.png` から上 120px を捨て、**1024×1180** に切り出し）＋ **`fill`** を使用。  
足元が気になる場合は `sips` の `--cropOffset` を変えるか、`wb5Ua` を **`character01.png` + `fit`** に戻してください。

```bash
cd source-images
sips -c 1180 1024 --cropOffset 120 0 character01.png -o character01-tight.png
```

## Pencil で変える

1. `pencil-home.pen` を開く  
2. **`Character`（`wb5Ua`）** で `fill` / `fit` や画像 URL を調整  
3. **`Logo`（`FkYkD`）** の **高さ** を上げると `fit` でもロゴが大きくなる  

- **`fill`** … 大きいが端が切れやすい  
- **`fit`** … 全体が入るが、枠が小さいと小さく見えやすい

## JSON で変える（`Home Screen` / `JHI7R` の子）

| 名前 | ID | 主なプロパティ |
|------|-----|----------------|
| Logo Header | `WP8YJ` | `height`（ロゴ枠全体） |
| Logo | `FkYkD` | `height` ＋ `fill.mode`（横長ロゴは **`fill`** ＋ **縦を幅÷1.5 付近** で幅いっぱいに近い） |
| Character | `wb5Ua` | `width` / `height` は `fill_container`、`fill.url` で画像パス |
| Login Button | `kzs9a` | `height`（例: 54） |

`JHI7R` の **`padding`**（左右を広げるとキャラ枠が狭くなり、`fill` 時の**拡大感**が出ます）。

## 画面全体のサイズ

`Home Screen`（`JHI7R`）と外枠 `bi8Au` は **390×844** です。

## それでも人物が小さいとき

`character01.png` の**キャンバス内で人物が小さい／周りの透明余白が多い**と、枠を最大にしても小さく見えます。画像を**トリミング**するか、人物を大きくした素材に差し替えてください。
