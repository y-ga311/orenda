import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapQuestQuestionRow,
  type QuestQuestionDbRow,
  type QuestSessionQuestion,
  type QuestSubcategoryRow,
} from "@/lib/questDbTypes";

type SubcategoryDbRow = {
  id: string;
  label: string;
  sort_order: number;
};

type QuestionCountDbRow = {
  subcategory_id: string;
  question_count: number;
};

type SubjectQuestionCountDbRow = {
  subject_id: string;
  question_count: number;
};

export async function fetchQuestSubcategories(
  supabase: SupabaseClient,
  subjectId: string,
): Promise<{ subcategories: QuestSubcategoryRow[]; error: string | null }> {
  const { data: subcategoryRows, error: subcategoryError } = await supabase
    .from("quest_subcategories")
    .select("id, label, sort_order")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (subcategoryError) {
    return { subcategories: [], error: subcategoryError.message };
  }

  const subcategories = (subcategoryRows ?? []) as SubcategoryDbRow[];

  if (subcategories.length === 0) {
    return { subcategories: [], error: null };
  }

  const subcategoryIds = subcategories.map((row) => row.id);

  const { data: countRows, error: countError } = await supabase
    .from("quest_subcategory_question_counts")
    .select("subcategory_id, question_count")
    .eq("subject_id", subjectId)
    .in("subcategory_id", subcategoryIds);

  if (countError) {
    return { subcategories: [], error: countError.message };
  }

  const countBySubcategoryId = new Map<string, number>(
    ((countRows ?? []) as QuestionCountDbRow[]).map((row) => [
      row.subcategory_id,
      row.question_count,
    ]),
  );

  return {
    subcategories: subcategories.map((row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sort_order,
      questionCount: countBySubcategoryId.get(row.id) ?? 0,
    })),
    error: null,
  };
}

export async function fetchQuestSubjectQuestionCounts(
  supabase: SupabaseClient,
  subjectIds: string[],
): Promise<{ counts: Record<string, number>; error: string | null }> {
  if (subjectIds.length === 0) {
    return { counts: {}, error: null };
  }

  const { data, error } = await supabase
    .from("quest_subcategory_question_counts")
    .select("subject_id, question_count")
    .in("subject_id", subjectIds);

  if (error) {
    return { counts: {}, error: error.message };
  }

  const counts: Record<string, number> = Object.fromEntries(
    subjectIds.map((subjectId) => [subjectId, 0]),
  );

  for (const row of (data ?? []) as SubjectQuestionCountDbRow[]) {
    counts[row.subject_id] = (counts[row.subject_id] ?? 0) + row.question_count;
  }

  return { counts, error: null };
}

export async function countQuestQuestionsForSubcategories(
  supabase: SupabaseClient,
  subjectId: string,
  subcategoryIds: string[],
): Promise<number> {
  if (subcategoryIds.length === 0) {
    return 0;
  }

  const { count, error } = await supabase
    .from("quest_questions")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId)
    .in("subcategory_id", subcategoryIds)
    .eq("quest_scope", "subject")
    .eq("is_active", true);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function shuffleQuestions<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export async function fetchQuestSessionQuestions(
  supabase: SupabaseClient,
  subjectId: string,
  subcategoryIds: string[],
  questionCount: number,
): Promise<{ questions: QuestSessionQuestion[]; error: string | null }> {
  if (subcategoryIds.length === 0 || questionCount < 1) {
    return { questions: [], error: "問題の取得条件が不正です。" };
  }

  const { data, error } = await supabase
    .from("quest_questions")
    .select(
      "id, subject_id, subcategory_id, body, choice_1, choice_2, choice_3, choice_4, correct_index, explanation, sort_order",
    )
    .eq("subject_id", subjectId)
    .in("subcategory_id", subcategoryIds)
    .eq("quest_scope", "subject")
    .eq("is_active", true);

  if (error) {
    return { questions: [], error: error.message };
  }

  const rows = (data ?? []) as QuestQuestionDbRow[];

  if (rows.length === 0) {
    return { questions: [], error: "選択した中分類に問題が登録されていません。" };
  }

  const pickedRows = shuffleQuestions(rows).slice(0, questionCount);

  return {
    questions: pickedRows.map((row, index) => mapQuestQuestionRow(row, index + 1)),
    error: null,
  };
}
