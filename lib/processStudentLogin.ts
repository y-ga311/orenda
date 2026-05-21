import type { SupabaseClient } from "@supabase/supabase-js";
import { LOGIN_DAILY_BONUS_PT } from "@/lib/gachaConstants";
import { isFirstLoginTodayJst } from "@/lib/japanDate";
import { normalizeGachaPoints } from "@/lib/normalizeGachaPoints";

export type ProcessStudentLoginResult = {
  gachaPoints: number;
  dailyBonusAwarded: boolean;
  dailyBonusPoints: number;
};

type ProcessLoginRpcResult = {
  gacha_points?: unknown;
  daily_bonus_awarded?: unknown;
  daily_bonus_points?: unknown;
};

function parseProcessLoginRpc(data: unknown): ProcessStudentLoginResult | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as ProcessLoginRpcResult;

  return {
    gachaPoints: normalizeGachaPoints(record.gacha_points),
    dailyBonusAwarded: record.daily_bonus_awarded === true,
    dailyBonusPoints: normalizeGachaPoints(record.daily_bonus_points),
  };
}

function isRpcUnavailable(errorMessage: string) {
  const haystack = errorMessage.toLowerCase();

  return (
    haystack.includes("could not find") ||
    haystack.includes("schema cache") ||
    haystack.includes("does not exist") ||
    (haystack.includes("process_student_login") && haystack.includes("function"))
  );
}

/** ログイン成功後に students_login 更新と日次ボーナス付与（RPC 優先、未作成時は直接 UPDATE） */
export async function processStudentLogin(
  supabase: SupabaseClient,
  gakuseiId: string,
  currentGachaPoints: number,
  lastStudentsLogin: string | null,
): Promise<ProcessStudentLoginResult> {
  const { data, error } = await supabase.rpc("process_student_login", {
    p_gakusei_id: gakuseiId,
    p_daily_bonus: LOGIN_DAILY_BONUS_PT,
  });

  if (!error) {
    const parsed = parseProcessLoginRpc(data);
    if (parsed) {
      return parsed;
    }
  }

  if (error && !isRpcUnavailable(error.message ?? "")) {
    console.error("[processStudentLogin] rpc:", error.message);
    throw error;
  }

  const dailyBonusAwarded = isFirstLoginTodayJst(lastStudentsLogin);
  const dailyBonusPoints = dailyBonusAwarded ? LOGIN_DAILY_BONUS_PT : 0;
  const nextGachaPoints = currentGachaPoints + dailyBonusPoints;
  const loginAt = new Date().toISOString();

  const { data: updatedRow, error: updateError } = await supabase
    .from("students")
    .update({
      students_login: loginAt,
      gacha_points: nextGachaPoints,
    })
    .eq("gakusei_id", gakuseiId)
    .select("gacha_points")
    .maybeSingle();

  if (updateError || !updatedRow) {
    throw updateError ?? new Error("students_login update failed");
  }

  return {
    gachaPoints: normalizeGachaPoints(
      (updatedRow as { gacha_points?: unknown }).gacha_points,
    ),
    dailyBonusAwarded,
    dailyBonusPoints,
  };
}
