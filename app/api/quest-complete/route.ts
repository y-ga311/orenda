import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { awardStudentGachaPoints } from "@/lib/awardStudentGachaPoints";
import { GACHA_POINTS_PER_QUEST_CORRECT, GACHA_POINTS_PER_TEACHER_QUEST_CORRECT } from "@/lib/gachaConstants";
import { countQuestQuestionsForSubcategories } from "@/lib/questDb";
import type { QuestAnswerLogEntry } from "@/lib/questDbTypes";
import {
  getSelectableQuestQuestionCounts,
} from "@/lib/questSubcategories";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type QuestCompleteRequestBody = {
  correctCount?: unknown;
  questionCount?: unknown;
  subjectId?: unknown;
  subcategoryId?: unknown;
  subcategoryIds?: unknown;
  questScope?: unknown;
  teacherQuestId?: unknown;
  answers?: unknown;
};

function parseSubcategoryIds(body: QuestCompleteRequestBody | null): string[] {
  if (Array.isArray(body?.subcategoryIds)) {
    return body.subcategoryIds.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
  }

  if (typeof body?.subcategoryId === "string" && body.subcategoryId.length > 0) {
    return [body.subcategoryId];
  }

  return [];
}

function parseAnswerLog(value: unknown): QuestAnswerLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as {
      questionId?: unknown;
      questionNumber?: unknown;
      selectedIndex?: unknown;
      isCorrect?: unknown;
    };

    if (
      typeof record.questionId !== "string" ||
      typeof record.questionNumber !== "number" ||
      typeof record.selectedIndex !== "number" ||
      typeof record.isCorrect !== "boolean"
    ) {
      return [];
    }

    return [
      {
        questionId: record.questionId,
        questionNumber: record.questionNumber,
        selectedIndex: record.selectedIndex,
        isCorrect: record.isCorrect,
      },
    ];
  });
}

function parseQuestScope(value: unknown): "subject" | "teacher" | "review" {
  if (value === "teacher") {
    return "teacher";
  }

  if (value === "review") {
    return "review";
  }

  return "subject";
}

function buildAttemptAnswerRows(
  attemptId: string,
  answers: QuestAnswerLogEntry[],
) {
  const baseTime = Date.now();

  return answers.map((entry, index) => ({
    attempt_id: attemptId,
    question_id: entry.questionId,
    question_number: entry.questionNumber,
    selected_index: entry.selectedIndex,
    is_correct: entry.isCorrect,
    answered_at: new Date(baseTime + index).toISOString(),
  }));
}

async function saveQuestAttemptHistory(
  supabase: NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>,
  params: {
    studentId: string;
    questScope: "subject" | "teacher" | "review";
    subjectId: string | null;
    subcategoryIds: string[];
    questionCount: number;
    correctCount: number;
    pointsEarned: number;
    answers: QuestAnswerLogEntry[];
  },
): Promise<void> {
  const { data: attemptRow, error: attemptError } = await supabase
    .from("quest_attempts")
    .insert({
      gakusei_id: params.studentId,
      quest_scope: params.questScope,
      subject_id: params.subjectId,
      subcategory_ids: params.subcategoryIds,
      question_count: params.questionCount,
      correct_count: params.correctCount,
      points_earned: params.pointsEarned,
    })
    .select("id")
    .maybeSingle();

  if (attemptError) {
    console.error("[quest-complete] quest_attempts:", attemptError.message);
    return;
  }

  if (!attemptRow?.id || params.answers.length === 0) {
    return;
  }

  const { error: answersError } = await supabase
    .from("quest_attempt_answers")
    .insert(buildAttemptAnswerRows(attemptRow.id, params.answers));

  if (answersError) {
    console.error("[quest-complete] quest_attempt_answers:", answersError.message);
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | QuestCompleteRequestBody
    | null;
  const correctCount =
    typeof body?.correctCount === "number" ? body.correctCount : -1;
  const questionCount =
    typeof body?.questionCount === "number" ? body.questionCount : null;
  const questScope = parseQuestScope(body?.questScope);
  const teacherQuestId =
    typeof body?.teacherQuestId === "string" ? body.teacherQuestId.trim() : null;
  const subjectId =
    typeof body?.subjectId === "string" ? body.subjectId.trim() : null;
  const subcategoryIds = parseSubcategoryIds(body);
  const answers = parseAnswerLog(body?.answers);

  if (!Number.isInteger(correctCount) || correctCount < 0) {
    return NextResponse.json(
      { message: "正解数が不正です。" },
      { status: 400 },
    );
  }

  if (
    questionCount !== null &&
    (!Number.isInteger(questionCount) ||
      questionCount < 1 ||
      correctCount > questionCount)
  ) {
    return NextResponse.json(
      { message: "問題数が不正です。" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  if (
    questScope === "subject" &&
    questionCount !== null &&
    subjectId &&
    subcategoryIds.length > 0
  ) {
    const availableCount = await countQuestQuestionsForSubcategories(
      supabase,
      subjectId,
      subcategoryIds,
    );
    const selectableCounts = getSelectableQuestQuestionCounts(availableCount);

    if (
      !selectableCounts.includes(questionCount) ||
      questionCount > availableCount
    ) {
      return NextResponse.json(
        { message: "選択した問題数が登録問題数を超えています。" },
        { status: 400 },
      );
    }
  }

  const pointsPerCorrect =
    questScope === "teacher"
      ? GACHA_POINTS_PER_TEACHER_QUEST_CORRECT
      : GACHA_POINTS_PER_QUEST_CORRECT;
  const pointsEarned = correctCount * pointsPerCorrect;
  const result = await awardStudentGachaPoints(supabase, studentId, pointsEarned);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  if (questScope === "subject" && subjectId && questionCount !== null) {
    await saveQuestAttemptHistory(supabase, {
      studentId,
      questScope: "subject",
      subjectId,
      subcategoryIds,
      questionCount,
      correctCount,
      pointsEarned,
      answers,
    });
  }

  if (questScope === "review" && questionCount !== null && answers.length > 0) {
    await saveQuestAttemptHistory(supabase, {
      studentId,
      questScope: "review",
      subjectId: null,
      subcategoryIds: [],
      questionCount,
      correctCount,
      pointsEarned,
      answers,
    });
  }

  if (
    questScope === "teacher" &&
    teacherQuestId &&
    questionCount !== null &&
    answers.length > 0
  ) {
    await saveQuestAttemptHistory(supabase, {
      studentId,
      questScope: "teacher",
      subjectId: null,
      subcategoryIds: [teacherQuestId],
      questionCount,
      correctCount,
      pointsEarned,
      answers,
    });
  }

  return NextResponse.json({
    ok: true,
    gachaPoints: result.gachaPoints,
    pointsEarned: result.pointsEarned,
  });
}
