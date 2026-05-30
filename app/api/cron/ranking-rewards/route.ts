import { NextResponse } from "next/server";
import { processRankingRewards } from "@/lib/rankingRewards";
import { createServiceRoleSupabaseClient } from "@/lib/supabaseServiceRole";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret =
    process.env.RANKING_REWARDS_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const headerToken = request.headers.get("x-cron-secret")?.trim() ?? "";
  const urlToken = new URL(request.url).searchParams.get("secret")?.trim() ?? "";

  return [bearerToken, headerToken, urlToken].some((token) => token === secret);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "認可されていません。" }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { message: "Supabase接続情報が未設定です。" },
      { status: 500 },
    );
  }

  try {
    const results = await processRankingRewards(supabase);

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("[cron/ranking-rewards]", error);

    return NextResponse.json(
      { message: "ランキング報酬の処理に失敗しました。" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
