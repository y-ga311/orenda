/** 日本時間（Asia/Tokyo）の暦日ユーティリティ */

export function getJapanDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [year, month, day] = formatter.format(date).split("-").map(Number);

  return { year, month, day };
}

export function getJapanDateKeyFromDate(date: Date) {
  const { year, month, day } = getJapanDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getJapanDateKeyFromIso(isoTimestamp: string) {
  return getJapanDateKeyFromDate(new Date(isoTimestamp));
}

export function isFirstLoginTodayJst(
  lastLoginIso: string | null | undefined,
  now = new Date(),
): boolean {
  if (!lastLoginIso) {
    return true;
  }

  const todayKey = getJapanDateKeyFromDate(now);
  const lastKey = getJapanDateKeyFromIso(lastLoginIso);

  return lastKey < todayKey;
}
