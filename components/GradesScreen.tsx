"use client";

import { useCallback, useEffect, useState } from "react";
import type { MockExamDetail } from "@/lib/mockExamGrades";

type GradesScreenProps = {
  backgroundImageSrc: string;
  onBack: () => void;
};

type GradesView = "list" | "detail";

export function GradesScreen({ backgroundImageSrc, onBack }: GradesScreenProps) {
  const [view, setView] = useState<GradesView>("list");
  const [exams, setExams] = useState<MockExamDetail[]>([]);
  const [selectedExam, setSelectedExam] = useState<MockExamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/grades/mock-exams").catch(() => null);
    setIsLoading(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setExams([]);
      setMessage(result?.message ?? "成績の取得に失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      exams?: MockExamDetail[];
    } | null;

    setExams(result?.exams ?? []);
  }, []);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  if (view === "detail" && selectedExam) {
    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen"
          aria-label="模擬試験の詳細"
          style={{ backgroundImage: `url(${backgroundImageSrc})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                setSelectedExam(null);
                setView("list");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>成績詳細</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="timerContent gradesContent">
            <section className="gradesDetailHeader">
              <h2>{selectedExam.testName}</h2>
              {selectedExam.testDateLabel ? (
                <p>実施日: {selectedExam.testDateLabel}</p>
              ) : null}
            </section>

            <section className="gradesSummaryCard" aria-label="合計">
              <div className="gradesSummaryRow">
                <span>科目平均</span>
                <strong>
                  {selectedExam.averagePercent != null
                    ? `${selectedExam.averagePercent}%`
                    : "-"}
                </strong>
              </div>
              <div className="gradesSummaryRow">
                <span>はり師</span>
                <strong
                  className={
                    selectedExam.acupuncture.passed === true
                      ? "gradesPass"
                      : selectedExam.acupuncture.passed === false
                        ? "gradesFail"
                        : undefined
                  }
                >
                  {selectedExam.acupuncture.display}
                </strong>
              </div>
              <div className="gradesSummaryRow">
                <span>きゅう師</span>
                <strong
                  className={
                    selectedExam.moxibustion.passed === true
                      ? "gradesPass"
                      : selectedExam.moxibustion.passed === false
                        ? "gradesFail"
                        : undefined
                  }
                >
                  {selectedExam.moxibustion.display}
                </strong>
              </div>
            </section>

            <section className="gradesSubjectList" aria-label="科目別成績">
              {selectedExam.subjects.map((subject) => (
                <article className="gradesSubjectRow" key={subject.key}>
                  <h3>{subject.label}</h3>
                  <p>{subject.display}</p>
                </article>
              ))}
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section
        className="phoneFrame timerScreen"
        aria-label="成績"
        style={{ backgroundImage: `url(${backgroundImageSrc})` }}
      >
        <header className="timerHeader">
          <button className="timerBackButton" type="button" onClick={onBack}>
            <span aria-hidden="true">‹</span>
            戻る
          </button>
          <h1>成績</h1>
          <span className="timerHeaderBalance" aria-hidden="true" />
        </header>

        <div className="timerContent gradesContent">
          <p className="gradesLead">自分の模擬試験の結果を確認できます。</p>

          {message ? (
            <p className="questSetupNote questSetupError" role="alert">
              {message}
            </p>
          ) : null}

          {isLoading ? (
            <p className="questSetupNote">読み込み中...</p>
          ) : null}

          {!isLoading && !message && exams.length === 0 ? (
            <p className="questSetupNote">模擬試験の成績はまだありません。</p>
          ) : null}

          <ul className="gradesExamList">
            {exams.map((exam) => (
              <li key={exam.testName}>
                <button
                  className="menuItem gradesExamItem"
                  type="button"
                  onClick={() => {
                    setSelectedExam(exam);
                    setView("detail");
                  }}
                >
                  <span className="menuIcon menuIcon-purple" aria-hidden="true">
                    📊
                  </span>
                  <span className="menuText">
                    <span className="menuTitle">{exam.testName}</span>
                    <span className="menuDescription">
                      {exam.testDateLabel
                        ? `実施日: ${exam.testDateLabel}`
                        : "実施日未設定"}
                    </span>
                  </span>
                  <span className="menuChevron" aria-hidden="true">
                    &gt;
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
