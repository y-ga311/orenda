import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StudySession = {
  duration_minutes: number | null;
  gakusei_id: string | null;
  studied_at: string | null;
};

type RankingPeriod = "week" | "month" | "year" | "total";

type Student = {
  avatar_icon_id: string | null;
  class: string | null;
  gakusei_id: string;
  name: string | null;
  nickname: string | null;
};

type RankingStudent = {
  avatarIconId: string;
  className: string | null;
  displayName: string;
  gakuseiId: string;
  isCurrentUser: boolean;
  note: string;
  rank: number | null;
  totalMinutes: number;
};

const rankingPeriods: RankingPeriod[] = ["week", "month", "year", "total"];

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

function addDaysToJapanDate(year: number, month: number, day: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1, day + offset));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getJapanDateKey(dateIso: string) {
  const { year, month, day } = getJapanDateParts(new Date(dateIso));

  return `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function formatStudyDays(dateKeys: Set<string>) {
  if (dateKeys.size <= 0) {
    return "学習記録なし";
  }

  return `${dateKeys.size}日学習`;
}

function buildRankingStudent({
  currentStudentId,
  minutesByStudent,
  rank,
  student,
  studyDateKeysByStudent,
}: {
  currentStudentId: string;
  minutesByStudent: Map<string, number>;
  rank: number | null;
  student: Student;
  studyDateKeysByStudent: Map<string, Set<string>>;
}): RankingStudent {
  const studyDateKeys = studyDateKeysByStudent.get(student.gakusei_id) ?? new Set<string>();

  return {
    rank,
    gakuseiId: student.gakusei_id,
    displayName: student.nickname || student.name || "未設定",
    avatarIconId: student.avatar_icon_id ?? "pixel01",
    className: student.class,
    totalMinutes: minutesByStudent.get(student.gakusei_id) ?? 0,
    note: formatStudyDays(studyDateKeys),
    isCurrentUser: student.gakusei_id === currentStudentId,
  };
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("orenda_student_id")?.value;

  if (!currentStudentId) {
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
  const requestedPeriod = url.searchParams.get("period");
  const period: RankingPeriod = rankingPeriods.includes(requestedPeriod as RankingPeriod)
    ? (requestedPeriod as RankingPeriod)
    : "week";
  const dayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const weekStart = addDaysToJapanDate(
    today.year,
    today.month,
    today.day,
    -((dayOfWeek + 6) % 7),
  );
  const weekEnd = addDaysToJapanDate(weekStart.year, weekStart.month, weekStart.day, 7);
  const nextMonth =
    today.month === 12
      ? { year: today.year + 1, month: 1, day: 1 }
      : { year: today.year, month: today.month + 1, day: 1 };
  const nextYear = { year: today.year + 1, month: 1, day: 1 };
  const weekStartIso = getJapanBoundaryIso(weekStart.year, weekStart.month, weekStart.day);
  const weekEndIso = getJapanBoundaryIso(weekEnd.year, weekEnd.month, weekEnd.day);
  const monthStartIso = getJapanBoundaryIso(today.year, today.month, 1);
  const nextMonthStartIso = getJapanBoundaryIso(
    nextMonth.year,
    nextMonth.month,
    nextMonth.day,
  );
  const yearStartIso = getJapanBoundaryIso(today.year, 1, 1);
  const nextYearStartIso = getJapanBoundaryIso(nextYear.year, nextYear.month, nextYear.day);
  const periodRange = {
    week: { startIso: weekStartIso, endIso: weekEndIso },
    month: { startIso: monthStartIso, endIso: nextMonthStartIso },
    year: { startIso: yearStartIso, endIso: nextYearStartIso },
    total: { startIso: null, endIso: null },
  }[period];

  let sessionsQuery = supabase
    .from("study_sessions")
    .select("gakusei_id, duration_minutes, studied_at");

  if (periodRange.startIso && periodRange.endIso) {
    sessionsQuery = sessionsQuery
      .gte("studied_at", periodRange.startIso)
      .lt("studied_at", periodRange.endIso);
  }

  const { data: sessions, error: sessionsError } = await sessionsQuery;

  if (sessionsError) {
    return NextResponse.json(
      { message: "ランキングの取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  const minutesByStudent = new Map<string, number>();
  const studyDateKeysByStudent = new Map<string, Set<string>>();

  ((sessions ?? []) as StudySession[]).forEach((session) => {
    if (!session.gakusei_id || !session.studied_at) {
      return;
    }

    minutesByStudent.set(
      session.gakusei_id,
      (minutesByStudent.get(session.gakusei_id) ?? 0) +
        (session.duration_minutes ?? 0),
    );

    const dateKeys = studyDateKeysByStudent.get(session.gakusei_id) ?? new Set<string>();
    dateKeys.add(getJapanDateKey(session.studied_at));
    studyDateKeysByStudent.set(session.gakusei_id, dateKeys);
  });

  const rankedStudentIds = [...minutesByStudent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([studentId]) => studentId);
  const topStudentIds = rankedStudentIds.slice(0, 10);
  const studentIdsToFetch = [...new Set([...topStudentIds, currentStudentId])];

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("gakusei_id, name, nickname, avatar_icon_id, class")
    .in("gakusei_id", studentIdsToFetch);

  if (studentsError) {
    return NextResponse.json(
      { message: "学生情報の取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  const studentById = new Map(
    ((students ?? []) as Student[]).map((student) => [student.gakusei_id, student]),
  );
  const rankByStudentId = new Map(
    rankedStudentIds.map((studentId, index) => [studentId, index + 1]),
  );
  const currentStudent = studentById.get(currentStudentId);

  return NextResponse.json({
    currentUser: currentStudent
      ? buildRankingStudent({
          currentStudentId,
          minutesByStudent,
          rank: rankByStudentId.get(currentStudentId) ?? null,
          student: currentStudent,
          studyDateKeysByStudent,
        })
      : null,
    ranking: topStudentIds.flatMap((studentId) => {
      const student = studentById.get(studentId);

      if (!student) {
        return [];
      }

      return [
        buildRankingStudent({
          currentStudentId,
          minutesByStudent,
          rank: rankByStudentId.get(studentId) ?? null,
          student,
          studyDateKeysByStudent,
        }),
      ];
    }),
    period,
    range: {
      startDate: `${weekStart.year}-${weekStart.month
        .toString()
        .padStart(2, "0")}-${weekStart.day.toString().padStart(2, "0")}`,
      endDate: `${weekEnd.year}-${weekEnd.month
        .toString()
        .padStart(2, "0")}-${weekEnd.day.toString().padStart(2, "0")}`,
    },
  });
}
