import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchPostedQuestionById } from "@/lib/postedQuestions";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "問題IDが不正です。" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    selectedIndex?: unknown;
  } | null;

  const selectedIndex =
    typeof body?.selectedIndex === "number"
      ? body.selectedIndex
      : typeof body?.selectedIndex === "string"
        ? Number(body.selectedIndex)
        : NaN;

  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex > 3
  ) {
    return NextResponse.json(
      { message: "選択肢が不正です。" },
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

  const { row, error } = await fetchPostedQuestionById(supabase, id);
  if (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ message: "問題が見つかりません。" }, { status: 404 });
  }

  const isCorrect = selectedIndex === row.correct_index;

  return NextResponse.json({
    isCorrect,
    correctIndex: row.correct_index,
    explanation: row.explanation ?? "",
    selectedIndex,
  });
}
