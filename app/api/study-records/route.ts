import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StudySession = {
  duration_minutes: number | null;
  studied_at: string | null;
  subject_name: string | null;
};

type StudyPeriod = "today" | "week" | "month" | "year" | "total";

const subjectColors = ["#34C759", "#007AFF", "#FFCC00", "#FF9500", "#AF52DE"];
const studyPeriods: StudyPeriod[] = ["today", "week", "month", "year", "total"];

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

function getDateKey(year: number, month: number, day: number) {
  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function getJapanDateKey(dateIso: string) {
  const { year, month, day } = getJapanDateParts(new Date(dateIso));
  return getDateKey(year, month, day);
}

function addDaysToJapanDate(year: number, month: number, day: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1, day + offset));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function sumDurationMinutes(sessions: { duration_minutes: number | null }[] | null) {
  return (
    sessions?.reduce((total, session) => {
      return total + (session.duration_minutes ?? 0);
    }, 0) ?? 0
  );
}

function buildSubjectBreakdown(sessions: StudySession[]) {
  const minutesBySubject = new Map<string, number>();
  let totalMinutes = 0;

  sessions.forEach((session) => {
    const minutes = session.duration_minutes ?? 0;
    const subjectName = session.subject_name ?? "未分類";

    totalMinutes += minutes;
    minutesBySubject.set(subjectName, (minutesBySubject.get(subjectName) ?? 0) + minutes);
  });

  return [...minutesBySubject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subjectName, minutes], index) => ({
      subjectName,
      minutes,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      color: subjectColors[index % subjectColors.length],
    }));
}

function countStudiedDays(sessions: StudySession[]) {
  const studiedDateKeys = new Set<string>();

  sessions.forEach((session) => {
    if (!session.studied_at || !session.duration_minutes) {
      return;
    }

    studiedDateKeys.add(getJapanDateKey(session.studied_at));
  });

  return studiedDateKeys.size;
}

function buildPeriodSummary(sessions: StudySession[]) {
  const totalMinutes = sumDurationMinutes(sessions);
  const studiedDays = countStudiedDays(sessions);

  return {
    totalMinutes,
    studiedDays,
    averageMinutes: studiedDays > 0 ? Math.round(totalMinutes / studiedDays) : 0,
  };
}

function buildCalendarDays(
  sessions: StudySession[],
  targetMonth: ReturnType<typeof getJapanDateParts>,
  today: ReturnType<typeof getJapanDateParts>,
) {
  const minutesByDate = new Map<string, number>();
  const firstDay = new Date(Date.UTC(targetMonth.year, targetMonth.month - 1, 1));
  const mondayFirstOffset = (firstDay.getUTCDay() + 6) % 7;
  const todayKey = getDateKey(today.year, today.month, today.day);

  sessions.forEach((session) => {
    if (!session.studied_at) {
      return;
    }

    const key = getJapanDateKey(session.studied_at);
    minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + (session.duration_minutes ?? 0));
  });

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDaysToJapanDate(
      targetMonth.year,
      targetMonth.month,
      1,
      index - mondayFirstOffset,
    );
    const key = getDateKey(date.year, date.month, date.day);

    return {
      date: key,
      day: date.day,
      minutes: minutesByDate.get(key) ?? 0,
      isCurrentMonth: date.month === targetMonth.month,
      isToday: key === todayKey,
    };
  });
}

export async function GET(request: Request) {
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

  const today = getJapanDateParts();
  const url = new URL(request.url);
  const requestedYear = Number(url.searchParams.get("year"));
  const requestedMonth = Number(url.searchParams.get("month"));
  const requestedPeriod = url.searchParams.get("period");
  const period: StudyPeriod = studyPeriods.includes(requestedPeriod as StudyPeriod)
    ? (requestedPeriod as StudyPeriod)
    : "month";
  const targetMonth = {
    year: Number.isInteger(requestedYear) ? requestedYear : today.year,
    month:
      Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
        ? requestedMonth
        : today.month,
    day: 1,
  };
  const nextDay = addDaysToJapanDate(today.year, today.month, today.day, 1);
  const dayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const weekStart = addDaysToJapanDate(
    today.year,
    today.month,
    today.day,
    -((dayOfWeek + 6) % 7),
  );
  const weekEnd = addDaysToJapanDate(weekStart.year, weekStart.month, weekStart.day, 7);
  const nextMonth =
    targetMonth.month === 12
      ? { year: targetMonth.year + 1, month: 1, day: 1 }
      : { year: targetMonth.year, month: targetMonth.month + 1, day: 1 };
  const nextYear = { year: targetMonth.year + 1, month: 1, day: 1 };

  const todayStartIso = getJapanBoundaryIso(today.year, today.month, today.day);
  const tomorrowStartIso = getJapanBoundaryIso(nextDay.year, nextDay.month, nextDay.day);
  const weekStartIso = getJapanBoundaryIso(weekStart.year, weekStart.month, weekStart.day);
  const weekEndIso = getJapanBoundaryIso(weekEnd.year, weekEnd.month, weekEnd.day);
  const monthStartIso = getJapanBoundaryIso(targetMonth.year, targetMonth.month, 1);
  const nextMonthStartIso = getJapanBoundaryIso(nextMonth.year, nextMonth.month, nextMonth.day);
  const yearStartIso = getJapanBoundaryIso(targetMonth.year, 1, 1);
  const nextYearStartIso = getJapanBoundaryIso(nextYear.year, nextYear.month, nextYear.day);
  const periodRange = {
    today: { startIso: todayStartIso, endIso: tomorrowStartIso },
    week: { startIso: weekStartIso, endIso: weekEndIso },
    month: { startIso: monthStartIso, endIso: nextMonthStartIso },
    year: { startIso: yearStartIso, endIso: nextYearStartIso },
    total: { startIso: null, endIso: null },
  }[period];

  let periodQuery = supabase
    .from("study_sessions")
    .select("duration_minutes, studied_at, subject_name")
    .eq("gakusei_id", studentId);

  if (periodRange.startIso && periodRange.endIso) {
    periodQuery = periodQuery
      .gte("studied_at", periodRange.startIso)
      .lt("studied_at", periodRange.endIso);
  }

  const [todayResult, monthResult, totalResult, periodResult] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("gakusei_id", studentId)
      .gte("studied_at", todayStartIso)
      .lt("studied_at", tomorrowStartIso),
    supabase
      .from("study_sessions")
      .select("duration_minutes, studied_at, subject_name")
      .eq("gakusei_id", studentId)
      .gte("studied_at", monthStartIso)
      .lt("studied_at", nextMonthStartIso),
    supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("gakusei_id", studentId),
    periodQuery,
  ]);

  const error =
    todayResult.error ?? monthResult.error ?? totalResult.error ?? periodResult.error;

  if (error) {
    return NextResponse.json(
      { message: "学習記録の取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  const monthSessions = (monthResult.data ?? []) as StudySession[];
  const periodSessions = (periodResult.data ?? []) as StudySession[];

  return NextResponse.json({
    summary: {
      todayMinutes: sumDurationMinutes(todayResult.data),
      monthMinutes: sumDurationMinutes(monthSessions),
      totalMinutes: sumDurationMinutes(totalResult.data),
    },
    selectedPeriod: period,
    periodSummary: buildPeriodSummary(periodSessions),
    subjectBreakdown: buildSubjectBreakdown(periodSessions),
    calendar: {
      year: targetMonth.year,
      month: targetMonth.month,
      days: buildCalendarDays(monthSessions, targetMonth, today),
    },
  });
}
