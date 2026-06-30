"use client";

import { useEffect } from "react";
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

export type TeacherQuestPhase = "encounter" | "intro" | "choice" | "feedback";

const ENCOUNTER_ANIMATION_MS = 620;

type TeacherQuestBattleScreenProps = {
  teacherName: string;
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
  onEncounterComplete: () => void;
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
  teacherName,
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
  onEncounterComplete,
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
  const introMessage = getTeacherQuestIntroMessage(
    questionIndex,
    questionCount,
    teacherName,
  );
  const feedbackHeadline =
    selectedChoice !== null
      ? getTeacherQuestFeedbackMessage(isCorrect)
      : "";
  const isEncounterPhase = phase === "encounter";
  const showSprites =
    phase === "encounter" ||
    phase === "intro" ||
    phase === "choice" ||
    phase === "feedback";

  useEffect(() => {
    if (phase !== "encounter") {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      onEncounterComplete();
      return;
    }

    const timer = window.setTimeout(() => {
      onEncounterComplete();
    }, ENCOUNTER_ANIMATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onEncounterComplete, phase, questionIndex]);

  return (
    <section className="phoneFrame teacherQuestScreen" aria-label="教員クエスト">
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

        <div
          className={
            isEncounterPhase
              ? "teacherQuestTeacherSprite teacherQuestTeacherSpriteEntering"
              : showSprites
                ? "teacherQuestTeacherSprite teacherQuestTeacherSpriteEntered"
                : "teacherQuestTeacherSprite"
          }
        >
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

        <div
          className={
            isEncounterPhase
              ? "teacherQuestPlayerSprite teacherQuestPlayerSpriteEntering"
              : showSprites
                ? "teacherQuestPlayerSprite teacherQuestPlayerSpriteEntered"
                : "teacherQuestPlayerSprite"
          }
        >
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
        <button
          className="teacherQuestDialoguePanel teacherQuestDialoguePanelEntering"
          type="button"
          onClick={onIntroContinue}
          aria-label="次へ"
        >
          <p className="teacherQuestDialogueText">{introMessage}</p>
          <span className="teacherQuestContinueHint" aria-hidden="true">
            ▼
          </span>
        </button>
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
        <button
          className="teacherQuestDialoguePanel teacherQuestDialoguePanelEntering"
          type="button"
          disabled={isCompleting}
          onClick={onFeedbackContinue}
          aria-label={isLastQuestion ? "結果を見る" : "次の問題へ"}
        >
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
          <span className="teacherQuestContinueHint" aria-hidden="true">
            {isCompleting ? "…" : "▼"}
          </span>
          {completeMessage ? (
            <p className="teacherQuestCompleteMessage" role="alert">
              {completeMessage}
            </p>
          ) : null}
        </button>
      ) : null}
    </section>
  );
}
