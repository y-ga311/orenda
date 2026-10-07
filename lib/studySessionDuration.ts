/** セッション1件の実秒数（秒カラム優先、なければ分×60） */
export function getStudySessionDurationSeconds(session: {
  duration_minutes?: number | null;
  duration_seconds?: number | null;
}): number {
  if (
    typeof session.duration_seconds === "number" &&
    Number.isFinite(session.duration_seconds) &&
    session.duration_seconds >= 0
  ) {
    return Math.floor(session.duration_seconds);
  }

  if (
    typeof session.duration_minutes === "number" &&
    Number.isFinite(session.duration_minutes) &&
    session.duration_minutes > 0
  ) {
    return Math.floor(session.duration_minutes * 60);
  }

  return 0;
}

export function sumStudySessionDurationSeconds(
  sessions: Array<{
    duration_minutes?: number | null;
    duration_seconds?: number | null;
  }> | null,
): number {
  return (
    sessions?.reduce(
      (total, session) => total + getStudySessionDurationSeconds(session),
      0,
    ) ?? 0
  );
}

/** 表示・既存API向け。秒合計を分（小数可）に変換 */
export function secondsToMinutes(totalSeconds: number): number {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return 0;
  }

  return totalSeconds / 60;
}
