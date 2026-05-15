import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LoginRequestBody = {
  loginId?: unknown;
  password?: unknown;
};

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

function getDaysUntilExam(examDate: string) {
  const { year, month, day } = getJapanDateParts();
  const todayUtc = Date.UTC(year, month - 1, day);
  const [examYear, examMonth, examDay] = examDate.split("-").map(Number);
  const examUtc = Date.UTC(examYear, examMonth - 1, examDay);

  return Math.ceil((examUtc - todayUtc) / 86_400_000);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequestBody | null;
  const loginId = typeof body?.loginId === "string" ? body.loginId.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!loginId || !password) {
    return NextResponse.json(
      { message: "ログインIDとパスワードを入力してください。" },
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

  const { data, error } = await supabase
    .from("students")
    .select("gakusei_id, name, class, nickname, avatar_icon_id")
    .eq("gakusei_id", loginId)
    .eq("gakusei_password", password)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "ログイン処理中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { message: "ログインIDまたはパスワードが違います。" },
      { status: 401 },
    );
  }

  const className = typeof data.class === "string" ? data.class : null;
  const { data: examSchedule, error: examScheduleError } = className
    ? await supabase
        .from("national_exam_schedules")
        .select("exam_date")
        .eq("class_name", className)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null, error: null };

  if (examScheduleError) {
    return NextResponse.json(
      { message: "国家試験日程の取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  const examDate =
    typeof examSchedule?.exam_date === "string" ? examSchedule.exam_date : null;

  const response = NextResponse.json({
    student: {
      gakuseiId: data.gakusei_id,
      name: data.name,
      className,
      nickname: data.nickname,
      avatarIconId: data.avatar_icon_id,
      needsProfileSetup: !data.nickname || !data.avatar_icon_id,
      examDate,
      daysUntilExam: examDate ? getDaysUntilExam(examDate) : null,
    },
  });

  response.cookies.set("orenda_student_id", data.gakusei_id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
