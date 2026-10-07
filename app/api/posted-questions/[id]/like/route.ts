import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { togglePostedQuestionLike } from "@/lib/postedQuestions";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "問題IDが不正です。" }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  const { liked, likeCount, pointsAwarded, error } =
    await togglePostedQuestionLike(supabase, id, studentId);

  if (error) {
    return NextResponse.json({ message: error }, { status: 400 });
  }

  return NextResponse.json({ liked, likeCount, pointsAwarded });
}
