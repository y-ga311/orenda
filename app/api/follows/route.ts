import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  fetchFollowRelations,
  followStudent,
  listMutualFollowIds,
  unfollowStudent,
  type FollowRelation,
} from "@/lib/studentFollows";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type FollowRequestBody = {
  targetGakuseiId?: unknown;
};

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
  const idsParam = url.searchParams.get("ids")?.trim() ?? "";
  const targetIds = idsParam
    ? idsParam.split(",").map((id) => id.trim()).filter(Boolean)
    : [];

  if (targetIds.length > 0) {
    const { relations, error } = await fetchFollowRelations(
      supabase,
      currentStudentId,
      targetIds,
    );

    if (error) {
      return NextResponse.json({ message: error }, { status: 500 });
    }

    const relationById: Record<string, FollowRelation> = {};
    for (const [id, relation] of relations.entries()) {
      relationById[id] = relation;
    }

    return NextResponse.json({ relations: relationById });
  }

  const { ids: mutualIds, error: mutualError } = await listMutualFollowIds(
    supabase,
    currentStudentId,
  );

  if (mutualError) {
    return NextResponse.json({ message: mutualError }, { status: 500 });
  }

  if (mutualIds.length === 0) {
    return NextResponse.json({ mutualFriends: [] });
  }

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("gakusei_id, nickname, avatar_icon_id, class")
    .in("gakusei_id", mutualIds);

  if (studentsError) {
    return NextResponse.json(
      { message: "ともだち情報の取得に失敗しました。" },
      { status: 500 },
    );
  }

  const rows = (students ?? []) as Array<{
    gakusei_id: string;
    nickname: string | null;
    avatar_icon_id: string | null;
    class: string | null;
  }>;

  return NextResponse.json({
    mutualFriends: rows.map((student) => ({
      gakuseiId: student.gakusei_id,
      displayName: student.nickname?.trim() || "ニックネーム未設定",
      avatarIconId: student.avatar_icon_id ?? "pixel01",
      className: student.class,
      followRelation: "mutual" as const,
    })),
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("orenda_student_id")?.value;

  if (!currentStudentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as FollowRequestBody | null;
  const targetGakuseiId =
    typeof body?.targetGakuseiId === "string" ? body.targetGakuseiId.trim() : "";

  if (!targetGakuseiId) {
    return NextResponse.json({ message: "フォロー先が不正です。" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { data: target, error: targetError } = await supabase
    .from("students")
    .select("gakusei_id")
    .eq("gakusei_id", targetGakuseiId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ message: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ message: "対象の学生が見つかりません。" }, { status: 404 });
  }

  const { error } = await followStudent(supabase, currentStudentId, targetGakuseiId);
  if (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }

  const { relations } = await fetchFollowRelations(supabase, currentStudentId, [
    targetGakuseiId,
  ]);

  return NextResponse.json({
    ok: true,
    targetGakuseiId,
    followRelation: relations.get(targetGakuseiId) ?? "following",
  });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("orenda_student_id")?.value;

  if (!currentStudentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const targetGakuseiId = url.searchParams.get("targetGakuseiId")?.trim() ?? "";

  if (!targetGakuseiId) {
    return NextResponse.json({ message: "フォロー解除先が不正です。" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { error } = await unfollowStudent(supabase, currentStudentId, targetGakuseiId);
  if (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }

  const { relations } = await fetchFollowRelations(supabase, currentStudentId, [
    targetGakuseiId,
  ]);

  return NextResponse.json({
    ok: true,
    targetGakuseiId,
    followRelation: relations.get(targetGakuseiId) ?? "none",
  });
}
