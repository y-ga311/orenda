import type { SupabaseClient } from "@supabase/supabase-js";

export type FollowRelation = "none" | "following" | "follower" | "mutual";

type FollowEdge = {
  follower_gakusei_id: string;
  followee_gakusei_id: string;
};

export function resolveFollowRelation({
  iFollowThem,
  theyFollowMe,
}: {
  iFollowThem: boolean;
  theyFollowMe: boolean;
}): FollowRelation {
  if (iFollowThem && theyFollowMe) {
    return "mutual";
  }
  if (iFollowThem) {
    return "following";
  }
  if (theyFollowMe) {
    return "follower";
  }
  return "none";
}

/** 自分と対象一覧のあいだのフォロー関係を一括取得 */
export async function fetchFollowRelations(
  supabase: SupabaseClient,
  currentGakuseiId: string,
  targetGakuseiIds: string[],
): Promise<{ relations: Map<string, FollowRelation>; error: string | null }> {
  const targets = [...new Set(targetGakuseiIds.filter((id) => id && id !== currentGakuseiId))];
  const relations = new Map<string, FollowRelation>();

  for (const id of targets) {
    relations.set(id, "none");
  }

  if (targets.length === 0) {
    return { relations, error: null };
  }

  const [{ data: outgoing, error: outError }, { data: incoming, error: inError }] =
    await Promise.all([
      supabase
        .from("student_follows")
        .select("follower_gakusei_id, followee_gakusei_id")
        .eq("follower_gakusei_id", currentGakuseiId)
        .in("followee_gakusei_id", targets),
      supabase
        .from("student_follows")
        .select("follower_gakusei_id, followee_gakusei_id")
        .eq("followee_gakusei_id", currentGakuseiId)
        .in("follower_gakusei_id", targets),
    ]);

  if (outError || inError) {
    const message = outError?.message ?? inError?.message ?? "follow fetch failed";
    if (
      message.includes("student_follows") ||
      message.includes("does not exist") ||
      message.includes("schema cache")
    ) {
      return { relations, error: null };
    }
    return { relations, error: message };
  }

  const iFollow = new Set(
    ((outgoing ?? []) as FollowEdge[]).map((row) => row.followee_gakusei_id),
  );
  const theyFollow = new Set(
    ((incoming ?? []) as FollowEdge[]).map((row) => row.follower_gakusei_id),
  );

  for (const id of targets) {
    relations.set(
      id,
      resolveFollowRelation({
        iFollowThem: iFollow.has(id),
        theyFollowMe: theyFollow.has(id),
      }),
    );
  }

  return { relations, error: null };
}

export async function areMutualFollows(
  supabase: SupabaseClient,
  a: string,
  b: string,
): Promise<{ mutual: boolean; error: string | null }> {
  if (!a || !b || a === b) {
    return { mutual: false, error: null };
  }

  const { relations, error } = await fetchFollowRelations(supabase, a, [b]);
  if (error) {
    return { mutual: false, error };
  }

  return { mutual: relations.get(b) === "mutual", error: null };
}

export async function followStudent(
  supabase: SupabaseClient,
  followerGakuseiId: string,
  followeeGakuseiId: string,
): Promise<{ error: string | null }> {
  if (!followerGakuseiId || !followeeGakuseiId) {
    return { error: "フォロー先が不正です。" };
  }
  if (followerGakuseiId === followeeGakuseiId) {
    return { error: "自分自身はフォローできません。" };
  }

  const { error } = await supabase.from("student_follows").upsert(
    {
      follower_gakusei_id: followerGakuseiId,
      followee_gakusei_id: followeeGakuseiId,
    },
    { onConflict: "follower_gakusei_id,followee_gakusei_id", ignoreDuplicates: true },
  );

  if (error) {
    if (
      error.message.includes("student_follows") ||
      error.message.includes("does not exist")
    ) {
      return {
        error:
          "student_follows テーブルがありません。Supabase で docs/sql/create-student-follows.sql を実行してください。",
      };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function unfollowStudent(
  supabase: SupabaseClient,
  followerGakuseiId: string,
  followeeGakuseiId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("student_follows")
    .delete()
    .eq("follower_gakusei_id", followerGakuseiId)
    .eq("followee_gakusei_id", followeeGakuseiId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function listMutualFollowIds(
  supabase: SupabaseClient,
  currentGakuseiId: string,
): Promise<{ ids: string[]; error: string | null }> {
  const [{ data: outgoing, error: outError }, { data: incoming, error: inError }] =
    await Promise.all([
      supabase
        .from("student_follows")
        .select("followee_gakusei_id")
        .eq("follower_gakusei_id", currentGakuseiId),
      supabase
        .from("student_follows")
        .select("follower_gakusei_id")
        .eq("followee_gakusei_id", currentGakuseiId),
    ]);

  if (outError || inError) {
    const message = outError?.message ?? inError?.message ?? "follow list failed";
    if (
      message.includes("student_follows") ||
      message.includes("does not exist")
    ) {
      return { ids: [], error: null };
    }
    return { ids: [], error: message };
  }

  const following = new Set(
    ((outgoing ?? []) as { followee_gakusei_id: string }[]).map(
      (row) => row.followee_gakusei_id,
    ),
  );
  const followers = new Set(
    ((incoming ?? []) as { follower_gakusei_id: string }[]).map(
      (row) => row.follower_gakusei_id,
    ),
  );

  return {
    ids: [...following].filter((id) => followers.has(id)),
    error: null,
  };
}
