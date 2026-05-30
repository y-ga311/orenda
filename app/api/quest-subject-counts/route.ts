import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchQuestSubjectQuestionCounts } from "@/lib/questDb";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const subjectIdsParam = url.searchParams.get("subjectIds")?.trim() ?? "";

  if (!subjectIdsParam) {
    return NextResponse.json(
      { message: "科目IDが指定されていません。" },
      { status: 400 },
    );
  }

  const subjectIds = subjectIdsParam
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (subjectIds.length === 0) {
    return NextResponse.json(
      { message: "科目IDが指定されていません。" },
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

  const { counts, error } = await fetchQuestSubjectQuestionCounts(
    supabase,
    subjectIds,
  );

  if (error) {
    console.error("[quest-subject-counts]", error);
    return NextResponse.json(
      { message: "問題数の取得に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ counts });
}
