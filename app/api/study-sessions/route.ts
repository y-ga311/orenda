import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GACHA_POINTS_PER_STUDY_MINUTE } from "@/lib/gachaConstants";
import { normalizeGachaPoints } from "@/lib/normalizeGachaPoints";

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

  const { data: rpcBalance, error: rpcError } = await supabase.rpc("award_gacha_points", {
    p_gakusei_id: studentId,
    p_amount: pointsEarned,
  });

  if (!rpcError) {
    const gachaPoints = normalizeGachaPoints(rpcBalance);

    return NextResponse.json({
      ok: true,
      gachaPoints,
      pointsEarned,
    });
  }

  const haystack = `${rpcError.message ?? ""} ${"details" in rpcError ? String(rpcError.details ?? "") : ""} ${"hint" in rpcError ? String(rpcError.hint ?? "") : ""}`.toLowerCase();

  const rpcUnavailable =
    haystack.includes("could not find") ||
    haystack.includes("schema cache") ||
    haystack.includes("does not exist") ||
    (haystack.includes("award_gacha_points") && haystack.includes("function"));

  if (!rpcUnavailable) {
    console.error("[study-sessions] award_gacha_points:", rpcError.message);

    if (haystack.includes("student_not_found")) {
      return NextResponse.json({ message: "ユーザー情報が見つかりません。" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "gacha_points の更新に失敗しました。" },
      { status: 500 },
    );
  }

  const { data: currentRow, error: selectError } = await supabase
    .from("students")
    .select("gacha_points")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (selectError || !currentRow) {
    return NextResponse.json(
      { message: "ユーザー情報が見つかりません。" },
      { status: 404 },
    );
  }

  const nextGachaPoints =
    normalizeGachaPoints(
      (currentRow as { gacha_points?: unknown }).gacha_points,
    ) + pointsEarned;

  const { data: updatedRow, error: updateError } = await supabase
    .from("students")
    .update({ gacha_points: nextGachaPoints })
    .eq("gakusei_id", studentId)
    .select("gacha_points")
    .maybeSingle();

  if (updateError || !updatedRow) {
    console.error("[study-sessions] update gacha_points:", updateError?.message);
    return NextResponse.json(
      { message: "gacha_points の更新に失敗しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    gachaPoints: normalizeGachaPoints(
      (updatedRow as { gacha_points?: unknown }).gacha_points,
    ),
    pointsEarned,
  });
}
