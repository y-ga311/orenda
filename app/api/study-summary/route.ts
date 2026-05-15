import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getJapanDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);

  return { year, month, day };
}

function getJapanBoundaryIso(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - 9 * 60 * 60 * 1000).toISOString();
}

function getJapanTodayStartIso() {
  const { year, month, day } = getJapanDateParts();
  return getJapanBoundaryIso(year, month, day);
}

function getJapanMonthStartIso() {
  const { year, month } = getJapanDateParts();
  return getJapanBoundaryIso(year, month, 1);
}

function sumDurationMinutes(
  sessions: { duration_minutes: number | null }[] | null,
) {
  return (
    sessions?.reduce((total, session) => {
      return total + (session.duration_minutes ?? 0);
    }, 0) ?? 0
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
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

  const todayStartIso = getJapanTodayStartIso();
  const monthStartIso = getJapanMonthStartIso();

  const [todayResult, monthResult, totalResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("gakusei_id", studentId)
      .gte("studied_at", todayStartIso),
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("gakusei_id", studentId)
      .gte("studied_at", monthStartIso),
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("gakusei_id", studentId),
  ]);

  const error = todayResult.error ?? monthResult.error ?? totalResult.error;

  if (error) {
    return NextResponse.json(
      { message: "学習時間の取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    todayMinutes: sumDurationMinutes(todayResult.data),
    monthMinutes: sumDurationMinutes(monthResult.data),
    totalMinutes: sumDurationMinutes(totalResult.data),
  });
}
