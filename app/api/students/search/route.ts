import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchFollowRelations, type FollowRelation } from "@/lib/studentFollows";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

const MAX_RESULTS = 20;

type StudentRow = {
  avatar_icon_id: string | null;
  class: string | null;
  gakusei_id: string;
  nickname: string | null;
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

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 1) {
    return NextResponse.json({
      students: [],
      message: "ニックネームまたは学籍IDを入力してください。",
    });
  }

  if (query.length > 40) {
    return NextResponse.json(
      { message: "検索語が長すぎます。" },
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

  // ニックネーム部分一致 + 学籍IDの前方一致（氏名は暗号化のため検索対象外）
  // PostgREST の or/ilike 用にワイルドカードと区切り文字を除去
  const safeQuery = query.replace(/[%_,]/g, "");
  if (safeQuery.length < 1) {
    return NextResponse.json({
      students: [],
      message: "ニックネームまたは学籍IDを入力してください。",
    });
  }

  const { data, error } = await supabase
    .from("students")
    .select("gakusei_id, nickname, avatar_icon_id, class")
    .neq("gakusei_id", currentStudentId)
    .or(`nickname.ilike.%${safeQuery}%,gakusei_id.ilike.${safeQuery}%`)
    .order("nickname", { ascending: true, nullsFirst: false })
    .limit(MAX_RESULTS);

  if (error) {
    console.error("[students/search]", error.message);
    return NextResponse.json(
      { message: "学生の検索に失敗しました。" },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as StudentRow[];
  const ids = rows.map((student) => student.gakusei_id);
  const { relations, error: relationError } = await fetchFollowRelations(
    supabase,
    currentStudentId,
    ids,
  );

  if (relationError) {
    console.error("[students/search] follows:", relationError);
  }

  return NextResponse.json({
    students: rows.map((student) => ({
      gakuseiId: student.gakusei_id,
      displayName: student.nickname?.trim() || "ニックネーム未設定",
      avatarIconId: student.avatar_icon_id ?? "pixel01",
      className: student.class,
      followRelation: (relations.get(student.gakusei_id) ??
        "none") as FollowRelation,
    })),
  });
}
