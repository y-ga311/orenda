import type { SupabaseClient } from "@supabase/supabase-js";

type RegisterStudySessionParams = {
  gakuseiId: string;
  subjectName: string;
  /** 従来の分単位（タイマー等）。durationSeconds より優先度低 */
  durationMinutes?: number;
  /** 秒単位（科目クエスト）。1秒以上で記録 */
  durationSeconds?: number;
};

/**
 * study_sessions に学習時間を1件追加する。
 * - durationSeconds >= 1 … 秒で保存（duration_minutes は切り捨て分も併記）
 * - それ以外で durationMinutes >= 1 … 分のみ保存（従来）
 */
export async function registerStudySession(
  supabase: SupabaseClient,
  params: RegisterStudySessionParams,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const subjectName = params.subjectName.trim();
  const gakuseiId = params.gakuseiId.trim();

  if (!gakuseiId || !subjectName) {
    return { ok: false, message: "学習時間の登録情報が不正です。" };
  }

  const rawSeconds = params.durationSeconds;
  const rawMinutes = params.durationMinutes;

  let durationSeconds: number | null = null;
  let durationMinutes: number;

  if (
    typeof rawSeconds === "number" &&
    Number.isInteger(rawSeconds) &&
    rawSeconds >= 1
  ) {
    durationSeconds = rawSeconds;
    durationMinutes = Math.floor(rawSeconds / 60);
  } else if (
    typeof rawMinutes === "number" &&
    Number.isInteger(rawMinutes) &&
    rawMinutes >= 1
  ) {
    durationMinutes = rawMinutes;
  } else {
    return { ok: true };
  }

  const row: {
    gakusei_id: string;
    duration_minutes: number;
    subject_name: string;
    studied_at: string;
    duration_seconds?: number;
  } = {
    gakusei_id: gakuseiId,
    duration_minutes: durationMinutes,
    subject_name: subjectName,
    studied_at: new Date().toISOString(),
  };

  if (durationSeconds != null) {
    row.duration_seconds = durationSeconds;
  }

  const { error } = await supabase.from("study_sessions").insert(row);

  if (error) {
    // duration_seconds 未追加環境では分のみでリトライ（クエスト秒は分に切り上げて最低1分）
    if (
      durationSeconds != null &&
      (error.message.includes("duration_seconds") ||
        error.code === "PGRST204" ||
        error.message.includes("schema cache"))
    ) {
      console.error(
        "[registerStudySession] duration_seconds unavailable, fallback minutes:",
        error.message,
      );
      const fallbackMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
      const retry = await supabase.from("study_sessions").insert({
        gakusei_id: gakuseiId,
        duration_minutes: fallbackMinutes,
        subject_name: subjectName,
        studied_at: new Date().toISOString(),
      });

      if (retry.error) {
        console.error("[registerStudySession] fallback:", retry.error.message);
        return {
          ok: false,
          message: "学習時間の登録中にエラーが発生しました。",
        };
      }

      return { ok: true };
    }

    console.error("[registerStudySession]", error.message);
    return {
      ok: false,
      message: "学習時間の登録中にエラーが発生しました。",
    };
  }

  return { ok: true };
}
