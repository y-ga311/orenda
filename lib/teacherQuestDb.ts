import type { SupabaseClient } from "@supabase/supabase-js";
import { getJapanDateParts } from "@/lib/japanDate";
import type { QuestSessionQuestion } from "@/lib/questDbTypes";
import { fetchCompletedTeacherQuestIds } from "@/lib/teacherQuestCompletions";

export type TeacherQuestRow = {
  id: string;
  title: string;
  teacher_employee_number: string;
  teacher_name: string;
  publish_date: string;
  end_date: string;
  status: string;
};

export type TeacherQuestQuestionRow = {
  id: string;
  quest_id: string;
  question_number: number;
  body: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_index: number;
  explanation: string;
};

export type TeacherQuestSummary = {
  id: string;
  title: string;
  teacherEmployeeNumber: string;
  teacherName: string;
  publishDate: string;
  endDate: string;
};

export type TeacherQuestSession = {
  quest: TeacherQuestSummary;
  questions: QuestSessionQuestion[];
  questionCount: number;
};

export type TeacherQuestListItem = TeacherQuestSummary & {
  questionCount: number;
  completed: boolean;
};

function getJapanTodayDateKey() {
  const { year, month, day } = getJapanDateParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDateKey(value: string) {
  if (value.length >= 10 && value[4] === "-" && value[7] === "-") {
    return value.slice(0, 10);
  }

  const { year, month, day } = getJapanDateParts(new Date(value));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isTeacherQuestActiveOnDate(
  publishDate: string,
  endDate: string,
  todayKey = getJapanTodayDateKey(),
) {
  const publishKey = normalizeDateKey(publishDate);
  const endKey = normalizeDateKey(endDate);
  return publishKey <= todayKey && todayKey <= endKey;
}

function mapTeacherQuestSummary(row: TeacherQuestRow): TeacherQuestSummary {
  return {
    id: row.id,
    title: row.title,
    teacherEmployeeNumber: row.teacher_employee_number,
    teacherName: row.teacher_name,
    publishDate: normalizeDateKey(row.publish_date),
    endDate: normalizeDateKey(row.end_date),
  };
}

function mapTeacherQuestQuestionRow(row: TeacherQuestQuestionRow): QuestSessionQuestion {
  return {
    questionId: row.id,
    displayNumber: row.question_number,
    subcategoryId: "teacher",
    body: row.body,
    choices: [row.choice_1, row.choice_2, row.choice_3, row.choice_4],
    correctIndex: row.correct_index,
    explanation: row.explanation,
    nationalExamRound: null,
    nationalExamQuestionNo: null,
  };
}

async function fetchActiveTeacherQuestRows(
  supabase: SupabaseClient,
): Promise<{ quests: TeacherQuestRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_quests")
    .select(
      "id, title, teacher_employee_number, teacher_name, publish_date, end_date, status",
    )
    .eq("status", "published")
    .order("publish_date", { ascending: false });

  if (error) {
    return { quests: [], error: error.message };
  }

  const activeQuests = ((data ?? []) as TeacherQuestRow[]).filter((row) =>
    isTeacherQuestActiveOnDate(row.publish_date, row.end_date),
  );

  return { quests: activeQuests, error: null };
}

/**
 * 公開中かつ今日（JST）が掲載期間内の教員クエスト一覧を返す。
 */
export async function fetchActiveTeacherQuestList(
  supabase: SupabaseClient,
  studentId?: string | null,
): Promise<{ quests: TeacherQuestListItem[]; error: string | null }> {
  const { quests, error } = await fetchActiveTeacherQuestRows(supabase);

  if (error) {
    return { quests: [], error };
  }

  if (quests.length === 0) {
    return { quests: [], error: null };
  }

  const questIds = quests.map((quest) => quest.id);
  const { data: questionRows, error: questionCountError } = await supabase
    .from("teacher_quest_questions")
    .select("quest_id")
    .in("quest_id", questIds);

  if (questionCountError) {
    return { quests: [], error: questionCountError.message };
  }

  const questionCountByQuestId = new Map<string, number>();

  for (const row of (questionRows ?? []) as { quest_id: string }[]) {
    questionCountByQuestId.set(
      row.quest_id,
      (questionCountByQuestId.get(row.quest_id) ?? 0) + 1,
    );
  }

  let completedIds: string[] = [];

  if (studentId) {
    const completedResult = await fetchCompletedTeacherQuestIds(supabase, studentId);
    if (completedResult.error) {
      return { quests: [], error: completedResult.error };
    }

    completedIds = completedResult.ids;
  }

  const completedIdSet = new Set(completedIds);

  const list = quests
    .map((row) => ({
      ...mapTeacherQuestSummary(row),
      questionCount: questionCountByQuestId.get(row.id) ?? 0,
      completed: completedIdSet.has(row.id),
    }))
    .filter((quest) => quest.questionCount > 0);

  return { quests: list, error: null };
}

export async function fetchTeacherQuestQuestions(
  supabase: SupabaseClient,
  questId: string,
): Promise<{ questions: QuestSessionQuestion[]; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_quest_questions")
    .select(
      "id, quest_id, question_number, body, choice_1, choice_2, choice_3, choice_4, correct_index, explanation",
    )
    .eq("quest_id", questId)
    .order("question_number", { ascending: true });

  if (error) {
    return { questions: [], error: error.message };
  }

  const questions = ((data ?? []) as TeacherQuestQuestionRow[]).map(
    mapTeacherQuestQuestionRow,
  );

  if (questions.length === 0) {
    return { questions: [], error: "教員クエストに問題が登録されていません。" };
  }

  return { questions, error: null };
}

export async function fetchTeacherQuestSessionById(
  supabase: SupabaseClient,
  questId: string,
): Promise<{ session: TeacherQuestSession | null; error: string | null }> {
  const { data, error } = await supabase
    .from("teacher_quests")
    .select(
      "id, title, teacher_employee_number, teacher_name, publish_date, end_date, status",
    )
    .eq("id", questId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return { session: null, error: error.message };
  }

  const quest = (data as TeacherQuestRow | null) ?? null;

  if (!quest || !isTeacherQuestActiveOnDate(quest.publish_date, quest.end_date)) {
    return { session: null, error: "指定された教員クエストは現在利用できません。" };
  }

  const { questions, error: questionsError } = await fetchTeacherQuestQuestions(
    supabase,
    quest.id,
  );

  if (questionsError) {
    return { session: null, error: questionsError };
  }

  return {
    session: {
      quest: mapTeacherQuestSummary(quest),
      questions,
      questionCount: questions.length,
    },
    error: null,
  };
}
