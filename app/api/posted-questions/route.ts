import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createPostedQuestion,
  listPostedQuestions,
  parsePostedQuestionInput,
  type PostedQuestionSort,
} from "@/lib/postedQuestions";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

function parseSort(value: string | null): PostedQuestionSort {
  return value === "popular" ? "popular" : "recent";
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const sort = parseSort(url.searchParams.get("sort"));
  const mineOnly = url.searchParams.get("mine") === "1";

  const { questions, error } = await listPostedQuestions(supabase, {
    currentStudentId: studentId,
    sort,
    mineOnly,
  });

  if (error) {
    console.error("[posted-questions] list:", error);
    return NextResponse.json(
      { message: "投稿問題の取得に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ questions, sort, mineOnly });
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

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parsePostedQuestionInput(body);

  if (parsed.error || !parsed.value) {
    return NextResponse.json(
      { message: parsed.error ?? "入力内容を確認してください。" },
      { status: 400 },
    );
  }

  const { questionId, error } = await createPostedQuestion(
    supabase,
    studentId,
    parsed.value,
  );

  if (error || !questionId) {
    console.error("[posted-questions] create:", error);
    return NextResponse.json(
      { message: "投稿に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ questionId }, { status: 201 });
}
