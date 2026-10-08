import type { SupabaseClient } from "@supabase/supabase-js";

export const MOCK_EXAM_SUBJECTS = [
  { key: "medical_overview", label: "医療概論" },
  { key: "public_health", label: "衛生学・公衆衛生学" },
  { key: "related_laws", label: "関係法規" },
  { key: "anatomy", label: "解剖学" },
  { key: "physiology", label: "生理学" },
  { key: "pathology", label: "病理学" },
  { key: "clinical_medicine_overview", label: "臨床医学総論" },
  { key: "clinical_medicine_detail", label: "臨床医学各論" },
  { key: "clinical_medicine_detail_total", label: "臨床医学各論（総合）" },
  { key: "rehabilitation", label: "リハビリテーション医学" },
  { key: "oriental_medicine_overview", label: "東洋医学概論" },
  { key: "meridian_points", label: "経絡経穴概論" },
  { key: "oriental_medicine_clinical", label: "東洋医学臨床論" },
  { key: "oriental_medicine_clinical_general", label: "東洋医学臨床論（総合）" },
  { key: "acupuncture_theory", label: "はり理論" },
  { key: "moxibustion_theory", label: "きゅう理論" },
] as const;

export type MockExamSubjectKey = (typeof MOCK_EXAM_SUBJECTS)[number]["key"];

const ACUPUNCTURE_ONLY: MockExamSubjectKey = "acupuncture_theory";
const MOXIBUSTION_ONLY: MockExamSubjectKey = "moxibustion_theory";

type SubjectScoreMap = Partial<Record<MockExamSubjectKey, number | null>>;

export type MockExamSubjectResult = {
  key: MockExamSubjectKey;
  label: string;
  correct: number | null;
  total: number | null;
  percent: number | null;
  display: string;
};

export type MockExamLicenseTotal = {
  correct: number;
  total: number;
  percent: number | null;
  display: string;
  passed: boolean | null;
};

export type MockExamDetail = {
  testName: string;
  testDate: string | null;
  testDateLabel: string | null;
  subjects: MockExamSubjectResult[];
  averagePercent: number | null;
  acupuncture: MockExamLicenseTotal;
  moxibustion: MockExamLicenseTotal;
};

export type MockExamListItem = {
  testName: string;
  testDate: string | null;
  testDateLabel: string | null;
};

function asNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readSubjectMap(row: Record<string, unknown>): SubjectScoreMap {
  const map: SubjectScoreMap = {};
  for (const subject of MOCK_EXAM_SUBJECTS) {
    map[subject.key] = asNumberOrNull(row[subject.key]);
  }
  return map;
}

export function formatMockExamDateLabel(testDate: string | null): string | null {
  if (!testDate) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(testDate.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) {
    return null;
  }

  return `${year}年${month}月${day}日`;
}

function formatScoreDisplay(
  correct: number | null,
  total: number | null,
  percent: number | null,
): string {
  if (correct == null || total == null || total <= 0 || percent == null) {
    return "-";
  }
  return `${correct}/${total}（${percent}%）`;
}

function calcSubjectPercent(
  correct: number | null,
  total: number | null,
): number | null {
  if (correct == null || total == null || total <= 0) {
    return null;
  }
  return Math.round((correct / total) * 100);
}

function buildSubjectResults(
  scoreMap: SubjectScoreMap,
  countMap: SubjectScoreMap,
): MockExamSubjectResult[] {
  return MOCK_EXAM_SUBJECTS.map((subject) => {
    const correct = scoreMap[subject.key] ?? null;
    const total = countMap[subject.key] ?? null;
    const percent = calcSubjectPercent(correct, total);

    return {
      key: subject.key,
      label: subject.label,
      correct,
      total,
      percent,
      display: formatScoreDisplay(correct, total, percent),
    };
  });
}

function calcAveragePercent(subjects: MockExamSubjectResult[]): number | null {
  const taken = subjects.filter((subject) => subject.percent != null);
  if (taken.length === 0) {
    return null;
  }

  const sum = taken.reduce((acc, subject) => acc + (subject.percent ?? 0), 0);
  return Math.round(sum / taken.length);
}

