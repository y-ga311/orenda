import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildStudentMedalList,
  fetchMedalAchievements,
  fetchStudentMedalGrantIds,
} from "@/lib/medalDb";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
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

  const [
    { achievements, error: achievementsError },
    { grantsByAchievementId, error: grantsError },
  ] = await Promise.all([
    fetchMedalAchievements(supabase),
    fetchStudentMedalGrantIds(supabase, studentId),
  ]);

  if (achievementsError) {
    console.error("[medals] achievements:", achievementsError);
    return NextResponse.json({ message: achievementsError }, { status: 500 });
  }

  if (grantsError) {
    console.error("[medals] grants:", grantsError);
    return NextResponse.json({ message: grantsError }, { status: 500 });
  }

  const medals = buildStudentMedalList(achievements, grantsByAchievementId);
  const unlockedCount = medals.filter((medal) => medal.unlocked).length;

  return NextResponse.json({
    medals,
    unlockedCount,
    totalCount: medals.length,
  });
}
