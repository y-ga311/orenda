import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeGachaPoints } from "@/lib/normalizeGachaPoints";

type AwardStudentGachaPointsSuccess = {
  ok: true;
  gachaPoints: number;
  pointsEarned: number;
};

type AwardStudentGachaPointsFailure = {
  ok: false;
  status: 404 | 500;
  message: string;
};

export type AwardStudentGachaPointsResult =
  | AwardStudentGachaPointsSuccess
  | AwardStudentGachaPointsFailure;

async function fetchStudentGachaPoints(
  supabase: SupabaseClient,
  studentId: string,
): Promise<AwardStudentGachaPointsResult> {
  const { data: currentRow, error: selectError } = await supabase
    .from("students")
    .select("gacha_points")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (selectError || !currentRow) {
    return {
      ok: false,
      status: 404,
      message: "ユーザー情報が見つかりません。",
    };
  }

  return {
    ok: true,
    gachaPoints: normalizeGachaPoints(
      (currentRow as { gacha_points?: unknown }).gacha_points,
    ),
    pointsEarned: 0,
  };
}

export async function awardStudentGachaPoints(
  supabase: SupabaseClient,
  studentId: string,
  pointsEarned: number,
): Promise<AwardStudentGachaPointsResult> {
  if (!Number.isInteger(pointsEarned) || pointsEarned < 0) {
    return {
      ok: false,
      status: 500,
      message: "付与ポイントが不正です。",
    };
  }

  if (pointsEarned === 0) {
    return fetchStudentGachaPoints(supabase, studentId);
  }

  const { data: rpcBalance, error: rpcError } = await supabase.rpc(
    "award_gacha_points",
    {
      p_gakusei_id: studentId,
      p_amount: pointsEarned,
    },
  );

  if (!rpcError) {
    return {
      ok: true,
      gachaPoints: normalizeGachaPoints(rpcBalance),
      pointsEarned,
    };
  }

  const haystack = `${rpcError.message ?? ""} ${"details" in rpcError ? String(rpcError.details ?? "") : ""} ${"hint" in rpcError ? String(rpcError.hint ?? "") : ""}`.toLowerCase();

  const rpcUnavailable =
    haystack.includes("could not find") ||
    haystack.includes("schema cache") ||
    haystack.includes("does not exist") ||
    (haystack.includes("award_gacha_points") && haystack.includes("function"));

  if (!rpcUnavailable) {
    console.error("[awardStudentGachaPoints] award_gacha_points:", rpcError.message);

    if (haystack.includes("student_not_found")) {
      return {
        ok: false,
        status: 404,
        message: "ユーザー情報が見つかりません。",
      };
    }

    return {
      ok: false,
      status: 500,
      message: "gacha_points の更新に失敗しました。",
    };
  }

  const { data: currentRow, error: selectError } = await supabase
    .from("students")
    .select("gacha_points")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (selectError || !currentRow) {
    return {
      ok: false,
      status: 404,
      message: "ユーザー情報が見つかりません。",
    };
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
    console.error(
      "[awardStudentGachaPoints] update gacha_points:",
      updateError?.message,
    );
    return {
      ok: false,
      status: 500,
      message: "gacha_points の更新に失敗しました。",
    };
  }

  return {
    ok: true,
    gachaPoints: normalizeGachaPoints(
      (updatedRow as { gacha_points?: unknown }).gacha_points,
    ),
    pointsEarned,
  };
}
