import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  countQuestReviewQuestions,
  fetchQuestReviewSessionQuestions,
} from "@/lib/questDb";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { count, error } = await countQuestReviewQuestions(supabase, studentId);

  if (error) {
    console.error("[quest-review] count:", error);
    return NextResponse.json(
      { message: "復習問題数の取得に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ count });
}

export async function POST() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { questions, error } = await fetchQuestReviewSessionQuestions(
    supabase,
    studentId,
  );

  if (error) {
    console.error("[quest-review] questions:", error);
    const status = error === "復習する問題がありません。" ? 404 : 500;
    return NextResponse.json({ message: error }, { status });
  }

  return NextResponse.json({
    questions,
    questionCount: questions.length,
  });
}
