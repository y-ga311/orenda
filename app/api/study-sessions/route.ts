import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StudySessionRequestBody = {
  durationMinutes?: unknown;
  subjectId?: unknown;
  subjectName?: unknown;
};

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
    | StudySessionRequestBody
    | null;
  const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
  const subjectName =
    typeof body?.subjectName === "string" ? body.subjectName : "";
  const durationMinutes =
    typeof body?.durationMinutes === "number" ? body.durationMinutes : 0;

  if (!subjectId || !subjectName || !Number.isInteger(durationMinutes)) {
    return NextResponse.json(
      { message: "学習記録の内容が正しくありません。" },
      { status: 400 },
    );
  }

  if (durationMinutes < 1) {
    return NextResponse.json(
      { message: "1分以上の学習時間を登録してください。" },
      { status: 400 },
    );
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

  const { error } = await supabase.from("study_sessions").insert({
    gakusei_id: studentId,
    subject_id: subjectId,
    subject_name: subjectName,
    duration_minutes: durationMinutes,
    studied_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json(
      { message: "学習時間の登録中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
