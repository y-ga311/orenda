import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchMyMockExamGrades } from "@/lib/mockExamGrades";
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

  const { exams, error } = await fetchMyMockExamGrades(supabase, studentId);

  if (error) {
    console.error("[grades/mock-exams]", error);
    return NextResponse.json(
      { message: "模擬試験の成績を取得できませんでした。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    exams: exams.map((exam) => ({
      testName: exam.testName,
      testDate: exam.testDate,
      testDateLabel: exam.testDateLabel,
      subjects: exam.subjects,
      averagePercent: exam.averagePercent,
      acupuncture: exam.acupuncture,
      moxibustion: exam.moxibustion,
    })),
  });
}
