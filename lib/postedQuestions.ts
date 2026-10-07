import type { SupabaseClient } from "@supabase/supabase-js";
import { awardStudentGachaPoints } from "@/lib/awardStudentGachaPoints";
import { GACHA_POINTS_PER_POSTED_QUESTION_LIKE } from "@/lib/gachaConstants";

export const POSTED_QUESTION_BODY_MAX = 800;
export const POSTED_QUESTION_CHOICE_MAX = 200;
export const POSTED_QUESTION_EXPLANATION_MAX = 800;
export const POSTED_QUESTION_LIST_LIMIT = 40;

/** クエスト科目と同じ ID / 表示名 */
export const POSTED_QUESTION_SUBJECTS = [
  { id: "kaibou", label: "解剖学" },
  { id: "seiri", label: "生理学" },
  { id: "byouri", label: "病理学概論" },
  { id: "souron", label: "臨床医学総論" },
  { id: "kakuron", label: "臨床医学各論" },
  { id: "reha", label: "リハビリテーション医学" },
  { id: "tougai", label: "東洋医学概論" },
  { id: "keiketu", label: "経絡経穴概論" },
  { id: "tourin", label: "東洋医学臨床論" },
  { id: "hari", label: "はり理論" },
  { id: "kyu", label: "きゅう理論" },
  { id: "iryogairon", label: "医療概論" },
  { id: "eisei", label: "衛生学・公衆衛生学" },
  { id: "kankeihouki", label: "関係法規" },
] as const;

export type PostedQuestionSubjectId =
  (typeof POSTED_QUESTION_SUBJECTS)[number]["id"];

const postedQuestionSubjectIdSet = new Set<string>(
  POSTED_QUESTION_SUBJECTS.map((subject) => subject.id),
);

export function isPostedQuestionSubjectId(
  value: unknown,
): value is PostedQuestionSubjectId {
  return typeof value === "string" && postedQuestionSubjectIdSet.has(value);
}

export function getPostedQuestionSubjectLabel(
  subjectId: string | null | undefined,
): string {
  if (!subjectId) {
    return "科目未設定";
  }

  const found = POSTED_QUESTION_SUBJECTS.find(
    (subject) => subject.id === subjectId,
  );
  return found?.label ?? "科目未設定";
}

export type PostedQuestionSort = "recent" | "popular";

export type PostedQuestionRow = {
  id: string;
  author_gakusei_id: string;
  subject_id: string | null;
  body: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_index: number;
  explanation: string | null;
  like_count: number;
  is_active: boolean;
  created_at: string;
};

export type PostedQuestionListItem = {
  id: string;
  body: string;
  subjectId: string | null;
  subjectLabel: string;
  authorGakuseiId: string;
  authorDisplayName: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  createdAt: string;
};

export type PostedQuestionChallenge = {
  id: string;
  body: string;
  subjectId: string | null;
  subjectLabel: string;
  choices: [string, string, string, string];
  authorGakuseiId: string;
  authorDisplayName: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  createdAt: string;
};

function trimText(value: unknown, max: number): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) {
    return null;
  }
  return trimmed;
}

