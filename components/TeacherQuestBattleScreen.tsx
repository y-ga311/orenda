"use client";

import Image, { type StaticImageData } from "next/image";
import teacherQuestBackground from "@/source-images/teachar_quest/000background.png";
import playerCharaImage from "@/source-images/teachar_quest/00chara.png";
import {
  formatNationalExamSource,
  type QuestSessionQuestion,
} from "@/lib/questDbTypes";
import {
  getTeacherQuestFeedbackMessage,
  getTeacherQuestIntroMessage,
} from "@/lib/teacherQuestSprites";

export type TeacherQuestPhase = "intro" | "choice" | "feedback";

type TeacherQuestBattleScreenProps = {
  teacherSprite: StaticImageData;
  phase: TeacherQuestPhase;
  question: QuestSessionQuestion;
  questionIndex: number;
  questionCount: number;
  selectedChoice: number | null;
  answerSubmitted: boolean;
  isCompleting: boolean;
  isLastQuestion: boolean;
  completeMessage: string;
  onBack: () => void;
  onIntroContinue: () => void;
  onSelectChoice: (index: number) => void;
  onFeedbackContinue: () => void;
};

function getTeacherChoiceClassName(
  index: number,
  correctIndex: number,
  selectedChoice: number | null,
  answerSubmitted: boolean,
): string {
  if (!answerSubmitted || selectedChoice === null) {
    return "teacherQuestChoice";
  }

  if (index === selectedChoice) {
    return index === correctIndex
      ? "teacherQuestChoice teacherQuestChoiceCorrect"
      : "teacherQuestChoice teacherQuestChoiceWrong";
  }

  if (index === correctIndex) {
    return "teacherQuestChoice teacherQuestChoiceReveal";
  }

  return "teacherQuestChoice teacherQuestChoiceMuted";
}

export function TeacherQuestBattleScreen({
  teacherSprite,
  phase,
  question,
  questionIndex,
  questionCount,
  selectedChoice,
  answerSubmitted,
  isCompleting,
  isLastQuestion,
  completeMessage,
  onBack,
  onIntroContinue,
  onSelectChoice,
  onFeedbackContinue,
}: TeacherQuestBattleScreenProps) {
  const nationalExamSource = formatNationalExamSource(
    question.nationalExamRound,
    question.nationalExamQuestionNo,
  );
  const isCorrect =
    selectedChoice !== null && selectedChoice === question.correctIndex;
  const introMessage = getTeacherQuestIntroMessage(questionIndex, questionCount);
  const feedbackHeadline =
    selectedChoice !== null
      ? getTeacherQuestFeedbackMessage(isCorrect)
      : "";

  return (
    <section className="phoneFrame teacherQuestScreen" aria-label="教員クエスト">
      <button
        className="teacherQuestBackButton"
        type="button"
        onClick={onBack}
        aria-label="戻る"
      >
        ‹ 戻る
      </button>

      <div className="teacherQuestScene" aria-hidden="true">
        <div className="teacherQuestBackgroundLayer">
          <Image
            alt=""
            className="teacherQuestBackgroundImage"
            fill
            priority
            sizes="390px"
            src={teacherQuestBackground}
          />
        </div>

        <div className="teacherQuestTeacherSprite">
          <Image
            alt=""
            className="teacherQuestTeacherImage"
            fill
            key={teacherSprite.src}
            priority
            sizes="220px"
            src={teacherSprite}
          />
        </div>

        <div className="teacherQuestPlayerSprite">
          <Image
            alt=""
            className="teacherQuestPlayerImage"
            fill
            priority
            sizes="284px"
            src={playerCharaImage}
          />
        </div>
      </div>

      {phase === "intro" ? (
        <div className="teacherQuestDialoguePanel">
          <p className="teacherQuestDialogueText">{introMessage}</p>
          <button
            className="teacherQuestContinueButton"
            type="button"
            onClick={onIntroContinue}
            aria-label="次へ"
          >
            ▼
          </button>
        </div>
      ) : null}

      {phase === "choice" ? (
        <div className="teacherQuestChoicePanel">
          <article className="teacherQuestQuestionBox">
            {nationalExamSource ? (
              <p className="teacherQuestQuestionSource">{nationalExamSource}</p>
            ) : null}
            <p className="teacherQuestQuestionText">{question.body}</p>
          </article>

          <div
            className="teacherQuestChoices"
            role="listbox"
            aria-label={`問${questionIndex + 1}の選択肢`}
          >
            {question.choices.map((choice, index) => (
              <button
                className={getTeacherChoiceClassName(
                  index,
                  question.correctIndex,
                  selectedChoice,
                  answerSubmitted,
                )}
                key={`teacher-choice-${questionIndex}-${index}`}
                type="button"
                role="option"
                aria-selected={selectedChoice === index}
                disabled={answerSubmitted}
                onClick={() => onSelectChoice(index)}
              >
                <span className="teacherQuestChoiceBadge" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="teacherQuestChoiceLabel">{choice}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "feedback" && selectedChoice !== null ? (
        <div className="teacherQuestDialoguePanel">
          <p
            className={
              isCorrect
                ? "teacherQuestFeedbackHeadline teacherQuestFeedbackHeadlineCorrect"
                : "teacherQuestFeedbackHeadline teacherQuestFeedbackHeadlineWrong"
            }
          >
            {feedbackHeadline}
          </p>
          <p className="teacherQuestDialogueText">{question.explanation}</p>
          <button
            className="teacherQuestContinueButton"
            type="button"
            disabled={isCompleting}
            onClick={onFeedbackContinue}
            aria-label={isLastQuestion ? "結果を見る" : "次の問題へ"}
          >
            {isCompleting ? "…" : "▼"}
          </button>
          {completeMessage ? (
            <p className="teacherQuestCompleteMessage" role="alert">
              {completeMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
