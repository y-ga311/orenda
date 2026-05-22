export const studyTypeIds = [1, 2, 3, 4, 5, 6] as const;

export type StudyTypeId = (typeof studyTypeIds)[number];

export function isStudyTypeId(value: number): value is StudyTypeId {
  return studyTypeIds.includes(value as StudyTypeId);
}

/** DB 値をパース。NULL・未設定・不正値は null（未登録） */
export function parseStudyTypeId(value: unknown): StudyTypeId | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (isStudyTypeId(parsed)) {
    return parsed;
  }

  return null;
}