export function parsePostedQuestionInput(body: unknown): {
  error: string | null;
  value: {
    subjectId: PostedQuestionSubjectId;
    body: string;
    choice1: string;
    choice2: string;
    choice3: string;
    choice4: string;
    correctIndex: number;
    explanation: string;
  } | null;
} {
  const source =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;

  if (!source) {
    return { error: "リクエストが不正です。", value: null };
  }

  const subjectRaw = source.subjectId ?? source.subject_id;
  if (!isPostedQuestionSubjectId(subjectRaw)) {
    return { error: "科目を選択してください。", value: null };
  }

  const questionBody = trimText(source.body, POSTED_QUESTION_BODY_MAX);
  const choice1 = trimText(source.choice1 ?? source.choice_1, POSTED_QUESTION_CHOICE_MAX);
  const choice2 = trimText(source.choice2 ?? source.choice_2, POSTED_QUESTION_CHOICE_MAX);
  const choice3 = trimText(source.choice3 ?? source.choice_3, POSTED_QUESTION_CHOICE_MAX);
  const choice4 = trimText(source.choice4 ?? source.choice_4, POSTED_QUESTION_CHOICE_MAX);

  const correctRaw = source.correctIndex ?? source.correct_index;
  const correctIndex =
    typeof correctRaw === "number"
      ? correctRaw
      : typeof correctRaw === "string"
        ? Number(correctRaw)
        : NaN;

  let explanation = "";
  if (typeof source.explanation === "string") {
    explanation = source.explanation.trim();
    if (explanation.length > POSTED_QUESTION_EXPLANATION_MAX) {
      return { error: "解説が長すぎます。", value: null };
    }
  }

  if (!questionBody || !choice1 || !choice2 || !choice3 || !choice4) {
    return {
      error: "問題文と4つの選択肢をすべて入力してください。",
      value: null,
    };
  }

  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex > 3
  ) {
    return { error: "正解の選択肢を選んでください。", value: null };
  }

  return {
    error: null,
    value: {
      subjectId: subjectRaw,
      body: questionBody,
      choice1,
      choice2,
      choice3,
      choice4,
      correctIndex,
      explanation,
    },
  };
}

export function mapPostedQuestionListItem(
  row: PostedQuestionRow,
  authorDisplayName: string,
  currentStudentId: string,
  likedIds: ReadonlySet<string>,
): PostedQuestionListItem {
  return {
    id: row.id,
    body: row.body,
    subjectId: row.subject_id,
    subjectLabel: getPostedQuestionSubjectLabel(row.subject_id),
    authorGakuseiId: row.author_gakusei_id,
    authorDisplayName,
    likeCount: row.like_count ?? 0,
    likedByMe: likedIds.has(row.id),
    isMine: row.author_gakusei_id === currentStudentId,
    createdAt: row.created_at,
  };
}

export function mapPostedQuestionChallenge(
  row: PostedQuestionRow,
  authorDisplayName: string,
  currentStudentId: string,
  likedByMe: boolean,
): PostedQuestionChallenge {
  return {
    id: row.id,
    body: row.body,
    subjectId: row.subject_id,
    subjectLabel: getPostedQuestionSubjectLabel(row.subject_id),
    choices: [row.choice_1, row.choice_2, row.choice_3, row.choice_4],
    authorGakuseiId: row.author_gakusei_id,
    authorDisplayName,
    likeCount: row.like_count ?? 0,
    likedByMe,
    isMine: row.author_gakusei_id === currentStudentId,
    createdAt: row.created_at,
  };
}

export async function fetchPostedQuestionAuthors(
  supabase: SupabaseClient,
  authorIds: readonly string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(authorIds.filter(Boolean))];
  const names = new Map<string, string>();

  if (uniqueIds.length === 0) {
    return names;
  }

  const { data, error } = await supabase
    .from("students")
    .select("gakusei_id, nickname")
    .in("gakusei_id", uniqueIds);

  if (error) {
    console.error("[postedQuestions] authors:", error.message);
    return names;
  }

  for (const row of (data ?? []) as Array<{
    gakusei_id: string;
    nickname: string | null;
  }>) {
    names.set(
      row.gakusei_id,
      row.nickname?.trim() || "ニックネーム未設定",
    );
  }

  return names;
}

export async function fetchLikedQuestionIds(
  supabase: SupabaseClient,
  gakuseiId: string,
  questionIds: readonly string[],
): Promise<Set<string>> {
  const liked = new Set<string>();
  if (questionIds.length === 0) {
    return liked;
  }

  const { data, error } = await supabase
    .from("student_posted_question_likes")
    .select("question_id")
    .eq("gakusei_id", gakuseiId)
    .in("question_id", [...questionIds]);

  if (error) {
    console.error("[postedQuestions] likes:", error.message);
    return liked;
  }

  for (const row of (data ?? []) as Array<{ question_id: string }>) {
    if (typeof row.question_id === "string") {
      liked.add(row.question_id);
    }
  }

  return liked;
}

