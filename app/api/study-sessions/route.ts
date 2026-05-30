import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { awardStudentGachaPoints } from "@/lib/awardStudentGachaPoints";
import { GACHA_POINTS_PER_STUDY_MINUTE } from "@/lib/gachaConstants";

export const runtime = "nodejs";

type StudySessionRequestBody = {
  durationMinutes?: unknown;
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
  const durationMinutes =
    typeof body?.durationMinutes === "number" ? body.durationMinutes : 0;

  if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
    return NextResponse.json(
      { message: "1分以上学習してから登録してください。" },
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

  const pointsEarned = durationMinutes * GACHA_POINTS_PER_STUDY_MINUTE;
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
