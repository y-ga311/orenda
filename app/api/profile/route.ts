import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAvatarIconId } from "@/lib/avatarIconIds";

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

  const { data, error } = await supabase
    .from("students")
    .update({
      nickname,
      avatar_icon_id: avatarIconId,
      profile_completed_at: new Date().toISOString(),
    })
    .eq("gakusei_id", studentId)
    .select("name, nickname, avatar_icon_id")
    .single();

  if (error) {
    return NextResponse.json(
      { message: "プロフィール登録中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    student: {
      name: data.name,
      nickname: data.nickname,
      avatarIconId: data.avatar_icon_id,
    },
  });
}
