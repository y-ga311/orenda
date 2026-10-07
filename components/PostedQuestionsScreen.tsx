"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  POSTED_QUESTION_SUBJECTS,
  type PostedQuestionChallenge,
  type PostedQuestionListItem,
  type PostedQuestionSort,
  type PostedQuestionSubjectId,
} from "@/lib/postedQuestions";

type PostedQuestionsScreenProps = {
  backgroundImageSrc: string;
  onBack: () => void;
};

type ScreenView = "list" | "create" | "challenge";
type ListTab = "all" | "mine";

const choiceLabels = ["1", "2", "3", "4"] as const;

export function PostedQuestionsScreen({
  backgroundImageSrc,
  onBack,
}: PostedQuestionsScreenProps) {
  const [view, setView] = useState<ScreenView>("list");
  const [listTab, setListTab] = useState<ListTab>("all");
  const [sort, setSort] = useState<PostedQuestionSort>("recent");
  const [filterSubjectId, setFilterSubjectId] = useState<
    PostedQuestionSubjectId | ""
  >("");
  const [questions, setQuestions] = useState<PostedQuestionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [likeBusyId, setLikeBusyId] = useState<string | null>(null);

  const [createSubjectId, setCreateSubjectId] = useState<
    PostedQuestionSubjectId | ""
  >("");
  const [createBody, setCreateBody] = useState("");
  const [createChoices, setCreateChoices] = useState(["", "", "", ""]);
  const [createCorrectIndex, setCreateCorrectIndex] = useState(0);
  const [createExplanation, setCreateExplanation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const [challenge, setChallenge] = useState<PostedQuestionChallenge | null>(null);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [challengeMessage, setChallengeMessage] = useState("");

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const params = new URLSearchParams({ sort });
    if (listTab === "mine") {
      params.set("mine", "1");
    }
    if (filterSubjectId) {
      params.set("subject", filterSubjectId);
    }

    const response = await fetch(`/api/posted-questions?${params}`).catch(
      () => null,
    );
    setIsLoading(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setQuestions([]);
      setMessage(result?.message ?? "投稿問題の取得に失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      questions?: PostedQuestionListItem[];
    } | null;

    setQuestions(result?.questions ?? []);
  }, [filterSubjectId, listTab, sort]);

  useEffect(() => {
    if (view !== "list") {
      return;
    }
    void loadQuestions();
  }, [loadQuestions, view]);

  function updateLikeState(questionId: string, liked: boolean, likeCount: number) {
    setQuestions((current) =>
      current.map((item) =>
        item.id === questionId ? { ...item, likedByMe: liked, likeCount } : item,
      ),
    );
    setChallenge((current) =>
      current && current.id === questionId
        ? { ...current, likedByMe: liked, likeCount }
        : current,
    );
  }

  async function handleToggleLike(questionId: string) {
    if (likeBusyId) {
      return;
    }

    setLikeBusyId(questionId);
    const response = await fetch(`/api/posted-questions/${questionId}/like`, {
      method: "POST",
    }).catch(() => null);
    setLikeBusyId(null);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(result?.message ?? "いいねに失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      liked?: boolean;
      likeCount?: number;
    } | null;

    if (typeof result?.liked === "boolean" && typeof result.likeCount === "number") {
      updateLikeState(questionId, result.liked, result.likeCount);
    }
  }

  async function openChallenge(questionId: string) {
    setIsChallengeLoading(true);
    setChallengeMessage("");
    setSelectedChoice(null);
    setAnswerSubmitted(false);
    setCorrectIndex(null);
    setExplanation("");
    setIsCorrect(null);

    const response = await fetch(`/api/posted-questions/${questionId}`).catch(
      () => null,
    );
    setIsChallengeLoading(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(result?.message ?? "問題の読み込みに失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      question?: PostedQuestionChallenge;
    } | null;

    if (!result?.question) {
      setMessage("問題を取得できませんでした。");
      return;
    }

    setChallenge(result.question);
    setView("challenge");
  }

  async function handleAnswer(index: number) {
    if (!challenge || answerSubmitted) {
      return;
    }

    setSelectedChoice(index);
    setAnswerSubmitted(true);
    setChallengeMessage("");

    const response = await fetch(
      `/api/posted-questions/${challenge.id}/answer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndex: index }),
      },
    ).catch(() => null);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setChallengeMessage(result?.message ?? "採点に失敗しました。");
      setAnswerSubmitted(false);
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      isCorrect?: boolean;
      correctIndex?: number;
      explanation?: string;
    } | null;

    setIsCorrect(result?.isCorrect ?? false);
    setCorrectIndex(
      typeof result?.correctIndex === "number" ? result.correctIndex : null,
    );
    setExplanation(result?.explanation ?? "");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!createSubjectId) {
      setCreateMessage("科目を選択してください。");
      return;
    }

    setIsSubmitting(true);
    setCreateMessage("");

    const response = await fetch("/api/posted-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: createSubjectId,
        body: createBody,
        choice1: createChoices[0],
        choice2: createChoices[1],
        choice3: createChoices[2],
        choice4: createChoices[3],
        correctIndex: createCorrectIndex,
        explanation: createExplanation,
      }),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setCreateMessage(result?.message ?? "投稿に失敗しました。");
      return;
    }

    setCreateSubjectId("");
    setCreateBody("");
    setCreateChoices(["", "", "", ""]);
    setCreateCorrectIndex(0);
    setCreateExplanation("");
    setCreateMessage("");
    setListTab("mine");
    setSort("recent");
    setView("list");
  }

  async function handleDelete(questionId: string) {
    if (!window.confirm("この投稿を削除しますか？")) {
      return;
    }

    const response = await fetch(`/api/posted-questions/${questionId}`, {
      method: "DELETE",
    }).catch(() => null);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(result?.message ?? "削除に失敗しました。");
      return;
    }

    setQuestions((current) => current.filter((item) => item.id !== questionId));
  }

  function getChoiceClassName(index: number) {
    if (!answerSubmitted || selectedChoice === null) {
      return "questChoice";
    }

    if (correctIndex === index) {
      return "questChoice questChoiceCorrect";
    }

    if (selectedChoice === index && isCorrect === false) {
      return "questChoice questChoiceWrong";
    }

    return "questChoice questChoiceMuted";
  }

  if (view === "create") {
    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen"
          aria-label="問題を投稿"
          style={{ backgroundImage: `url(${backgroundImageSrc})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                setCreateMessage("");
                setView("list");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>問題を投稿</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <form className="timerContent postedCreateForm" onSubmit={handleCreate}>
            <label className="profileField">
              科目
              <select
                className="postedSelect"
                value={createSubjectId}
                required
                onChange={(event) =>
                  setCreateSubjectId(
                    event.target.value as PostedQuestionSubjectId | "",
                  )
                }
              >
                <option value="">科目を選択</option>
                {POSTED_QUESTION_SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="profileField">
              問題文
              <textarea
                className="postedTextarea"
                value={createBody}
                onChange={(event) => setCreateBody(event.target.value)}
                maxLength={800}
                rows={4}
                required
                placeholder="問題文を入力"
              />
            </label>

            {createChoices.map((choice, index) => (
              <label className="profileField" key={index}>
                選択肢{index + 1}
                <div className="postedChoiceRow">
                  <input
                    type="radio"
                    name="postedCorrect"
                    checked={createCorrectIndex === index}
                    onChange={() => setCreateCorrectIndex(index)}
                    aria-label={`選択肢${index + 1}を正解にする`}
                  />
                  <input
                    type="text"
                    value={choice}
                    onChange={(event) => {
                      const next = [...createChoices];
                      next[index] = event.target.value;
                      setCreateChoices(next);
                    }}
                    maxLength={200}
                    required
                    placeholder={`選択肢${index + 1}`}
                  />
                </div>
              </label>
            ))}

            <p className="postedCreateHint">ラジオボタンで正解の選択肢を選んでください。</p>

            <label className="profileField">
              解説（任意）
              <textarea
                className="postedTextarea"
                value={createExplanation}
                onChange={(event) => setCreateExplanation(event.target.value)}
                maxLength={800}
                rows={3}
                placeholder="正解の解説（任意）"
              />
            </label>

            {createMessage ? (
              <p className="questSetupNote questSetupError" role="alert">
                {createMessage}
              </p>
            ) : null}

            <button
              className="profileSubmitButton postedSubmitButton"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "投稿中..." : "投稿する"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (view === "challenge") {
    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen questScreen"
          aria-label="投稿問題に挑戦"
          style={{ backgroundImage: `url(${backgroundImageSrc})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                setChallenge(null);
                setView("list");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>挑戦</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="questQuestionMain">
            {isChallengeLoading || !challenge ? (
              <p className="questSetupNote">問題を読み込んでいます...</p>
            ) : (
              <>
                <div className="postedChallengeMeta">
                  <p>
                    {challenge.subjectLabel}・投稿: {challenge.authorDisplayName}
                    {challenge.isMine ? "（自分）" : ""}
                  </p>
                  {challenge.isMine ? (
                    <span
                      className="postedLikeCount"
                      title="自分の投稿にはいいねできません"
                    >
                      ♥ {challenge.likeCount}
                    </span>
                  ) : (
                    <button
                      className={
                        challenge.likedByMe
                          ? "postedLikeButton postedLikeButtonActive"
                          : "postedLikeButton"
                      }
                      type="button"
                      disabled={likeBusyId === challenge.id}
                      onClick={() => void handleToggleLike(challenge.id)}
                    >
                      {challenge.likedByMe ? "♥" : "♡"} {challenge.likeCount}
                    </button>
                  )}
                </div>

                <article className="questQuestionCard">
                  <p className="questQuestionBody">{challenge.body}</p>
                </article>

                <div className="questChoiceList" role="listbox" aria-label="選択肢">
                  {challenge.choices.map((choice, index) => (
                    <button
                      className={getChoiceClassName(index)}
                      key={`${challenge.id}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selectedChoice === index}
                      disabled={answerSubmitted}
                      onClick={() => void handleAnswer(index)}
                    >
                      <span className="questChoiceBadge" aria-hidden="true">
                        {choiceLabels[index]}
                      </span>
                      <span className="questChoiceLabel">{choice}</span>
                    </button>
                  ))}
                </div>

                {challengeMessage ? (
                  <p className="questSetupNote questSetupError" role="alert">
                    {challengeMessage}
                  </p>
                ) : null}

                {answerSubmitted && isCorrect !== null ? (
                  <>
                    <section
                      className={
                        isCorrect
                          ? "questResultPanel questResultPanelCorrect"
                          : "questResultPanel questResultPanelWrong"
                      }
                      aria-live="polite"
                    >
                      <div className="questResultHeader">
                        <div
                          className={
                            isCorrect
                              ? "questResultIcon questResultIconCorrect"
                              : "questResultIcon questResultIconWrong"
                          }
                          aria-hidden="true"
                        >
                          {isCorrect ? "✓" : "✕"}
                        </div>
                        <p className="questResultLabel">
                          {isCorrect ? "正解" : "不正解"}
                        </p>
                      </div>
                      {explanation ? (
                        <p className="questResultExplanation">{explanation}</p>
                      ) : null}
                    </section>
                    <button
                      className="profileSubmitButton questNextButton"
                      type="button"
                      onClick={() => {
                        setChallenge(null);
                        setView("list");
                      }}
                    >
                      一覧に戻る
                    </button>
                  </>
                ) : null}
              </>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section
        className="phoneFrame timerScreen"
        aria-label="投稿問題"
        style={{ backgroundImage: `url(${backgroundImageSrc})` }}
      >
        <header className="timerHeader">
          <button className="timerBackButton" type="button" onClick={onBack}>
            <span aria-hidden="true">‹</span>
            戻る
          </button>
          <h1>投稿問題</h1>
          <span className="timerHeaderBalance" aria-hidden="true" />
        </header>

        <div className="timerContent postedListContent">
          <div className="postedListScroll">
            <div className="postedToolbar">
              <div className="myPageTabs" role="tablist" aria-label="投稿一覧">
                <button
                  className={listTab === "all" ? "myPageTab myPageTabActive" : "myPageTab"}
                  type="button"
                  role="tab"
                  aria-selected={listTab === "all"}
                  onClick={() => setListTab("all")}
                >
                  みんなの問題
                </button>
                <button
                  className={listTab === "mine" ? "myPageTab myPageTabActive" : "myPageTab"}
                  type="button"
                  role="tab"
                  aria-selected={listTab === "mine"}
                  onClick={() => setListTab("mine")}
                >
                  自分の投稿
                </button>
              </div>

              <div className="postedSortTabs" aria-label="並び替え">
                <button
                  className={
                    sort === "recent"
                      ? "rankingPeriodTab rankingPeriodTabActive"
                      : "rankingPeriodTab"
                  }
                  type="button"
                  onClick={() => setSort("recent")}
                >
                  新着
                </button>
                <button
                  className={
                    sort === "popular"
                      ? "rankingPeriodTab rankingPeriodTabActive"
                      : "rankingPeriodTab"
                  }
                  type="button"
                  onClick={() => setSort("popular")}
                >
                  人気
                </button>
              </div>

              <label className="postedFilterField">
                <span className="postedFilterLabel">科目</span>
                <select
                  className="postedSelect"
                  value={filterSubjectId}
                  aria-label="科目で絞り込み"
                  onChange={(event) =>
                    setFilterSubjectId(
                      event.target.value as PostedQuestionSubjectId | "",
                    )
                  }
                >
                  <option value="">すべて</option>
                  {POSTED_QUESTION_SUBJECTS.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {message ? (
              <p className="questSetupNote questSetupError" role="alert">
                {message}
              </p>
            ) : null}

            {isLoading ? (
              <p className="questSetupNote">読み込み中...</p>
            ) : null}

            {!isLoading && questions.length === 0 ? (
              <p className="questSetupNote">
                {listTab === "mine"
                  ? "まだ投稿がありません。最初の問題を作ってみましょう。"
                  : "まだ投稿問題がありません。"}
              </p>
            ) : null}

            <ul className="postedQuestionList">
              {questions.map((item) => (
                <li className="postedQuestionCard" key={item.id}>
                  <button
                    className="postedQuestionMain"
                    type="button"
                    onClick={() => void openChallenge(item.id)}
                  >
                    <p className="postedQuestionSubject">{item.subjectLabel}</p>
                    <p className="postedQuestionBody">{item.body}</p>
                    <p className="postedQuestionAuthor">
                      {item.authorDisplayName}
                      {item.isMine ? "・自分" : ""}
                    </p>
                  </button>
                  <div className="postedQuestionActions">
                    {item.isMine ? (
                      <span
                        className="postedLikeCount"
                        title="自分の投稿にはいいねできません"
                      >
                        ♥ {item.likeCount}
                      </span>
                    ) : (
                      <button
                        className={
                          item.likedByMe
                            ? "postedLikeButton postedLikeButtonActive"
                            : "postedLikeButton"
                        }
                        type="button"
                        disabled={likeBusyId === item.id}
                        onClick={() => void handleToggleLike(item.id)}
                      >
                        {item.likedByMe ? "♥" : "♡"} {item.likeCount}
                      </button>
                    )}
                    {listTab === "mine" && item.isMine ? (
                      <button
                        className="postedDeleteButton"
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                      >
                        削除
                      </button>
                    ) : null}
                    <button
                      className="postedChallengeButton"
                      type="button"
                      onClick={() => void openChallenge(item.id)}
                    >
                      挑戦
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="postedCreateBar">
            <button
              className="postedCreateEntryButton"
              type="button"
              onClick={() => {
                setCreateMessage("");
                setView("create");
              }}
            >
              ＋ 問題を投稿する
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
