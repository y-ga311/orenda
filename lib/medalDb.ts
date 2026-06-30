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

export function buildStudentMedalList(
  achievements: readonly MedalAchievementRow[],
  grantsByAchievementId: ReadonlyMap<string, string>,
): StudentMedalItem[] {
  return achievements.map((achievement) => {
    const grantedAt = grantsByAchievementId.get(achievement.id) ?? null;

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      medalNo: achievement.medal_no,
      tier: achievement.tier,
      imageKey: `${achievement.medal_no}${achievement.tier}`,
      unlocked: grantedAt !== null,
      grantedAt,
    };
  });
}
