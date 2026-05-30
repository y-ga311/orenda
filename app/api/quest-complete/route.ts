import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { awardStudentGachaPoints } from "@/lib/awardStudentGachaPoints";
import { GACHA_POINTS_PER_QUEST_CORRECT } from "@/lib/gachaConstants";
import { getQuestAvailableQuestionCountForSubcategories } from "@/lib/questQuestionInventory";
import { getSelectableQuestQuestionCounts } from "@/lib/questSubcategories";

export const runtime = "nodejs";

type QuestCompleteRequestBody = {
  correctCount?: unknown;
  questionCount?: unknown;
  subjectId?: unknown;
  subcategoryId?: unknown;
  subcategoryIds?: unknown;
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

  if (
    questionCount !== null &&
    typeof body?.subjectId === "string"
  ) {
    const subcategoryIds = parseSubcategoryIds(body);

    if (subcategoryIds.length > 0) {
      const availableCount = getQuestAvailableQuestionCountForSubcategories(
        body.subjectId,
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
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const pointsEarned = correctCount * GACHA_POINTS_PER_QUEST_CORRECT;
  const result = await awardStudentGachaPoints(supabase, studentId, pointsEarned);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    gachaPoints: result.gachaPoints,
    pointsEarned: result.pointsEarned,
  });
}
