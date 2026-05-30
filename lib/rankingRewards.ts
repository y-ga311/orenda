import type { SupabaseClient } from "@supabase/supabase-js";
import { awardStudentGachaPoints } from "@/lib/awardStudentGachaPoints";
import {
  RANKING_MONTHLY_FIRST_PLACE_PT,
  RANKING_REWARD_NONE_MARKER,
  RANKING_WEEKLY_FIRST_PLACE_PT,
} from "@/lib/gachaConstants";
import {
  aggregateStudyMinutes,
  findFirstPlaceStudentIds,
} from "@/lib/studyRankingCompute";
import type { ClosedRankingPeriod } from "@/lib/studyRankingPeriod";
import {
  getLastCompletedMonthPeriod,
  getLastCompletedWeekPeriod,
} from "@/lib/studyRankingPeriod";

type RankingRewardGrantRow = {
  gakusei_id: string;
};

export type RankingRewardProcessResult = {
  periodType: "week" | "month";
  periodKey: string;
  status: "skipped" | "no_winner" | "granted";
  winnerIds: string[];
  pointsAwarded: number;
};

async function isRankingPeriodProcessed(
  supabase: SupabaseClient,
  period: ClosedRankingPeriod,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("ranking_reward_grants")
    .select("gakusei_id")
    .eq("period_type", period.periodType)
    .eq("period_key", period.periodKey)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

async function markRankingPeriodProcessed(
  supabase: SupabaseClient,
  period: ClosedRankingPeriod,
): Promise<void> {
  const { error } = await supabase.from("ranking_reward_grants").insert({
    period_type: period.periodType,
    period_key: period.periodKey,
    gakusei_id: RANKING_REWARD_NONE_MARKER,
    rank: 1,
    points_awarded: 0,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function recordRankingRewardGrant(
  supabase: SupabaseClient,
  period: ClosedRankingPeriod,
  gakuseiId: string,
  pointsAwarded: number,
): Promise<void> {
  const { error } = await supabase.from("ranking_reward_grants").insert({
    period_type: period.periodType,
    period_key: period.periodKey,
    gakusei_id: gakuseiId,
    rank: 1,
    points_awarded: pointsAwarded,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function processClosedRankingPeriod(
  supabase: SupabaseClient,
  period: ClosedRankingPeriod,
  pointsAwarded: number,
): Promise<RankingRewardProcessResult> {
  if (await isRankingPeriodProcessed(supabase, period)) {
    return {
      periodType: period.periodType,
      periodKey: period.periodKey,
      status: "skipped",
      winnerIds: [],
      pointsAwarded: 0,
    };
  }

  const { minutesByStudent } = await aggregateStudyMinutes(
    supabase,
    period.startIso,
    period.endIso,
  );
  const winnerIds = findFirstPlaceStudentIds(minutesByStudent);

  if (winnerIds.length === 0) {
    await markRankingPeriodProcessed(supabase, period);

    return {
      periodType: period.periodType,
      periodKey: period.periodKey,
      status: "no_winner",
      winnerIds: [],
      pointsAwarded: 0,
    };
  }

  for (const winnerId of winnerIds) {
    const result = await awardStudentGachaPoints(supabase, winnerId, pointsAwarded);

    if (!result.ok) {
      throw new Error(result.message);
    }

    await recordRankingRewardGrant(supabase, period, winnerId, pointsAwarded);
  }

  return {
    periodType: period.periodType,
    periodKey: period.periodKey,
    status: "granted",
    winnerIds,
    pointsAwarded,
  };
}

export async function processRankingRewards(
  supabase: SupabaseClient,
  referenceDate = new Date(),
): Promise<RankingRewardProcessResult[]> {
  const periods = [
    {
      period: getLastCompletedWeekPeriod(referenceDate),
      points: RANKING_WEEKLY_FIRST_PLACE_PT,
    },
    {
      period: getLastCompletedMonthPeriod(referenceDate),
      points: RANKING_MONTHLY_FIRST_PLACE_PT,
    },
  ];

  const results: RankingRewardProcessResult[] = [];

  for (const entry of periods) {
    results.push(
      await processClosedRankingPeriod(supabase, entry.period, entry.points),
    );
  }

  return results;
}

export async function listRecentRankingRewardGrants(
  supabase: SupabaseClient,
  gakuseiId: string,
  limit = 5,
): Promise<
  Array<{
    periodType: string;
    periodKey: string;
    pointsAwarded: number;
    grantedAt: string;
  }>
> {
  const { data, error } = await supabase
    .from("ranking_reward_grants")
    .select("period_type, period_key, points_awarded, granted_at")
    .eq("gakusei_id", gakuseiId)
    .gt("points_awarded", 0)
    .order("granted_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<{
    period_type: string;
    period_key: string;
    points_awarded: number;
    granted_at: string;
  }>).map((row) => ({
    periodType: row.period_type,
    periodKey: row.period_key,
    pointsAwarded: row.points_awarded,
    grantedAt: row.granted_at,
  }));
}

export type { RankingRewardGrantRow };
