import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildStudentMedalList,
  fetchMedalAchievements,
  fetchStudentMedalGrantIds,
} from "@/lib/medalDb";
import { fetchOwnedCardNos } from "@/lib/ownedCardsDb";
import { areMutualFollows } from "@/lib/studentFollows";
import {
  getStudySessionDurationSeconds,
  secondsToMinutes,
} from "@/lib/studySessionDuration";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type StudySessionRow = {
  duration_minutes: number | null;
  duration_seconds: number | null;
  subject_name: string | null;
};

function buildSubjectBreakdown(sessions: StudySessionRow[]) {
  const minutesBySubject = new Map<string, number>();
  let totalMinutes = 0;

  for (const session of sessions) {
    const minutes = secondsToMinutes(getStudySessionDurationSeconds(session));
    if (minutes <= 0) {
      continue;
    }
    const subjectName = session.subject_name?.trim() || "未分類";
    totalMinutes += minutes;
    minutesBySubject.set(
      subjectName,
      (minutesBySubject.get(subjectName) ?? 0) + minutes,
    );
  }

  return {
    totalMinutes,
    subjects: [...minutesBySubject.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([subjectName, minutes]) => ({
        subjectName,
        minutes,
        percentage:
          totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      })),
  };
}

type RouteContext = {
  params: Promise<{ gakuseiId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("orenda_student_id")?.value;
  const { gakuseiId: rawId } = await context.params;
  const targetGakuseiId = typeof rawId === "string" ? rawId.trim() : "";

  if (!currentStudentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  if (!targetGakuseiId) {
    return NextResponse.json({ message: "学生IDが不正です。" }, { status: 400 });
  }

  if (targetGakuseiId === currentStudentId) {
    return NextResponse.json(
      { message: "自分のプロフィールはマイページから確認してください。" },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { mutual, error: mutualError } = await areMutualFollows(
    supabase,
    currentStudentId,
    targetGakuseiId,
  );

  if (mutualError) {
    return NextResponse.json({ message: mutualError }, { status: 500 });
  }

  if (!mutual) {
    return NextResponse.json(
      {
        message:
          "相互フォローになると、相手の勉強時間・メダル・カードを見られます。",
        code: "not_mutual",
      },
      { status: 403 },
    );
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("gakusei_id, nickname, avatar_icon_id, class")
    .eq("gakusei_id", targetGakuseiId)
    .maybeSingle();

  if (studentError) {
    return NextResponse.json({ message: studentError.message }, { status: 500 });
  }

  if (!student) {
    return NextResponse.json({ message: "学生が見つかりません。" }, { status: 404 });
  }

  const [
    sessionsResult,
    { achievements, error: achievementsError },
    { grantsByAchievementId, error: grantsError },
    { nos: ownedCardNos, error: cardsError },
  ] = await Promise.all([
    supabase
      .from("study_sessions")
      .select("duration_minutes, duration_seconds, subject_name")
      .eq("gakusei_id", targetGakuseiId),
    fetchMedalAchievements(supabase),
    fetchStudentMedalGrantIds(supabase, targetGakuseiId),
    fetchOwnedCardNos(supabase, targetGakuseiId),
  ]);

  if (sessionsResult.error) {
    console.error("[friends] study_sessions:", sessionsResult.error.message);
    return NextResponse.json(
      { message: "勉強時間の取得に失敗しました。" },
      { status: 500 },
    );
  }

  if (achievementsError || grantsError) {
    return NextResponse.json(
      { message: achievementsError ?? grantsError ?? "メダル取得に失敗しました。" },
      { status: 500 },
    );
  }

  if (cardsError) {
    return NextResponse.json({ message: cardsError }, { status: 500 });
  }

  const medals = buildStudentMedalList(achievements, grantsByAchievementId).filter(
    (medal) => medal.unlocked,
  );
  const study = buildSubjectBreakdown(
    (sessionsResult.data ?? []) as StudySessionRow[],
  );
  const displayName = student.nickname?.trim() || "ニックネーム未設定";

  return NextResponse.json({
    friend: {
      gakuseiId: student.gakusei_id,
      displayName,
      avatarIconId: student.avatar_icon_id ?? "pixel01",
      className: student.class,
    },
    study,
    medals,
    ownedCardNos,
    cardTotal: 99,
  });
}