function calcLicenseTotal(
  scoreMap: SubjectScoreMap,
  countMap: SubjectScoreMap,
  mode: "acupuncture" | "moxibustion",
): MockExamLicenseTotal {
  let correctSum = 0;
  let totalSum = 0;

  for (const subject of MOCK_EXAM_SUBJECTS) {
    const key = subject.key;
    if (mode === "acupuncture" && key === MOXIBUSTION_ONLY) {
      continue;
    }
    if (mode === "moxibustion" && key === ACUPUNCTURE_ONLY) {
      continue;
    }

    const total = countMap[key] ?? null;
    if (total == null || total < 1) {
      continue;
    }

    const correct = scoreMap[key];
    correctSum += correct == null ? 0 : correct;
    totalSum += total;
  }

  if (totalSum <= 0) {
    return {
      correct: 0,
      total: 0,
      percent: null,
      display: "-",
      passed: null,
    };
  }

  const percent = Math.round((correctSum / totalSum) * 100);
  return {
    correct: correctSum,
    total: totalSum,
    percent,
    display: `${correctSum}/${totalSum}（${percent}%）`,
    passed: percent >= 60,
  };
}

function trimTestName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildMockExamDetail(
  scoreRow: Record<string, unknown>,
  countRow: Record<string, unknown> | null,
): MockExamDetail {
  const testName = trimTestName(scoreRow.test_name);
  const testDate =
    typeof countRow?.test_date === "string" && countRow.test_date.trim()
      ? countRow.test_date.trim()
      : null;
  const scoreMap = readSubjectMap(scoreRow);
  const countMap = countRow ? readSubjectMap(countRow) : {};
  const subjects = buildSubjectResults(scoreMap, countMap);

  return {
    testName,
    testDate,
    testDateLabel: formatMockExamDateLabel(testDate),
    subjects,
    averagePercent: calcAveragePercent(subjects),
    acupuncture: calcLicenseTotal(scoreMap, countMap, "acupuncture"),
    moxibustion: calcLicenseTotal(scoreMap, countMap, "moxibustion"),
  };
}

export async function fetchMyMockExamGrades(
  supabase: SupabaseClient,
  gakuseiId: string,
): Promise<{ exams: MockExamDetail[]; error: string | null }> {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("gakusei_id", gakuseiId)
    .maybeSingle();

  if (studentError) {
    return { exams: [], error: studentError.message };
  }

  const studentPk = (student as { id?: unknown } | null)?.id;
  if (typeof studentPk !== "number" && typeof studentPk !== "string") {
    return { exams: [], error: "学生情報が見つかりません。" };
  }

  const [{ data: scores, error: scoresError }, { data: counts, error: countsError }] =
    await Promise.all([
      supabase
        .from("test_scores")
        .select("*")
        .eq("student_id", studentPk)
        .ilike("test_name", "%模擬試験%")
        .order("test_name", { ascending: true }),
      supabase
        .from("question_counts")
        .select("*")
        .ilike("test_name", "%模擬試験%"),
    ]);

  if (scoresError) {
    return { exams: [], error: scoresError.message };
  }

  if (countsError) {
    return { exams: [], error: countsError.message };
  }

  const countByName = new Map<string, Record<string, unknown>>();
  for (const row of (counts ?? []) as Record<string, unknown>[]) {
    const name = trimTestName(row.test_name);
    if (!name) {
      continue;
    }
    countByName.set(name, row);
  }

  const exams = ((scores ?? []) as Record<string, unknown>[])
    .map((scoreRow) => {
      const name = trimTestName(scoreRow.test_name);
      if (!name) {
        return null;
      }
      return buildMockExamDetail(scoreRow, countByName.get(name) ?? null);
    })
    .filter((exam): exam is MockExamDetail => exam !== null);

  exams.sort((a, b) => {
    if (a.testDate && b.testDate) {
      return b.testDate.localeCompare(a.testDate);
    }
    if (a.testDate && !b.testDate) {
      return -1;
    }
    if (!a.testDate && b.testDate) {
      return 1;
    }
    return a.testName.localeCompare(b.testName, "ja");
  });

  return { exams, error: null };
}
