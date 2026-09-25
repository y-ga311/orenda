export const classAppFeatureKeys = [
  "timer",
  "quest",
  "record",
  "collection",
  "ranking",
  "mypage",
] as const;

export type ClassAppFeatureKey = (typeof classAppFeatureKeys)[number];

export type ClassAppFeatures = Record<ClassAppFeatureKey, boolean>;

export const DEFAULT_CLASS_APP_FEATURES: ClassAppFeatures = {
  timer: true,
  quest: true,
  record: true,
  collection: true,
  ranking: true,
  mypage: true,
};

/** メニュー・画面と feature key の対応 */
export const MENU_FEATURE_BY_TITLE: Record<string, ClassAppFeatureKey> = {
  学習タイマー: "timer",
  クエスト: "quest",
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
  | "quest";

export function featureKeyForScreen(
  screen: AppScreenForFeature,
): ClassAppFeatureKey | null {
  switch (screen) {
    case "timer":
    case "stopwatch":
      return "timer";
    case "quest":
      return "quest";
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
