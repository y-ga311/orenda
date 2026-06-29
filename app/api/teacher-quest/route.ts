import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  fetchTeacherQuestSession,
  getTeacherQuestAvailability,
} from "@/lib/teacherQuestDb";
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

  const { session, error } = await fetchTeacherQuestSession(supabase);

  if (error) {
    console.error("[teacher-quest] GET:", error);
    return NextResponse.json({ message: error }, { status: 500 });
  }

  const availability = getTeacherQuestAvailability(session);

  if (!availability.available || !session) {
    return NextResponse.json({
      available: false,
      quest: null,
      questions: [],
      questionCount: 0,
    });
  }

  return NextResponse.json({
    available: true,
    quest: session.quest,
    questions: session.questions,
    questionCount: session.questionCount,
  });
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

  const { session, error } = await fetchTeacherQuestSession(supabase);

  if (error) {
    console.error("[teacher-quest] POST:", error);
    return NextResponse.json({ message: error }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { message: "現在利用できる教員クエストはありません。" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    quest: session.quest,
    questions: session.questions,
    questionCount: session.questionCount,
  });
}
