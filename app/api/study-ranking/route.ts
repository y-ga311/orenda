import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  RANKING_MONTHLY_FIRST_PLACE_PT,
  RANKING_WEEKLY_FIRST_PLACE_PT,
} from "@/lib/gachaConstants";
import { listRecentRankingRewardGrants } from "@/lib/rankingRewards";
import { aggregateStudyMinutes } from "@/lib/studyRankingCompute";
import {
  getJapanDateParts,
  getPeriodRange,
  type RankingPeriod,
} from "@/lib/studyRankingPeriod";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

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

function formatPeriodRangeLabel(period: RankingPeriod, referenceDate = new Date()) {
  const range = getPeriodRange(period, referenceDate);

  if (!range.startIso || !range.endIso) {
    return null;
  }

  const start = getJapanDateParts(new Date(range.startIso));
  const end = getJapanDateParts(new Date(new Date(range.endIso).getTime() - 1));

  const startLabel = `${start.month}/${start.day}`;
  const endLabel = `${end.month}/${end.day}`;

  return `${startLabel}〜${endLabel}`;
}

function buildRewardInfo(periodType: "week" | "month") {
  if (periodType === "week") {
    return {
      periodType,
      points: RANKING_WEEKLY_FIRST_PLACE_PT,
      badgeLabel: "週間1位",
      headline: `週間1位で ${RANKING_WEEKLY_FIRST_PLACE_PT}pt プレゼント`,
      description: "",
      encouragement: "今週の1位を目指して、毎日コツコツ学習しよう！",
    };
  }

  return {
    periodType,
    points: RANKING_MONTHLY_FIRST_PLACE_PT,
    badgeLabel: "月間1位",
    headline: `月間1位で ${RANKING_MONTHLY_FIRST_PLACE_PT}pt プレゼント`,
    description: "",
    encouragement: "今月の1位を目指して、学習時間を積み上げよう！",
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

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const requestedPeriod = url.searchParams.get("period");
  const period: RankingPeriod = rankingPeriods.includes(requestedPeriod as RankingPeriod)
    ? (requestedPeriod as RankingPeriod)
    : "week";
  const periodRange = getPeriodRange(period);
  const rangeLabel = formatPeriodRangeLabel(period);

  let minutesByStudent: Map<string, number>;
  let studyDateKeysByStudent: Map<string, Set<string>>;

  try {
    const aggregate = await aggregateStudyMinutes(
      supabase,
      periodRange.startIso,
      periodRange.endIso,
    );
    minutesByStudent = aggregate.minutesByStudent;
    studyDateKeysByStudent = aggregate.studyDateKeysByStudent;
  } catch (error) {
    console.error("[study-ranking] aggregateStudyMinutes:", error);

    return NextResponse.json(
      { message: "ランキングの取得中にエラーが発生しました。" },
      { status: 500 },
    );
  }

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
  const recentGrants = await listRecentRankingRewardGrants(supabase, currentStudentId, 3);

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
    range: rangeLabel ? { label: rangeLabel } : null,
    rewardInfo:
      period === "week" || period === "month"
        ? {
            ...buildRewardInfo(period),
            recentGrants,
          }
        : null,
  });
}