export async function listPostedQuestions(
  supabase: SupabaseClient,
  options: {
    currentStudentId: string;
    sort: PostedQuestionSort;
    mineOnly?: boolean;
    subjectId?: PostedQuestionSubjectId | null;
    limit?: number;
  },
): Promise<{ questions: PostedQuestionListItem[]; error: string | null }> {
  const limit = Math.min(
    Math.max(options.limit ?? POSTED_QUESTION_LIST_LIMIT, 1),
    80,
  );

  let query = supabase
    .from("student_posted_questions")
    .select(
      "id, author_gakusei_id, subject_id, body, choice_1, choice_2, choice_3, choice_4, correct_index, explanation, like_count, is_active, created_at",
    )
    .eq("is_active", true);

  if (options.mineOnly) {
    query = query.eq("author_gakusei_id", options.currentStudentId);
  }

  if (options.subjectId) {
    query = query.eq("subject_id", options.subjectId);
  }

  if (options.sort === "popular") {
    query = query
      .order("like_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    return { questions: [], error: error.message };
  }

  const rows = (data ?? []) as PostedQuestionRow[];
  const authorNames = await fetchPostedQuestionAuthors(
    supabase,
    rows.map((row) => row.author_gakusei_id),
  );
  const likedIds = await fetchLikedQuestionIds(
    supabase,
    options.currentStudentId,
    rows.map((row) => row.id),
  );

  return {
    questions: rows.map((row) =>
      mapPostedQuestionListItem(
        row,
        authorNames.get(row.author_gakusei_id) ?? "ニックネーム未設定",
        options.currentStudentId,
        likedIds,
      ),
    ),
    error: null,
  };
}

export async function createPostedQuestion(
  supabase: SupabaseClient,
  authorGakuseiId: string,
  input: {
    subjectId: PostedQuestionSubjectId;
    body: string;
    choice1: string;
    choice2: string;
    choice3: string;
    choice4: string;
    correctIndex: number;
    explanation: string;
  },
): Promise<{ questionId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("student_posted_questions")
    .insert({
      author_gakusei_id: authorGakuseiId,
      subject_id: input.subjectId,
      body: input.body,
      choice_1: input.choice1,
      choice_2: input.choice2,
      choice_3: input.choice3,
      choice_4: input.choice4,
      correct_index: input.correctIndex,
      explanation: input.explanation,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { questionId: null, error: error.message };
  }

  const id = (data as { id?: string } | null)?.id;
  if (typeof id !== "string") {
    return { questionId: null, error: "投稿の保存に失敗しました。" };
  }

  return { questionId: id, error: null };
}

export async function fetchPostedQuestionById(
  supabase: SupabaseClient,
  questionId: string,
): Promise<{ row: PostedQuestionRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("student_posted_questions")
    .select(
      "id, author_gakusei_id, subject_id, body, choice_1, choice_2, choice_3, choice_4, correct_index, explanation, like_count, is_active, created_at",
    )
    .eq("id", questionId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return { row: null, error: error.message };
  }

  return { row: (data as PostedQuestionRow | null) ?? null, error: null };
}

export async function togglePostedQuestionLike(
  supabase: SupabaseClient,
  questionId: string,
  gakuseiId: string,
): Promise<{
  liked: boolean;
  likeCount: number;
  pointsAwarded: number;
  error: string | null;
}> {
  const empty = {
    liked: false,
    likeCount: 0,
    pointsAwarded: 0,
    error: null as string | null,
  };

  const { row, error: fetchError } = await fetchPostedQuestionById(
    supabase,
    questionId,
  );

  if (fetchError) {
    return { ...empty, error: fetchError };
  }

  if (!row) {
    return { ...empty, error: "問題が見つかりません。" };
  }

  if (row.author_gakusei_id === gakuseiId) {
    return {
      ...empty,
      likeCount: row.like_count ?? 0,
      error: "自分の投稿にはいいねできません。",
    };
  }

  const { data: existing, error: existingError } = await supabase
    .from("student_posted_question_likes")
    .select("question_id")
    .eq("question_id", questionId)
    .eq("gakusei_id", gakuseiId)
    .maybeSingle();

  if (existingError) {
    return {
      liked: false,
      likeCount: row.like_count,
      pointsAwarded: 0,
      error: existingError.message,
    };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("student_posted_question_likes")
      .delete()
      .eq("question_id", questionId)
      .eq("gakusei_id", gakuseiId);

    if (deleteError) {
      return {
        liked: true,
        likeCount: row.like_count,
        pointsAwarded: 0,
        error: deleteError.message,
      };
    }

    const nextCount = Math.max(0, (row.like_count ?? 0) - 1);
    const { error: updateError } = await supabase
      .from("student_posted_questions")
      .update({ like_count: nextCount, updated_at: new Date().toISOString() })
      .eq("id", questionId);

    if (updateError) {
      return {
        liked: false,
        likeCount: nextCount,
        pointsAwarded: 0,
        error: updateError.message,
      };
    }

    return {
      liked: false,
      likeCount: nextCount,
      pointsAwarded: 0,
      error: null,
    };
  }

  const { error: insertError } = await supabase
    .from("student_posted_question_likes")
    .insert({ question_id: questionId, gakusei_id: gakuseiId });

  if (insertError) {
    return {
      liked: false,
      likeCount: row.like_count,
      pointsAwarded: 0,
      error: insertError.message,
    };
  }

  const nextCount = (row.like_count ?? 0) + 1;
  const { error: updateError } = await supabase
    .from("student_posted_questions")
    .update({ like_count: nextCount, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (updateError) {
    return {
      liked: true,
      likeCount: nextCount,
      pointsAwarded: 0,
      error: updateError.message,
    };
  }

  // 同一ユーザーからの初回いいねのみ投稿者へポイント付与（解除後の再いいねは台帳で抑止）
  let pointsAwarded = 0;
  const { error: rewardInsertError } = await supabase
    .from("student_posted_question_like_rewards")
    .insert({
      question_id: questionId,
      liker_gakusei_id: gakuseiId,
      author_gakusei_id: row.author_gakusei_id,
      points_awarded: GACHA_POINTS_PER_POSTED_QUESTION_LIKE,
    });

  const isDuplicateReward =
    typeof rewardInsertError?.code === "string" &&
    rewardInsertError.code === "23505";

  if (rewardInsertError && !isDuplicateReward) {
    console.error(
      "[postedQuestions] like reward insert:",
      rewardInsertError.message,
    );
  } else if (!rewardInsertError) {
    const award = await awardStudentGachaPoints(
      supabase,
      row.author_gakusei_id,
      GACHA_POINTS_PER_POSTED_QUESTION_LIKE,
    );

    if (award.ok) {
      pointsAwarded = GACHA_POINTS_PER_POSTED_QUESTION_LIKE;
    } else {
      console.error("[postedQuestions] like reward award:", award.message);
      // 台帳だけ残ると再付与できないため、失敗時は取り消す
      await supabase
        .from("student_posted_question_like_rewards")
        .delete()
        .eq("question_id", questionId)
        .eq("liker_gakusei_id", gakuseiId);
    }
  }

  return {
    liked: true,
    likeCount: nextCount,
    pointsAwarded,
    error: null,
  };
}

export async function deactivatePostedQuestion(
  supabase: SupabaseClient,
  questionId: string,
  authorGakuseiId: string,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase
    .from("student_posted_questions")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", questionId)
    .eq("author_gakusei_id", authorGakuseiId)
    .eq("is_active", true)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!(data as { id?: string } | null)?.id) {
    return { error: "問題が見つからないか、削除できません。" };
  }

  return { error: null };
}
