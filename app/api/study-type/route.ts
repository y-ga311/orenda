import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isStudyTypeId, parseStudyTypeId } from "@/lib/studyTypeIds";

export const runtime = "nodejs";

type StudyTypeRequestBody = {
  studyTypeId?: unknown;
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

  const body = (await request.json().catch(() => null)) as StudyTypeRequestBody | null;
  const parsed =
    typeof body?.studyTypeId === "number"
      ? body.studyTypeId
      : typeof body?.studyTypeId === "string"
        ? Number(body.studyTypeId)
        : Number.NaN;

  if (!isStudyTypeId(parsed)) {
    return NextResponse.json(
      { message: "勉強タイプを選択してください。" },
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
    .update({ study_type_id: parsed })
    .eq("gakusei_id", studentId)
    .select("study_type_id")
    .single();

  if (error) {
    if (error.message.includes("study_type_id")) {
      return NextResponse.json(
        {
          message:
            "study_type_id カラムがありません。Supabase で docs/sql/add-students-study-type-id.sql を実行してください。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "勉強タイプの保存中にエラーが発生しました。" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    student: {
      studyTypeId: parseStudyTypeId(
        (data as { study_type_id?: unknown }).study_type_id,
      ),
    },
  });
}
