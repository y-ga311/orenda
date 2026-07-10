import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GACHA_SPIN_COST_PT } from "@/lib/gachaConstants";
import { appendOwnedCard } from "@/lib/ownedCardsDb";

const TOTAL_CARD_COUNT = 99;

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("orenda_student_id")?.value;

  if (!studentId) {
    return NextResponse.json(
      { message: "ログイン情報が確認できません。" },
      { status: 401 },
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

  const { data, error } = await supabase.rpc("consume_gacha_points", {
    p_gakusei_id: studentId,
    p_amount: GACHA_SPIN_COST_PT,
  });

  if (error) {
    console.error("[gacha-spin] rpc:", error.message);
    console.error("[gacha-spin] rpc details:", JSON.stringify(error));

    /** PostgREST は本文を message / details / hint に分けるのでまとめて照合する */
    const haystack = `${error.message ?? ""} ${"details" in error ? String(error.details ?? "") : ""} ${"hint" in error ? String(error.hint ?? "") : ""}`.toLowerCase();

    if (haystack.includes("insufficient_gacha_points")) {
      return NextResponse.json(
        { message: "ガチャポイントが不足しています。" },
        { status: 400 },
      );
    }

    if (haystack.includes("student_not_found")) {
      return NextResponse.json({ message: "ユーザー情報が見つかりません。" }, { status: 404 });
    }

    if (haystack.includes("invalid_amount")) {
      return NextResponse.json({ message: "処理を完了できませんでした。" }, { status: 500 });
    }

    if (
      haystack.includes("could not find") ||
      haystack.includes("schema cache") ||
      haystack.includes("does not exist") ||
      (haystack.includes("consume_gacha_points") && haystack.includes("function"))
    ) {
      return NextResponse.json(
        {
          message:
            "ガチャ処理用の関数（consume_gacha_points）がDBに未定義です。Supabase の SQL で docs/sql/consume-gacha-points-function.sql を実行し、Dashboard でスキーマを再読み込みしてください。",
        },
        { status: 500 },
      );
    }

    if (haystack.includes("permission denied") || haystack.includes("execute privilege")) {
      return NextResponse.json(
        {
          message:
            "関数の実行権限がありません（GRANT EXECUTE … TO service_role を確認してください）。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "ガチャポイントの更新に失敗しました。" },
      { status: 500 },
    );
  }

  const balance =
    typeof data === "number" && Number.isFinite(data) ? Math.max(0, Math.floor(data)) : 0;

  const cardNo = Math.floor(Math.random() * TOTAL_CARD_COUNT) + 1;
  await appendOwnedCard(supabase, studentId, cardNo).catch(() => null);

  return NextResponse.json({ gachaPoints: balance, cardNo });
}
