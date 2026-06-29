import {
  getQuestSubcategoryLabel,
  type QuestQuestionCount,
} from "@/lib/questSubcategories";

export type QuestQuestion = {
  id: number;
  body: string;
  choices: [string, string, string, string];
  /** 正解の選択肢インデックス（0〜3） */
  correctIndex: number;
  /** 正解・不正解後に表示する解説 */
  explanation: string;
};

type QuestQuestionContext = {
  subjectId: string;
  subjectTitle: string;
  subcategoryId: string | null;
  questionNumber: number;
  questionCount: number;
};

const defaultQuestion: QuestQuestion = {
  id: 1,
  body: "問題文がここに表示されます。次のうち誤っているものを1つ選んでください。",
  choices: ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  correctIndex: 1,
  explanation:
    "選択肢2が誤りです。ここに解説テキストが表示されます。正しい理解のために要点を確認しましょう。",
};

function buildQuestionBody(context: QuestQuestionContext): string {
  const subcategoryLabel = getQuestSubcategoryLabel(
    context.subjectId,
    context.subcategoryId,
  );

  return `${context.subjectTitle}（${subcategoryLabel}）の問題です。次のうち誤っているものを1つ選んでください。`;
}

function buildExplanation(context: QuestQuestionContext): string {
  const subcategoryLabel = getQuestSubcategoryLabel(
    context.subjectId,
    context.subcategoryId,
  );

  return `${subcategoryLabel}に関する解説です。${context.subjectTitle}の要点を確認し、他の選択肢との違いを整理しましょう。`;
}

/** 科目・中分類・問題番号に応じた仮データ（Supabase 連携前） */
export function getQuestQuestion(context: QuestQuestionContext): QuestQuestion {
  const bySubject: Record<string, Partial<QuestQuestion>> = {
    kaibou: {
      body: "解剖学について、正しいものを1つ選んでください。",
      choices: [
        "人体は左右対称である",
        "骨はすべて長骨である",
        "心臓は4つの部屋に分かれる",
        "肺は左3葉・右2葉である",
      ],
      correctIndex: 2,
      explanation:
        "心臓は右心房・右心室・左心房・左心室の4つの部屋に分かれています。「骨はすべて長骨」や「肺は左3葉・右2葉」は誤りです。",
    },
    seiri: {
      body: "生理学について、誤っているものを1つ選んでください。",
      choices: [
        "赤血球は酸素を運ぶ",
        "腎臓は老廃物をろ過する",
        "神経伝達はすべて電気信号のみで行われる",
        "体温調節には汗腺が関与する",
      ],
      correctIndex: 2,
      explanation:
        "シナプスでは化学伝達物質（神経伝達物質）による伝達も行われます。すべてが電気信号だけではありません。",
    },
  };

  const subjectQuestion = bySubject[context.subjectId];

  if (subjectQuestion) {
    return {
      id: context.questionNumber,
      body: subjectQuestion.body ?? buildQuestionBody(context),
      choices: subjectQuestion.choices ?? defaultQuestion.choices,
      correctIndex: subjectQuestion.correctIndex ?? defaultQuestion.correctIndex,
      explanation: subjectQuestion.explanation ?? buildExplanation(context),
    };
  }

  return {
    ...defaultQuestion,
    id: context.questionNumber,
    body: buildQuestionBody(context),
    explanation: buildExplanation(context),
  };
}

export function isQuestAnswerCorrect(
  question: Pick<QuestQuestion, "correctIndex">,
  selectedIndex: number | null,
): boolean {
  return selectedIndex !== null && selectedIndex === question.correctIndex;
}

export type { QuestQuestionCount };
