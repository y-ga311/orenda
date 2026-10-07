export const classAppFeatureKeys = [
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
  "mypage",
] as const;

export type ClassAppFeatureKey = (typeof classAppFeatureKeys)[number];

export type ClassAppFeatures = Record<ClassAppFeatureKey, boolean>;

/** ホームメニューの上からの既定順 */
export const DEFAULT_MENU_ORDER: ClassAppFeatureKey[] = [
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
  "mypage",
];

export const DEFAULT_CLASS_APP_FEATURES: ClassAppFeatures = {
  timer: true,
  quest: true,
  student_quest: true,
  tsubotomy: true,
  grades: true,
  portfolio: true,
  links: true,
  record: true,
  collection: true,
  ranking: true,
  mypage: true,
};

/** メニュー・画面と feature key の対応 */
export const MENU_FEATURE_BY_TITLE: Record<string, ClassAppFeatureKey> = {
  学習タイマー: "timer",
  "４択クエスト": "quest",
  投稿問題: "student_quest",
  ツボトミー: "tsubotomy",
  成績: "grades",
  ポートフォリオ: "portfolio",
  各種リンク: "links",
  勉強時間: "record",
  コレクション: "collection",
  交流: "ranking",
  マイページ: "mypage",
};

export type AppScreenForFeature =
  | "menu"
  | "timer"
  | "stopwatch"
  | "record"
  | "ranking"
  | "collection"
  | "medal"
  | "gacha"
  | "mypage"
  | "quest"
  | "links"
  | "student_quest";

function isClassAppFeatureKey(value: unknown): value is ClassAppFeatureKey {
  return (
    typeof value === "string" &&
    (classAppFeatureKeys as readonly string[]).includes(value)
  );
}

export function featureKeyForScreen(
  screen: AppScreenForFeature,
): ClassAppFeatureKey | null {
  switch (screen) {
    case "timer":
    case "stopwatch":
      return "timer";
    case "quest":
      return "quest";
    case "student_quest":
      return "student_quest";
    case "record":
      return "record";
    case "collection":
    case "medal":
    case "gacha":
      return "collection";
    case "ranking":
      return "ranking";
    case "mypage":
      return "mypage";
    case "links":
      return "links";
    case "menu":
    default:
      return null;
  }
}

export function isFeatureEnabled(
  features: ClassAppFeatures,
  key: ClassAppFeatureKey,
): boolean {
  return features[key] !== false;
}

export function isScreenEnabled(
  features: ClassAppFeatures,
  screen: AppScreenForFeature,
): boolean {
  const key = featureKeyForScreen(screen);
  if (!key) {
    return true;
  }
  return isFeatureEnabled(features, key);
}

/** DB / API の JSON を正規化。欠落キーは true（後方互換で全ON） */
export function parseClassAppFeatures(value: unknown): ClassAppFeatures {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const result = { ...DEFAULT_CLASS_APP_FEATURES };

  for (const key of classAppFeatureKeys) {
    if (typeof source[key] === "boolean") {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * menu_order JSON 配列を正規化。
 * - 未知キーは無視
 * - 重複は先頭のみ採用
 * - 欠落キーは DEFAULT_MENU_ORDER の順で末尾に補完
 */
export function parseMenuOrder(value: unknown): ClassAppFeatureKey[] {
  const seen = new Set<ClassAppFeatureKey>();
  const ordered: ClassAppFeatureKey[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isClassAppFeatureKey(entry) || seen.has(entry)) {
        continue;
      }
      seen.add(entry);
      ordered.push(entry);
    }
  }

  for (const key of DEFAULT_MENU_ORDER) {
    if (!seen.has(key)) {
      ordered.push(key);
    }
  }

  return ordered;
}

/** メニュー項目を feature key の並び順でソート（未知タイトルは末尾） */
export function sortMenuItemsByOrder<T extends { title: string }>(
  items: T[],
  menuOrder: ClassAppFeatureKey[],
): T[] {
  const indexByKey = new Map(
    menuOrder.map((key, index) => [key, index] as const),
  );

  return [...items].sort((a, b) => {
    const keyA = MENU_FEATURE_BY_TITLE[a.title];
    const keyB = MENU_FEATURE_BY_TITLE[b.title];
    const indexA = keyA != null ? (indexByKey.get(keyA) ?? 999) : 999;
    const indexB = keyB != null ? (indexByKey.get(keyB) ?? 999) : 999;
    return indexA - indexB;
  });
}
