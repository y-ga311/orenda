import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAvatarIconId } from "@/lib/avatarIconIds";
import { normalizeGachaPoints } from "@/lib/normalizeGachaPoints";
import { processStudentLogin } from "@/lib/processStudentLogin";
import { parseStudyTypeId } from "@/lib/studyTypeIds";
import { decryptStudentName } from "@/lib/studentNameCrypto.server";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type ProfileRequestBody = {
  nickname?: unknown;
  avatarIconId?: unknown;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as ProfileRequestBody | null;
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim() : "";
  const avatarIconId =
    typeof body?.avatarIconId === "string" ? body.avatarIconId.trim() : "";

  if (nickname.length < 1 || nickname.length > 12) {
    return NextResponse.json(
      { message: "ニックネームは1文字以上12文字以内で入力してください。" },
      { status: 400 },
    );
  }

  if (!isAvatarIconId(avatarIconId)) {
    return NextResponse.json(
      { message: "アイコンを選択してください。" },
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

  const { data: existingStudent, error: fetchError } = await supabase
    .from("students")
    .select("nickname, avatar_icon_id, gacha_points, students_login")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (fetchError || !existingStudent) {
    return NextResponse.json(
      { message: "学生情報の取得に失敗しました。" },
      { status: 500 },
    );
  }

  const needsInitialProfileSetup =
    !existingStudent.nickname || !existingStudent.avatar_icon_id;

  const { data, error } = await supabase
    .from("students")
    .update({
      nickname,
      avatar_icon_id: avatarIconId,
      profile_completed_at: new Date().toISOString(),
    })
    .eq("gakusei_id", studentId)
    .select("name, nickname, avatar_icon_id, gacha_points, study_type_id")
    .single();

  if (error) {
    return NextResponse.json(
      { message: "プロフィール登録中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  let gachaPoints = normalizeGachaPoints(
    (data as { gacha_points?: unknown }).gacha_points,
  );
  let dailyLoginBonusAwarded = false;
  let dailyLoginBonusPoints = 0;

  if (needsInitialProfileSetup) {
    try {
      const loginProcess = await processStudentLogin(
        supabase,
        studentId,
        normalizeGachaPoints(existingStudent.gacha_points),
        typeof existingStudent.students_login === "string"
          ? existingStudent.students_login
          : null,
      );

      gachaPoints = loginProcess.gachaPoints;
      dailyLoginBonusAwarded = loginProcess.dailyBonusAwarded;
      dailyLoginBonusPoints = loginProcess.dailyBonusPoints;
    } catch (loginProcessError) {
      console.error("[profile] processStudentLogin:", loginProcessError);
    }
  }

  return NextResponse.json({
    student: {
      name: await decryptStudentName(data.name),
      nickname: data.nickname,
      avatarIconId: data.avatar_icon_id,
      studyTypeId: parseStudyTypeId(
        (data as { study_type_id?: unknown }).study_type_id,
      ),
      gachaPoints,
      dailyLoginBonusAwarded,
      dailyLoginBonusPoints,
      completedInitialProfileSetup: needsInitialProfileSetup,
    },
  });
}
