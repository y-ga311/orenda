import { DEFAULT_QUEST_AVAILABLE_COUNT } from "@/lib/questSubcategories";

/**
 * 科目×中分類ごとの登録問題数（Supabase 連携前の静的データ）。
 * 全14科目のどの中分類でも、5問未満など少数問題になり得る。
 * DB 連携後はこのマップの代わりに問題テーブルから件数を取得する。
 */
const questAvailableQuestionCountBySubcategory: Record<string, number> = {
  "eisei:eisei-meaning": 3,
};

export function getQuestSubcategoryKey(
  subjectId: string,
  subcategoryId: string,
): string {
  return `${subjectId}:${subcategoryId}`;
}

/** 科目・中分類に紐づく登録問題数（未登録の中分類は DEFAULT_QUEST_AVAILABLE_COUNT） */
export function getQuestAvailableQuestionCount(
  subjectId: string,
  subcategoryId: string | null,
): number {
  if (!subcategoryId) {
    return DEFAULT_QUEST_AVAILABLE_COUNT;
  }

  const key = getQuestSubcategoryKey(subjectId, subcategoryId);
  const registered = questAvailableQuestionCountBySubcategory[key];

  if (registered !== undefined) {
    return Math.max(0, Math.floor(registered));
  }

  return DEFAULT_QUEST_AVAILABLE_COUNT;
}

/** 複数中分類を選んだときの登録問題数合計 */
export function getQuestAvailableQuestionCountForSubcategories(
  subjectId: string,
  subcategoryIds: string[],
): number {
  return subcategoryIds.reduce(
    (total, subcategoryId) =>
      total + getQuestAvailableQuestionCount(subjectId, subcategoryId),
    0,
  );
}

/** 登録問題数を上書き・追加する（将来の管理画面や DB 同期用） */
export function setQuestAvailableQuestionCount(
  subjectId: string,
  subcategoryId: string,
  count: number,
): void {
  questAvailableQuestionCountBySubcategory[
    getQuestSubcategoryKey(subjectId, subcategoryId)
  ] = Math.max(0, Math.floor(count));
}
