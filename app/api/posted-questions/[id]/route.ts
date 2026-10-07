import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  deactivatePostedQuestion,
  fetchLikedQuestionIds,
  fetchPostedQuestionAuthors,
  fetchPostedQuestionById,
  mapPostedQuestionChallenge,
} from "@/lib/postedQuestions";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  const { row, error } = await fetchPostedQuestionById(supabase, id);
  if (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ message: "問題が見つかりません。" }, { status: 404 });
  }

  const authorNames = await fetchPostedQuestionAuthors(supabase, [
    row.author_gakusei_id,
  ]);
  const likedIds = await fetchLikedQuestionIds(supabase, studentId, [row.id]);

  return NextResponse.json({
    question: mapPostedQuestionChallenge(
      row,
      authorNames.get(row.author_gakusei_id) ?? "ニックネーム未設定",
      studentId,
      likedIds.has(row.id),
    ),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const { error } = await deactivatePostedQuestion(supabase, id, studentId);
  if (error) {
    return NextResponse.json({ message: error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
