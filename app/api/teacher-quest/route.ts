import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  fetchActiveTeacherQuestList,
  fetchTeacherQuestSessionById,
} from "@/lib/teacherQuestDb";
import { fetchCompletedTeacherQuestIds, hasCompletedTeacherQuest } from "@/lib/teacherQuestCompletions";
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

  const { quests, error } = await fetchActiveTeacherQuestList(supabase, studentId);

  if (error) {
    console.error("[teacher-quest] GET:", error);
    return NextResponse.json({ message: error }, { status: 500 });
  }

  return NextResponse.json({
    available: quests.length > 0,
    quests,
    questCount: quests.length,
  });
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

  const body = (await request.json().catch(() => null)) as {
    questId?: unknown;
  } | null;
  const questId = typeof body?.questId === "string" ? body.questId.trim() : "";

  if (!questId) {
    return NextResponse.json(
      { message: "教員クエストが指定されていません。" },
      { status: 400 },
    );
  }

  const { session, error } = await fetchTeacherQuestSessionById(supabase, questId);

  if (error) {
    console.error("[teacher-quest] POST:", error);
    const status = error.includes("利用できません") ? 404 : 500;
    return NextResponse.json({ message: error }, { status });
  }

  if (!session) {
    return NextResponse.json(
      { message: "現在利用できる教員クエストはありません。" },
      { status: 404 },
    );
  }

  const { ids: completedIds, error: completedError } =
    await fetchCompletedTeacherQuestIds(supabase, studentId);

  if (completedError) {
    console.error("[teacher-quest] POST completed:", completedError);
    return NextResponse.json({ message: completedError }, { status: 500 });
  }

  if (hasCompletedTeacherQuest(completedIds, questId)) {
    return NextResponse.json(
      { message: "この教員クエストはすでにクリア済みです。" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    quest: session.quest,
    questions: session.questions,
    questionCount: session.questionCount,
  });
}
