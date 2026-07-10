import type { SupabaseClient } from "@supabase/supabase-js";

export function parseOwnedCardNos(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  for (const entry of value) {
    if (typeof entry !== "number" || !Number.isInteger(entry) || entry < 1 || entry > 99) continue;
    seen.add(entry);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

export async function fetchOwnedCardNos(
  supabase: SupabaseClient,
  studentId: string,
): Promise<{ nos: number[]; error: string | null }> {
  const { data, error } = await supabase
    .from("students")
    .select("owned_card_nos")
    .eq("gakusei_id", studentId)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("owned_card_nos") ||
      error.message.includes("column") ||
      error.message.includes("does not exist")
    ) {
      return { nos: [], error: null };
    }
    return { nos: [], error: error.message };
  }

  return {
    nos: parseOwnedCardNos((data as { owned_card_nos?: unknown } | null)?.owned_card_nos),
    error: null,
  };
}

export async function appendOwnedCard(
  supabase: SupabaseClient,
  studentId: string,
  cardNo: number,
): Promise<{ error: string | null }> {
  const { nos, error: fetchError } = await fetchOwnedCardNos(supabase, studentId);
  if (fetchError) return { error: fetchError };

  const next = nos.includes(cardNo) ? nos : [...nos, cardNo].sort((a, b) => a - b);

  const { error } = await supabase
    .from("students")
    .update({ owned_card_nos: next })
    .eq("gakusei_id", studentId);

  if (error) {
    if (
      error.message.includes("owned_card_nos") ||
      error.message.includes("column") ||
      error.message.includes("does not exist")
    ) {
      return {
        error:
          "owned_card_nos カラムがありません。Supabase で docs/sql/add-students-owned-cards.sql を実行してください。",
      };
    }
    return { error: error.message };
  }

  return { error: null };
}
