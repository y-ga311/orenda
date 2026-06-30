import type { SupabaseClient } from "@supabase/supabase-js";

export function parseCompletedTeacherQuestIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();
    if (!trimmed || ids.includes(trimmed)) {
      continue;
    }

    ids.push(trimmed);
  }

  return ids;
}

export async function fetchCompletedTeacherQuestIds(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ ids: string[]; error: string | null }> {
  const { data, error } = await supabase
    .from("students")
    .select("completed_teacher_quest_ids")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("completed_teacher_quest_ids")) {
      return { ids: [], error: null };
    }

    return { ids: [], error: error.message };
  }

  return {
    ids: parseCompletedTeacherQuestIds(
      (data as { completed_teacher_quest_ids?: unknown } | null)
        ?.completed_teacher_quest_ids,
    ),
    error: null,
  };
}

export function hasCompletedTeacherQuest(
  completedIds: readonly string[],
  teacherQuestId: string,
): boolean {
  return completedIds.includes(teacherQuestId.trim());
}

export async function appendTeacherQuestCompletion(
  supabase: SupabaseClient,
  studentId: string,
  teacherQuestId: string,
): Promise<{ appended: boolean; error: string | null }> {
  const questId = teacherQuestId.trim();

  if (!questId) {
    return { appended: false, error: "教員クエストIDが不正です。" };
  }

  const { data, error } = await supabase.rpc("append_teacher_quest_completion", {
    p_gakusei_id: studentId,
    p_teacher_quest_id: questId,
  });

  if (!error) {
    return { appended: data === true, error: null };
  }

  const haystack = `${error.message ?? ""} ${"details" in error ? String(error.details ?? "") : ""} ${"hint" in error ? String(error.hint ?? "") : ""}`.toLowerCase();

  const rpcUnavailable =
    haystack.includes("could not find") ||
    haystack.includes("schema cache") ||
    haystack.includes("does not exist") ||
    (haystack.includes("append_teacher_quest_completion") &&
      haystack.includes("function"));

  if (!rpcUnavailable) {
    return { appended: false, error: error.message };
  }

  const { ids, error: fetchError } = await fetchCompletedTeacherQuestIds(
    supabase,
    studentId,
  );

  if (fetchError) {
    return { appended: false, error: fetchError };
  }

  if (hasCompletedTeacherQuest(ids, questId)) {
    return { appended: false, error: null };
  }

  const { error: updateError } = await supabase
    .from("students")
    .update({ completed_teacher_quest_ids: [...ids, questId] })
    .eq("gakusei_id", studentId);

  if (updateError) {
    if (updateError.message.includes("completed_teacher_quest_ids")) {
      return {
        appended: false,
        error:
          "completed_teacher_quest_ids カラムがありません。Supabase で docs/sql/add-students-completed-teacher-quest-ids.sql を実行してください。",
      };
    }

    return { appended: false, error: updateError.message };
  }

  return { appended: true, error: null };
}

export async function removeTeacherQuestCompletion(
  supabase: SupabaseClient,
  studentId: string,
  teacherQuestId: string,
): Promise<void> {
  const questId = teacherQuestId.trim();
  const { ids, error } = await fetchCompletedTeacherQuestIds(supabase, studentId);

  if (error || !hasCompletedTeacherQuest(ids, questId)) {
    return;
  }

  await supabase
    .from("students")
    .update({
      completed_teacher_quest_ids: ids.filter((id) => id !== questId),
    })
    .eq("gakusei_id", studentId);
}
