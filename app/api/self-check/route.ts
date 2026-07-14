import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getJapanDateParts } from "@/lib/japanDate";

export const runtime = "nodejs";

function sumArray(arr: unknown[]): number {
  return arr.reduce<number>((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
}

function validateIntArray(value: unknown, length: number, min: number, max: number): number[] | null {
  if (!Array.isArray(value) || value.length !== length) return null;
  const result: number[] = [];
  for (const v of value) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) return null;
    result.push(v);
  }
  return result;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json({ message: "ログイン情報が確認できません。" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ message: "Supabase接続情報が未設定です。" }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as {
    phq9Answers?: unknown;
    gad7Answers?: unknown;
    psqiAnswers?: unknown;
    resilienceAnswers?: unknown;
  } | null;

  // PHQ-9: 9 questions, score 0-3 each
  const phq9Answers = validateIntArray(body?.phq9Answers, 9, 0, 3);
  if (!phq9Answers) {
    return NextResponse.json({ message: "PHQ-9の回答が不正です。" }, { status: 400 });
  }

  // GAD-7: 7 questions, score 0-3 each
  const gad7Answers = validateIntArray(body?.gad7Answers, 7, 0, 3);
  if (!gad7Answers) {
    return NextResponse.json({ message: "GAD-7の回答が不正です。" }, { status: 400 });
  }

  // PSQI simplified: 5 questions, score 0-3 each
  const psqiAnswers = validateIntArray(body?.psqiAnswers, 5, 0, 3);
  if (!psqiAnswers) {
    return NextResponse.json({ message: "PSQI睡眠チェックの回答が不正です。" }, { status: 400 });
  }

  // Resilience: 8 questions, score 1-5 each
  const resilienceAnswers = validateIntArray(body?.resilienceAnswers, 8, 1, 5);
  if (!resilienceAnswers) {
    return NextResponse.json({ message: "レジリエンス指標の回答が不正です。" }, { status: 400 });
  }

  const phq9Score = sumArray(phq9Answers);
  const gad7Score = sumArray(gad7Answers);
  const psqiScore = sumArray(psqiAnswers);
  const resilienceScore = sumArray(resilienceAnswers);

  const { year, month } = getJapanDateParts();
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("student_self_checks").upsert(
    {
      gakusei_id: studentId,
      year_month: yearMonth,
      phq9_answers: phq9Answers,
      phq9_score: phq9Score,
      gad7_answers: gad7Answers,
      gad7_score: gad7Score,
      psqi_answers: psqiAnswers,
      psqi_score: psqiScore,
      resilience_answers: resilienceAnswers,
      resilience_score: resilienceScore,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "gakusei_id,year_month" },
  );

  if (error) {
    console.error("[self-check] upsert:", error.message);

    if (error.message.includes("student_self_checks") && error.message.includes("exist")) {
      return NextResponse.json(
        {
          message:
            "テーブルが存在しません。Supabase で docs/sql/create-student-self-checks.sql を実行してください。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({
    phq9Score,
    gad7Score,
    psqiScore,
    resilienceScore,
  });
}
