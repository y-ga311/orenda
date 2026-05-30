import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchQuestSubcategories } from "@/lib/questDb";
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
  const subjectId = url.searchParams.get("subjectId")?.trim() ?? "";

  if (!subjectId) {
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

  const { subcategories, error } = await fetchQuestSubcategories(
    supabase,
    subjectId,
  );

  if (error) {
    console.error("[quest-subcategories]", error);
    return NextResponse.json(
      { message: "中分類の取得に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ subcategories });
}
