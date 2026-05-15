import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StudySession = {
  duration_minutes: number | null;
  gakusei_id: string | null;
  studied_at: string | null;
};

type Student = {
  avatar_icon_id: string | null;
  gakusei_id: string;
  name: string | null;
  nickname: string | null;
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

function formatWeekStudyDays(dateKeys: Set<string>) {
  if (dateKeys.size <= 0) {
    return "今週の学習記録なし";
  }

  return `今週 ${dateKeys.size}日学習`;
}

export async function GET() {
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
  const dayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const weekStart = addDaysToJapanDate(
    today.year,
    today.month,
    today.day,
    -((dayOfWeek + 6) % 7),
  );
  const weekEnd = addDaysToJapanDate(weekStart.year, weekStart.month, weekStart.day, 7);
  const weekStartIso = getJapanBoundaryIso(weekStart.year, weekStart.month, weekStart.day);
  const weekEndIso = getJapanBoundaryIso(weekEnd.year, weekEnd.month, weekEnd.day);

  const { data: sessions, error: sessionsError } = await supabase
    .from("study_sessions")
    .select("gakusei_id, duration_minutes, studied_at")
    .gte("studied_at", weekStartIso)
    .lt("studied_at", weekEndIso);

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
    .map(([studentId]) => studentId)
    .slice(0, 10);

  if (rankedStudentIds.length === 0) {
    return NextResponse.json({
      ranking: [],
      week: {
        startDate: `${weekStart.year}-${weekStart.month
          .toString()
          .padStart(2, "0")}-${weekStart.day.toString().padStart(2, "0")}`,
        endDate: `${weekEnd.year}-${weekEnd.month
          .toString()
          .padStart(2, "0")}-${weekEnd.day.toString().padStart(2, "0")}`,
      },
    });
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("gakusei_id, name, nickname, avatar_icon_id")
    .in("gakusei_id", rankedStudentIds);

  if (studentsError) {
    return NextResponse.json(
      { message: "学生情報の取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  const studentById = new Map(
    ((students ?? []) as Student[]).map((student) => [student.gakusei_id, student]),
  );

  return NextResponse.json({
    ranking: rankedStudentIds.map((studentId, index) => {
      const student = studentById.get(studentId);
      const studyDateKeys = studyDateKeysByStudent.get(studentId) ?? new Set<string>();

      return {
        rank: index + 1,
        gakuseiId: studentId,
        displayName: student?.nickname || student?.name || "未設定",
        avatarIconId: student?.avatar_icon_id ?? "pixel01",
        weekMinutes: minutesByStudent.get(studentId) ?? 0,
        note: formatWeekStudyDays(studyDateKeys),
        isCurrentUser: studentId === currentStudentId,
      };
    }),
    week: {
      startDate: `${weekStart.year}-${weekStart.month
        .toString()
        .padStart(2, "0")}-${weekStart.day.toString().padStart(2, "0")}`,
      endDate: `${weekEnd.year}-${weekEnd.month
        .toString()
        .padStart(2, "0")}-${weekEnd.day.toString().padStart(2, "0")}`,
    },
  });
}
