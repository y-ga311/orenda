/** 経穴カードの表示メタ（画像再生成・UI用） */
export type KeiketsuCardMeta = {
  cardNo: number;
  keiketsu: string;
  name: string;
  hp: number;
  type: string;
};

const ICONIC_CARD_NOS = new Set([
  9, 12, 20, 22, 30, 33, 38, 55, 58, 60, 61, 68, 75, 81, 84, 89, 93, 95, 96, 97, 98, 99,
]);

export function calcKeiketsuCardHp(cardNo: number): number {
  const base = 80 + ((cardNo - 1) % 6) * 10;
  const climb = Math.floor((cardNo - 1) / 25) * 10;
  let hp = base + climb;
  if (ICONIC_CARD_NOS.has(cardNo)) hp += 20;
  return Math.min(hp, 170);
}

export const keiketsuCardMeta: Record<number, KeiketsuCardMeta> = {
  1: { cardNo: 1, keiketsu: '中府', name: 'ガードン', hp: 80, type: '鋼' },
  2: { cardNo: 2, keiketsu: '尺沢', name: 'エルベイ', hp: 90, type: '鋼' },
  3: { cardNo: 3, keiketsu: '孔最', name: 'クラックル', hp: 100, type: '鋼' },
  4: { cardNo: 4, keiketsu: '列欠', name: 'ブリッジュ', hp: 110, type: '鋼' },
  5: { cardNo: 5, keiketsu: '太淵', name: 'パルスン', hp: 120, type: '鋼' },
  6: { cardNo: 6, keiketsu: '魚際', name: 'ヒラギョ', hp: 130, type: '鋼' },
  7: { cardNo: 7, keiketsu: '少商', name: 'チップル', hp: 80, type: '鋼' },
  8: { cardNo: 8, keiketsu: '商陽', name: 'サシビ', hp: 90, type: '鋼' },
  9: { cardNo: 9, keiketsu: '合谷', name: 'タニパンチ', hp: 120, type: 'かくとう' },
  10: { cardNo: 10, keiketsu: '偏歴', name: 'ポストマ', hp: 110, type: '鋼' },
  11: { cardNo: 11, keiketsu: '手三里', name: 'マイルズ', hp: 120, type: 'かくとう' },
  12: { cardNo: 12, keiketsu: '曲池', name: 'イケガード', hp: 150, type: 'かくとう' },
  13: { cardNo: 13, keiketsu: '肩髃', name: 'カタランプ', hp: 80, type: 'かくとう' },
  14: { cardNo: 14, keiketsu: '迎香', name: 'カオルン', hp: 90, type: 'フェアリー' },
  15: { cardNo: 15, keiketsu: '承泣', name: 'ウルウル', hp: 100, type: 'ノーマル' },
  16: { cardNo: 16, keiketsu: '四白', name: 'ヨントウ', hp: 110, type: 'ノーマル' },
  17: { cardNo: 17, keiketsu: '地倉', name: 'ニコモグ', hp: 120, type: 'くさ' },
  18: { cardNo: 18, keiketsu: '頬車', name: 'ギアワン', hp: 130, type: 'かくとう' },
  19: { cardNo: 19, keiketsu: '下関', name: 'トビラゴ', hp: 80, type: 'かくとう' },
  20: { cardNo: 20, keiketsu: '天枢', name: 'コマジン', hp: 110, type: 'かくとう' },
  21: { cardNo: 21, keiketsu: '梁丘', name: 'オカイノ', hp: 100, type: 'かくとう' },
  22: { cardNo: 22, keiketsu: '足三里', name: 'ゲンキロウ', hp: 130, type: 'かくとう' },
  23: { cardNo: 23, keiketsu: '上巨虚', name: 'キャニオン', hp: 120, type: 'かくとう' },
  24: { cardNo: 24, keiketsu: '下巨虚', name: 'ランタロ', hp: 130, type: 'ほのお' },
  25: { cardNo: 25, keiketsu: '豊隆', name: 'カエルム', hp: 80, type: 'ノーマル' },
  26: { cardNo: 26, keiketsu: '内庭', name: 'ニワリス', hp: 100, type: 'くさ' },
  27: { cardNo: 27, keiketsu: '隠白', name: 'シロバナ', hp: 110, type: 'くさ' },
  28: { cardNo: 28, keiketsu: '太白', name: 'ホシマル', hp: 120, type: 'くさ' },
  29: { cardNo: 29, keiketsu: '公孫', name: 'オヤコネ', hp: 130, type: 'くさ' },
  30: { cardNo: 30, keiketsu: '三陰交', name: 'ミツアミ', hp: 160, type: 'くさ' },
  31: { cardNo: 31, keiketsu: '地機', name: 'オリバッタ', hp: 90, type: 'くさ' },
  32: { cardNo: 32, keiketsu: '陰陵泉', name: 'シケガメ', hp: 100, type: 'みず' },
  33: { cardNo: 33, keiketsu: '血海', name: 'バラクラ', hp: 130, type: 'フェアリー' },
  34: { cardNo: 34, keiketsu: '大横', name: 'オビヘビ', hp: 120, type: 'くさ' },
  35: { cardNo: 35, keiketsu: '少海', name: 'ヒジクラ', hp: 130, type: 'ほのお' },
  36: { cardNo: 36, keiketsu: '通里', name: 'コエポン', hp: 140, type: 'ほのお' },
  37: { cardNo: 37, keiketsu: '陰郄', name: 'アセベール', hp: 90, type: 'ゴースト' },
  38: { cardNo: 38, keiketsu: '神門', name: 'ココロン', hp: 120, type: 'エスパー' },
  39: { cardNo: 39, keiketsu: '少衝', name: 'ピピュン', hp: 110, type: 'ほのお' },
  40: { cardNo: 40, keiketsu: '少沢', name: 'ヌマピヨ', hp: 120, type: 'ほのお' },
  41: { cardNo: 41, keiketsu: '後渓', name: 'セナヤモ', hp: 130, type: 'ドラゴン' },
  42: { cardNo: 42, keiketsu: '養老', name: 'メガンロ', hp: 140, type: 'ノーマル' },
  43: { cardNo: 43, keiketsu: '小海', name: 'ヒジガニ', hp: 90, type: 'ほのお' },
  44: { cardNo: 44, keiketsu: '天宗', name: 'コウチュ', hp: 100, type: 'ほのお' },
  45: { cardNo: 45, keiketsu: '聴宮', name: 'ミミパラ', hp: 110, type: 'エスパー' },
  46: { cardNo: 46, keiketsu: '睛明', name: 'メダマメ', hp: 120, type: 'みず' },
  47: { cardNo: 47, keiketsu: '攢竹', name: 'マユパン', hp: 130, type: 'くさ' },
  48: { cardNo: 48, keiketsu: '天柱', name: 'クビゴリ', hp: 140, type: 'かくとう' },
  49: { cardNo: 49, keiketsu: '風門', name: 'カゼガモ', hp: 90, type: 'ひこう' },
  50: { cardNo: 50, keiketsu: '肺俞', name: 'ハタオ', hp: 100, type: '鋼' },
  51: { cardNo: 51, keiketsu: '心俞', name: 'ハートニャ', hp: 120, type: 'ほのお' },
  52: { cardNo: 52, keiketsu: '膈俞', name: 'ハシヒツジ', hp: 130, type: 'フェアリー' },
  53: { cardNo: 53, keiketsu: '肝俞', name: 'キノジカ', hp: 140, type: 'くさ' },
  54: { cardNo: 54, keiketsu: '脾俞', name: 'ムスビガメ', hp: 150, type: 'くさ' },
  55: { cardNo: 55, keiketsu: '腎俞', name: 'イズミセイ', hp: 120, type: 'みず' },
  56: { cardNo: 56, keiketsu: '大腸俞', name: 'ダクトアリ', hp: 110, type: '鋼' },
  57: { cardNo: 57, keiketsu: '次髎', name: 'ツキガ', hp: 120, type: 'みず' },
  58: { cardNo: 58, keiketsu: '委中', name: 'タキウソ', hp: 150, type: 'みず' },
  59: { cardNo: 59, keiketsu: '承山', name: 'ハギドン', hp: 140, type: 'かくとう' },
  60: { cardNo: 60, keiketsu: '涌泉', name: 'フンセンス', hp: 170, type: 'みず' },
  61: { cardNo: 61, keiketsu: '太渓', name: 'クレーゴン', hp: 120, type: 'みず' },
  62: { cardNo: 62, keiketsu: '照海', name: 'ルナクラ', hp: 110, type: 'みず' },
  63: { cardNo: 63, keiketsu: '復溜', name: 'ウズナギ', hp: 120, type: 'みず' },
  64: { cardNo: 64, keiketsu: '交信', name: 'フウサギ', hp: 130, type: 'みず' },
  65: { cardNo: 65, keiketsu: '陰谷', name: 'カゲジカ', hp: 140, type: 'みず' },
  66: { cardNo: 66, keiketsu: '曲沢', name: 'ヌマパー', hp: 150, type: 'エスパー' },
  67: { cardNo: 67, keiketsu: '郄門', name: 'キュウワン', hp: 100, type: 'エスパー' },
  68: { cardNo: 68, keiketsu: '内関', name: 'ウチガド', hp: 130, type: 'エスパー' },
  69: { cardNo: 69, keiketsu: '大陵', name: 'スフィン', hp: 120, type: 'エスパー' },
  70: { cardNo: 70, keiketsu: '労宮', name: 'ヒラビト', hp: 130, type: 'エスパー' },
  71: { cardNo: 71, keiketsu: '中衝', name: 'チュコア', hp: 140, type: 'エスパー' },
  72: { cardNo: 72, keiketsu: '関衝', name: 'カプチュ', hp: 150, type: 'かみなり' },
  73: { cardNo: 73, keiketsu: '中渚', name: 'シマケロ', hp: 100, type: 'かみなり' },
  74: { cardNo: 74, keiketsu: '陽池', name: 'ヨウゲラ', hp: 110, type: 'かみなり' },
  75: { cardNo: 75, keiketsu: '外関', name: 'ソトガド', hp: 140, type: 'かみなり' },
  76: { cardNo: 76, keiketsu: '支溝', name: 'ドリリル', hp: 140, type: 'かみなり' },
  77: { cardNo: 77, keiketsu: '翳風', name: 'シズカモ', hp: 150, type: 'ノーマル' },
  78: { cardNo: 78, keiketsu: '絲竹空', name: 'カイコシ', hp: 160, type: 'エスパー' },
  79: { cardNo: 79, keiketsu: '瞳子髎', name: 'サイトカ', hp: 110, type: 'ひこう' },
  80: { cardNo: 80, keiketsu: '陽白', name: 'ヒカリメェ', hp: 120, type: 'ノーマル' },
  81: { cardNo: 81, keiketsu: '風池', name: 'ウズフル', hp: 150, type: 'ひこう' },
  82: { cardNo: 82, keiketsu: '肩井', name: 'イドナマ', hp: 140, type: 'くさ' },
  83: { cardNo: 83, keiketsu: '環跳', name: 'リングル', hp: 150, type: 'かくとう' },
  84: { cardNo: 84, keiketsu: '陽陵泉', name: 'スジリュ', hp: 170, type: 'くさ' },
  85: { cardNo: 85, keiketsu: '懸鐘', name: 'カネルン', hp: 110, type: 'エスパー' },
  86: { cardNo: 86, keiketsu: '足臨泣', name: 'オビリュ', hp: 120, type: 'ドラゴン' },
  87: { cardNo: 87, keiketsu: '大敦', name: 'オヤブロ', hp: 130, type: 'くさ' },
  88: { cardNo: 88, keiketsu: '行間', name: 'クールマ', hp: 140, type: 'くさ' },
  89: { cardNo: 89, keiketsu: '太衝', name: 'コンリュウ', hp: 170, type: 'ドラゴン' },
  90: { cardNo: 90, keiketsu: '曲泉', name: 'センジカ', hp: 160, type: 'くさ' },
  91: { cardNo: 91, keiketsu: '期門', name: 'キジモン', hp: 110, type: 'くさ' },
  92: { cardNo: 92, keiketsu: '中極', name: 'ジクリス', hp: 120, type: 'フェアリー' },
  93: { cardNo: 93, keiketsu: '関元', name: 'ゲンコブ', hp: 150, type: 'フェアリー' },
  94: { cardNo: 94, keiketsu: '気海', name: 'キクジラ', hp: 140, type: 'フェアリー' },
  95: { cardNo: 95, keiketsu: '中脘', name: 'ナベダヌ', hp: 170, type: 'フェアリー' },
  96: { cardNo: 96, keiketsu: '膻中', name: 'ヒロバト', hp: 170, type: 'フェアリー' },
  97: { cardNo: 97, keiketsu: '大椎', name: 'ヨウノト', hp: 130, type: 'ドラゴン' },
  98: { cardNo: 98, keiketsu: '百会', name: 'カンリュウ', hp: 140, type: 'ドラゴン' },
  99: { cardNo: 99, keiketsu: '印堂', name: 'インキツネ', hp: 150, type: 'エスパー' },
};

export function getKeiketsuCardMeta(cardNo: number): KeiketsuCardMeta | null {
  return keiketsuCardMeta[cardNo] ?? null;
}
