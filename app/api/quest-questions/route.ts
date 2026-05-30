import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  countQuestQuestionsForSubcategories,
  fetchQuestSessionQuestions,
} from "@/lib/questDb";
import {
  getDefaultQuestQuestionCount,
  getSelectableQuestQuestionCounts,
  normalizeSelectedQuestQuestionCount,
} from "@/lib/questSubcategories";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type QuestQuestionsRequestBody = {
  subjectId?: unknown;
  subcategoryIds?: unknown;
  questionCount?: unknown;
};

function parseSubcategoryIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
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
    | QuestQuestionsRequestBody
    | null;
  const subjectId =
    typeof body?.subjectId === "string" ? body.subjectId.trim() : "";
  const subcategoryIds = parseSubcategoryIds(body?.subcategoryIds);
  const requestedCount =
    typeof body?.questionCount === "number" ? body.questionCount : 0;

  if (!subjectId) {
    return NextResponse.json(
      { message: "科目IDが指定されていません。" },
      { status: 400 },
    );
  }

  if (subcategoryIds.length === 0) {
    return NextResponse.json(
      { message: "中分類を1つ以上選んでください。" },
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

  const availableCount = await countQuestQuestionsForSubcategories(
    supabase,
    subjectId,
    subcategoryIds,
  );

  if (availableCount === 0) {
    return NextResponse.json(
      { message: "選択した中分類に問題が登録されていません。" },
      { status: 404 },
    );
  }

  const questionCount = normalizeSelectedQuestQuestionCount(
    availableCount,
    requestedCount > 0
      ? requestedCount
      : getDefaultQuestQuestionCount(availableCount),
  );

  const selectableCounts = getSelectableQuestQuestionCounts(availableCount);

  if (!selectableCounts.includes(questionCount)) {
    return NextResponse.json(
      { message: "選択した問題数が登録問題数を超えています。" },
      { status: 400 },
    );
  }

  const { questions, error } = await fetchQuestSessionQuestions(
    supabase,
    subjectId,
    subcategoryIds,
    questionCount,
  );

  if (error) {
    console.error("[quest-questions]", error);
    return NextResponse.json(
      { message: error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    questions,
    questionCount: questions.length,
    availableCount,
  });
}
