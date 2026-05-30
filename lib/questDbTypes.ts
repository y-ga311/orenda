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
};

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
  };
}
