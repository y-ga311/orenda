export type QuestSubcategoryRow = {
  id: string;
  label: string;
  sortOrder: number;
  questionCount: number;
};

export type QuestSessionQuestion = {
  questionId: string;
  displayNumber: number;
  subcategoryId: string;
  body: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  nationalExamRound: number | null;
  nationalExamQuestionNo: number | null;
};

export type QuestAnswerLogEntry = {
  questionId: string;
  questionNumber: number;
  selectedIndex: number;
  isCorrect: boolean;
};

export type QuestQuestionDbRow = {
  id: string;
  subject_id: string;
  subcategory_id: string;
  body: string;
  choice_1: string;
  choice_2: string;
  choice_3: string;
  choice_4: string;
  correct_index: number;
  explanation: string;
  sort_order: number;
  national_exam_round: number | null;
  national_exam_question_no: number | null;
};

export function formatNationalExamSource(
  round: number | null | undefined,
  questionNo: number | null | undefined,
): string | null {
  if (round == null || questionNo == null) {
    return null;
  }

  return `第${round}回 ${questionNo}問目`;
}

export function mapQuestQuestionRow(
  row: QuestQuestionDbRow,
  displayNumber: number,
): QuestSessionQuestion {
  return {
    questionId: row.id,
    displayNumber,
    subcategoryId: row.subcategory_id,
    body: row.body,
    choices: [row.choice_1, row.choice_2, row.choice_3, row.choice_4],
    correctIndex: row.correct_index,
    explanation: row.explanation,
    nationalExamRound: row.national_exam_round,
    nationalExamQuestionNo: row.national_exam_question_no,
  };
}
