import type { SupabaseClient } from "@supabase/supabase-js";

export type MedalTier = "G" | "S" | "C";

export type MedalAchievementRow = {
  id: string;
  title: string;
  description: string;
  medal_no: string;
  tier: MedalTier;
  sort_order: number;
  is_active: boolean;
};

export type StudentMedalItem = {
  id: string;
  title: string;
  description: string;
  medalNo: string;
  tier: MedalTier;
  imageKey: string;
  unlocked: boolean;
  grantedAt: string | null;
  /** 同じクラスの学生のうち、このメダルを取得している割合（0–100）。クラス未設定時は null */
  classUnlockPercent: number | null;
};

type StudentMedalGrantRow = {
  achievement_id: string;
  granted_at: string;
};

function parseMedalTier(value: unknown): MedalTier | null {
  if (value === "G" || value === "S" || value === "C") {
    return value;
  }

  return null;
}

function mapMedalAchievementRow(row: Record<string, unknown>): MedalAchievementRow | null {
  const tier = parseMedalTier(row.tier);

  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.description !== "string" ||
    typeof row.medal_no !== "string" ||
    typeof row.sort_order !== "number" ||
    typeof row.is_active !== "boolean" ||
    !tier
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    medal_no: row.medal_no,
    tier,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

export async function fetchMedalAchievements(
  supabase: SupabaseClient,
): Promise<{ achievements: MedalAchievementRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("medal_achievements")
    .select("id, title, description, medal_no, tier, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return { achievements: [], error: error.message };
  }

  const achievements = ((data ?? []) as Record<string, unknown>[])
    .map((row) => mapMedalAchievementRow(row))
    .filter((row): row is MedalAchievementRow => row !== null);

  return { achievements, error: null };
}

export async function fetchStudentMedalGrantIds(
  supabase: SupabaseClient,
  gakuseiId: string,
): Promise<{
  grantIds: string[];
  grantsByAchievementId: Map<string, string>;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("student_medal_grants")
    .select("achievement_id, granted_at")
    .eq("gakusei_id", gakuseiId);

  if (error) {
    return {
      grantIds: [],
      grantsByAchievementId: new Map(),
      error: error.message,
    };
  }

  const grantsByAchievementId = new Map<string, string>();

  for (const row of (data ?? []) as StudentMedalGrantRow[]) {
    if (typeof row.achievement_id !== "string") {
      continue;
    }

    grantsByAchievementId.set(
      row.achievement_id,
      typeof row.granted_at === "string" ? row.granted_at : "",
    );
  }

  return {
    grantIds: [...grantsByAchievementId.keys()],
    grantsByAchievementId,
    error: null,
  };
}

/** クラス取得率を出さないメダル（タイトル部分一致） */
const CLASS_UNLOCK_PERCENT_HIDDEN_TITLE_MARKERS = [
  "球技大会",
  "模擬試験",
  "定期試験１位",
  "定期試験1位",
] as const;

export function shouldShowMedalClassUnlockPercent(title: string): boolean {
  return !CLASS_UNLOCK_PERCENT_HIDDEN_TITLE_MARKERS.some((marker) =>
    title.includes(marker),
  );
}

export function buildStudentMedalList(
  achievements: readonly MedalAchievementRow[],
  grantsByAchievementId: ReadonlyMap<string, string>,
  classUnlockPercentByAchievementId?: ReadonlyMap<string, number>,
): StudentMedalItem[] {
  return achievements.map((achievement) => {
    const grantedAt = grantsByAchievementId.get(achievement.id) ?? null;
    const classUnlockPercent =
      shouldShowMedalClassUnlockPercent(achievement.title)
        ? (classUnlockPercentByAchievementId?.get(achievement.id) ?? null)
        : null;

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      medalNo: achievement.medal_no,
      tier: achievement.tier,
      imageKey: `${achievement.medal_no}${achievement.tier}`,
      unlocked: grantedAt !== null,
      grantedAt,
      classUnlockPercent,
    };
  });
}

/**
 * ログイン学生と同じ class の学生について、各メダルの取得率（%）を返す。
 * クラス未設定・同学級0人のときは空 Map。
 */
export async function fetchClassMedalUnlockRates(
  supabase: SupabaseClient,
  gakuseiId: string,
  achievementIds: readonly string[],
): Promise<{
  ratesByAchievementId: Map<string, number>;
  classStudentCount: number;
  error: string | null;
}> {
  const empty = {
    ratesByAchievementId: new Map<string, number>(),
    classStudentCount: 0,
    error: null as string | null,
  };

  if (achievementIds.length === 0) {
    return empty;
  }

  const { data: me, error: meError } = await supabase
    .from("students")
    .select("class")
    .eq("gakusei_id", gakuseiId)
    .maybeSingle();

  if (meError) {
    return { ...empty, error: meError.message };
  }

  const className =
    typeof me?.class === "string" ? me.class.trim() : "";

  if (!className) {
    return empty;
  }

  const { data: classmates, error: classError } = await supabase
    .from("students")
    .select("gakusei_id")
    .eq("class", className);

  if (classError) {
    return { ...empty, error: classError.message };
  }

  const classmateIds = ((classmates ?? []) as Array<{ gakusei_id: string }>)
    .map((row) => row.gakusei_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (classmateIds.length === 0) {
    return empty;
  }

  const { data: grants, error: grantsError } = await supabase
    .from("student_medal_grants")
    .select("achievement_id, gakusei_id")
    .in("gakusei_id", classmateIds)
    .in("achievement_id", [...achievementIds]);

  if (grantsError) {
    return { ...empty, error: grantsError.message };
  }

  const holdersByAchievement = new Map<string, Set<string>>();

  for (const row of (grants ?? []) as Array<{
    achievement_id: string | null;
    gakusei_id: string | null;
  }>) {
    if (
      typeof row.achievement_id !== "string" ||
      typeof row.gakusei_id !== "string"
    ) {
      continue;
    }

    const holders = holdersByAchievement.get(row.achievement_id);
    if (holders) {
      holders.add(row.gakusei_id);
    } else {
      holdersByAchievement.set(row.achievement_id, new Set([row.gakusei_id]));
    }
  }

  const ratesByAchievementId = new Map<string, number>();
  const denominator = classmateIds.length;

  for (const achievementId of achievementIds) {
    const holders = holdersByAchievement.get(achievementId)?.size ?? 0;
    ratesByAchievementId.set(
      achievementId,
      Math.round((holders / denominator) * 100),
    );
  }

  return {
    ratesByAchievementId,
    classStudentCount: denominator,
    error: null,
  };
}
