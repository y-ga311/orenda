"use client";

import { useState, useCallback } from "react";

// ─── 設問定義 ────────────────────────────────────────────────────────────────

const PHQ9_QUESTIONS = [
  "物事に対してほとんど興味がない、または楽しめない",
  "気分が沈んでいる、または絶望的な気持ちになる",
  "寝つきが悪い、途中で目が覚める、または寝すぎる",
  "疲れた感じがする、または気力がない",
  "あまり食欲がない、または食べすぎる",
  "自分はダメな人間だ、または自分を責める気持ちになる",
  "新聞を読む、またはテレビを見るなどのことに集中するのが難しい",
  "動きや話し方が遅くなっている、または落ち着かず、じっとしていられない",
  "死んだほうがましだ、または自分を何らかの方法で傷つけようと思ったことがある",
] as const;

const PHQ_GAD_OPTIONS = [
  { label: "全くない", score: 0 },
  { label: "数日", score: 1 },
  { label: "半分以上", score: 2 },
  { label: "ほぼ毎日", score: 3 },
] as const;

const GAD7_QUESTIONS = [
  "緊張感、不安感、またはびくびくした感じがある",
  "心配することを止められない、またはコントロールできない",
  "いろいろなことについてひどく心配する",
  "リラックスするのが難しい",
  "じっとしていられないくらい不安で落ち着かない",
  "苛立ちやすくなったり、怒りっぽくなる",
  "何か恐ろしいことが起こるのではないかと恐れを感じる",
] as const;

const PSQI_QUESTIONS: { text: string; options: readonly string[] }[] = [
  {
    text: "普段の就寝時刻はいつ頃ですか？",
    options: ["22時より前", "22〜24時頃", "24〜1時頃", "1時以降"],
  },
  {
    text: "眠れるまでにどのくらいかかりますか？",
    options: ["15分未満", "15〜30分", "31〜60分", "60分以上"],
  },
  {
    text: "普段の起床時刻はいつ頃ですか？",
    options: ["6時より前", "6〜7時頃", "7〜8時頃", "8時以降"],
  },
  {
    text: "実際に眠れている時間はどのくらいですか？",
    options: ["7時間以上", "6〜7時間", "5〜6時間", "5時間未満"],
  },
  {
    text: "過去1ヶ月の睡眠の質を全体的に評価してください",
    options: ["とても良い", "まあ良い", "悪い", "とても悪い"],
  },
];

const RESILIENCE_QUESTIONS = [
  "つらいことがあっても、時間が経てば立ち直れると思う",
  "問題が起きたとき、解決のための行動が取れる",
  "誰かにサポートを求めることが苦手ではない",
  "失敗しても、そこから学べることがあると思える",
  "嫌な気分の時でも、ポジティブな側面を見つけようとする",
  "強いストレスを感じても、何とかなると思える",
  "今の自分の感情を客観的に観察できる",
  "大変な時期があっても、自分は成長できると信じている",
] as const;

const RESILIENCE_OPTIONS = [
  { label: "全くそう思わない", score: 1 },
  { label: "あまりそう思わない", score: 2 },
  { label: "どちらでもない", score: 3 },
  { label: "まあそう思う", score: 4 },
  { label: "とてもそう思う", score: 5 },
] as const;

// ─── 判定ヘルパー ─────────────────────────────────────────────────────────────

function phq9Level(score: number) {
  if (score <= 4) return { label: "良好", note: "引き続き心の健康を大切に", color: "good" };
  if (score <= 9) return { label: "注意", note: "セルフケアを心がけましょう", color: "caution" };
  if (score <= 14) return { label: "要注意", note: "信頼できる人や相談窓口に話してみましょう", color: "warning" };
  return { label: "要注意", note: "専門家への相談をお勧めします", color: "danger" };
}

function gad7Level(score: number) {
  if (score <= 4) return { label: "良好", note: "不安は落ち着いた状態です", color: "good" };
  if (score <= 9) return { label: "注意", note: "気になることを誰かに話してみましょう", color: "caution" };
  if (score <= 14) return { label: "要注意", note: "相談窓口を活用してみましょう", color: "warning" };
  return { label: "要注意", note: "専門家への相談をお勧めします", color: "danger" };
}

function psqiLevel(score: number) {
  if (score <= 4) return { label: "良好", note: "良質な睡眠が取れています", color: "good" };
  if (score <= 9) return { label: "注意", note: "睡眠の質がやや低下しています", color: "caution" };
  return { label: "要注意", note: "睡眠の質に問題がある可能性があります", color: "warning" };
}

function resilienceLevel(score: number) {
  if (score >= 33) return { label: "高い", note: "高いレジリエンスを持っています", color: "good" };
  if (score >= 24) return { label: "中程度", note: "平均的なレジリエンスです", color: "caution" };
  return { label: "向上の余地あり", note: "日々の実践でレジリエンスを高めましょう", color: "warning" };
}

// ─── 型定義 ───────────────────────────────────────────────────────────────────

type SelfCheckSection = "intro" | "phq9" | "gad7" | "psqi" | "resilience" | "done" | "emergency";

type Scores = {
  phq9: number;
  gad7: number;
  psqi: number;
  resilience: number;
};

type Props = {
  onComplete: () => void;
};

const SECTION_ORDER: SelfCheckSection[] = ["intro", "phq9", "gad7", "psqi", "resilience"];

function progressStep(section: SelfCheckSection): number {
  const map: Record<SelfCheckSection, number> = {
    intro: 0, phq9: 1, gad7: 2, psqi: 3, resilience: 4, done: 4, emergency: 4,
  };
  return map[section];
}

// ─── コンポーネント ───────────────────────────────────────────────────────────

export function SelfCheckScreen({ onComplete }: Props) {
  const [section, setSection] = useState<SelfCheckSection>("intro");
  const [phq9Ans, setPhq9Ans] = useState<(number | null)[]>(Array(9).fill(null));
  const [gad7Ans, setGad7Ans] = useState<(number | null)[]>(Array(7).fill(null));
  const [psqiAns, setPsqiAns] = useState<(number | null)[]>(Array(5).fill(null));
  const [resAns, setResAns] = useState<(number | null)[]>(Array(8).fill(null));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [scores, setScores] = useState<Scores | null>(null);

  const allPhq9Done = phq9Ans.every((a) => a !== null);
  const allGad7Done = gad7Ans.every((a) => a !== null);
  const allPsqiDone = psqiAns.every((a) => a !== null);
  const allResDone = resAns.every((a) => a !== null);

  function setAnswer(
    setter: React.Dispatch<React.SetStateAction<(number | null)[]>>,
    index: number,
    score: number,
  ) {
    setter((prev) => {
      const next = [...prev];
      next[index] = score;
      return next;
    });
  }

  const handleSubmit = useCallback(async () => {
    if (!allPhq9Done || !allGad7Done || !allPsqiDone || !allResDone) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/self-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phq9Answers: phq9Ans,
          gad7Answers: gad7Ans,
          psqiAnswers: psqiAns,
          resilienceAnswers: resAns,
        }),
      }).catch(() => null);

      if (!res?.ok) {
        const data = (await res?.json().catch(() => null)) as { message?: string } | null;
        setSubmitError(data?.message ?? "送信に失敗しました。もう一度お試しください。");
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        phq9Score?: number;
        gad7Score?: number;
        psqiScore?: number;
        resilienceScore?: number;
      } | null;

      const finalScores: Scores = {
        phq9: data?.phq9Score ?? 0,
        gad7: data?.gad7Score ?? 0,
        psqi: data?.psqiScore ?? 0,
        resilience: data?.resilienceScore ?? 0,
      };
      setScores(finalScores);

      // PHQ-9 Q9（希死念慮）が「数日」以上の場合は緊急サポート画面へ
      const phq9Q9 = phq9Ans[8] ?? 0;
      setSection(phq9Q9 >= 1 ? "emergency" : "done");
    } finally {
      setIsSubmitting(false);
    }
  }, [phq9Ans, gad7Ans, psqiAns, resAns, allPhq9Done, allGad7Done, allPsqiDone, allResDone]);

  // ── 進捗バー ──────────────────────────────────────────────────────────────
  const step = progressStep(section);
  const showProgress = section !== "intro" && section !== "done" && section !== "emergency";

  // ── 設問リスト共通レンダラー ─────────────────────────────────────────────
  function renderQuestions(
    questions: readonly string[],
    answers: (number | null)[],
    options: readonly { label: string; score: number }[],
    setter: React.Dispatch<React.SetStateAction<(number | null)[]>>,
    header: string,
    note?: string,
  ) {
    const allDone = answers.every((a) => a !== null);
    return (
      <>
        <div className="selfCheckSectionHeader">
          <h2>{header}</h2>
          {note && <p className="selfCheckNote">{note}</p>}
        </div>
        <div className="selfCheckQuestionList">
          {questions.map((q, qi) => (
            <div className="selfCheckQuestion" key={qi}>
              <p className="selfCheckQuestionText">
                <span className="selfCheckQuestionNo">Q{qi + 1}</span>
                {q}
              </p>
              <div className="selfCheckOptions">
                {options.map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    className={`selfCheckOption${answers[qi] === opt.score ? " selfCheckOptionSelected" : ""}`}
                    onClick={() => setAnswer(setter, qi, opt.score)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="selfCheckNav">
          <button
            type="button"
            className="selfCheckBack"
            onClick={() => {
              const idx = SECTION_ORDER.indexOf(section);
              if (idx > 0) setSection(SECTION_ORDER[idx - 1]);
            }}
          >
            ‹ 戻る
          </button>
          <button
            type="button"
            className="selfCheckNext"
            disabled={!allDone}
            onClick={() => {
              const idx = SECTION_ORDER.indexOf(section);
              if (idx < SECTION_ORDER.length - 1) setSection(SECTION_ORDER[idx + 1]);
            }}
          >
            次へ ›
          </button>
        </div>
      </>
    );
  }

  // ── PSQI 専用レンダラー（各質問ごとに options が異なる）────────────────
  function renderPsqi() {
    const allDone = psqiAns.every((a) => a !== null);
    return (
      <>
        <div className="selfCheckSectionHeader">
          <h2>睡眠チェック（PSQI）</h2>
          <p className="selfCheckNote">過去1ヶ月の睡眠について答えてください</p>
        </div>
        <div className="selfCheckQuestionList">
          {PSQI_QUESTIONS.map((q, qi) => (
            <div className="selfCheckQuestion" key={qi}>
              <p className="selfCheckQuestionText">
                <span className="selfCheckQuestionNo">Q{qi + 1}</span>
                {q.text}
              </p>
              <div className="selfCheckOptions">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    className={`selfCheckOption${psqiAns[qi] === oi ? " selfCheckOptionSelected" : ""}`}
                    onClick={() => setAnswer(setPsqiAns, qi, oi)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="selfCheckNav">
          <button
            type="button"
            className="selfCheckBack"
            onClick={() => setSection("gad7")}
          >
            ‹ 戻る
          </button>
          <button
            type="button"
            className="selfCheckNext"
            disabled={!allDone}
            onClick={() => setSection("resilience")}
          >
            次へ ›
          </button>
        </div>
      </>
    );
  }

  // ── 結果サマリー共通 ─────────────────────────────────────────────────────
  function renderResultBadge(label: string, score: string | number, level: { label: string; color: string }) {
    return (
      <div className={`selfCheckResultItem selfCheckResultItem-${level.color}`}>
        <span className="selfCheckResultLabel">{label}</span>
        <span className="selfCheckResultScore">{score}点</span>
        <span className="selfCheckResultBadge">{level.label}</span>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // レンダリング
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className="appShell">
      <section className="phoneFrame selfCheckScreen" aria-label="月次セルフチェック">

        {/* ── ヘッダー ── */}
        <header className="selfCheckHeader">
          <h1 className="selfCheckTitle">月次セルフチェック</h1>
          {showProgress && (
            <div className="selfCheckProgress" aria-label="進捗">
              {["PHQ-9", "GAD-7", "PSQI", "レジリエンス"].map((label, i) => (
                <span
                  key={label}
                  className={`selfCheckProgressStep${step === i + 1 ? " selfCheckProgressStepActive" : step > i + 1 ? " selfCheckProgressStepDone" : ""}`}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── コンテンツ ── */}
        <div className="selfCheckContent">

          {/* イントロ */}
          {section === "intro" && (
            <div className="selfCheckIntro">
              <div className="selfCheckIntroIcon" aria-hidden="true">🧠</div>
              <h2>今月のセルフチェックを始めましょう</h2>
              <p>
                心身の健康状態を確認するための4つの質問票です。<br />
                約5〜10分で回答できます。
              </p>
              <ul className="selfCheckIntroList">
                <li>① うつ症状チェック（PHQ-9）</li>
                <li>② 不安症状チェック（GAD-7）</li>
                <li>③ 睡眠チェック（PSQI簡易版）</li>
                <li>④ レジリエンス指標</li>
              </ul>
              <p className="selfCheckIntroDisclaimer">
                回答は担任の先生が確認します。医療診断ではありません。
              </p>
              <button
                type="button"
                className="selfCheckStartButton"
                onClick={() => setSection("phq9")}
              >
                始める
              </button>
            </div>
          )}

          {/* PHQ-9 */}
          {section === "phq9" && renderQuestions(
            PHQ9_QUESTIONS,
            phq9Ans,
            PHQ_GAD_OPTIONS,
            setPhq9Ans,
            "うつ症状チェック（PHQ-9）",
            "過去2週間で、次のことがどのくらいありましたか？",
          )}

          {/* GAD-7 */}
          {section === "gad7" && renderQuestions(
            GAD7_QUESTIONS,
            gad7Ans,
            PHQ_GAD_OPTIONS,
            setGad7Ans,
            "不安症状チェック（GAD-7）",
            "過去2週間で、次のことがどのくらいありましたか？",
          )}

          {/* PSQI */}
          {section === "psqi" && renderPsqi()}

          {/* レジリエンス */}
          {section === "resilience" && (
            <>
              <div className="selfCheckSectionHeader">
                <h2>レジリエンス指標</h2>
                <p className="selfCheckNote">現在のあなたの気持ちに最も近いものを選んでください</p>
              </div>
              <div className="selfCheckQuestionList">
                {RESILIENCE_QUESTIONS.map((q, qi) => (
                  <div className="selfCheckQuestion" key={qi}>
                    <p className="selfCheckQuestionText">
                      <span className="selfCheckQuestionNo">Q{qi + 1}</span>
                      {q}
                    </p>
                    <div className="selfCheckOptions selfCheckOptions5">
                      {RESILIENCE_OPTIONS.map((opt) => (
                        <button
                          key={opt.score}
                          type="button"
                          className={`selfCheckOption${resAns[qi] === opt.score ? " selfCheckOptionSelected" : ""}`}
                          onClick={() => setAnswer(setResAns, qi, opt.score)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="selfCheckError">{submitError}</p>
              )}

              <div className="selfCheckNav">
                <button
                  type="button"
                  className="selfCheckBack"
                  onClick={() => setSection("psqi")}
                >
                  ‹ 戻る
                </button>
                <button
                  type="button"
                  className="selfCheckSubmit"
                  disabled={!allResDone || isSubmitting}
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? "送信中..." : "送信する"}
                </button>
              </div>
            </>
          )}

          {/* 完了 */}
          {section === "done" && scores && (
            <div className="selfCheckDone">
              <div className="selfCheckDoneIcon" aria-hidden="true">✅</div>
              <h2>セルフチェック完了！</h2>
              <p className="selfCheckDoneNote">今月の結果です。担任の先生が確認します。</p>

              <div className="selfCheckResults">
                {renderResultBadge("うつ症状", scores.phq9, phq9Level(scores.phq9))}
                {renderResultBadge("不安症状", scores.gad7, gad7Level(scores.gad7))}
                {renderResultBadge("睡眠の質", scores.psqi, psqiLevel(scores.psqi))}
                {renderResultBadge("レジリエンス", scores.resilience, resilienceLevel(scores.resilience))}
              </div>

              <p className="selfCheckDoneDisclaimer">
                ※ これはあくまで参考です。気になることがあれば学生相談室や担任の先生にご相談ください。
              </p>

              <button
                type="button"
                className="selfCheckStartButton"
                onClick={onComplete}
              >
                メインメニューへ
              </button>
            </div>
          )}

          {/* 緊急サポート（PHQ-9 Q9 ≥ 1） */}
          {section === "emergency" && (
            <div className="selfCheckEmergency">
              <div className="selfCheckEmergencyIcon" aria-hidden="true">💙</div>
              <h2>あなたのことが心配です</h2>
              <p>
                回答の中に、つらい気持ちが含まれていました。<br />
                一人で抱え込まず、誰かに話してみてください。
              </p>

              <div className="selfCheckHelplines">
                <h3>相談できる窓口</h3>
                <a className="selfCheckHelpline" href="tel:0120279338">
                  <span className="selfCheckHelplineName">よりそいホットライン</span>
                  <span className="selfCheckHelplinePhone">0120-279-338</span>
                  <span className="selfCheckHelplineHours">24時間365日</span>
                </a>
                <a className="selfCheckHelpline" href="tel:0570064556">
                  <span className="selfCheckHelplineName">こころの健康相談統一ダイヤル</span>
                  <span className="selfCheckHelplinePhone">0570-064-556</span>
                  <span className="selfCheckHelplineHours">都道府県により異なる</span>
                </a>
                <a className="selfCheckHelpline" href="tel:0120783556">
                  <span className="selfCheckHelplineName">いのちの電話</span>
                  <span className="selfCheckHelplinePhone">0120-783-556</span>
                  <span className="selfCheckHelplineHours">毎日16〜21時ほか</span>
                </a>
              </div>

              {scores && (
                <div className="selfCheckResults selfCheckResultsSmall">
                  {renderResultBadge("うつ症状", scores.phq9, phq9Level(scores.phq9))}
                  {renderResultBadge("不安症状", scores.gad7, gad7Level(scores.gad7))}
                </div>
              )}

              <button
                type="button"
                className="selfCheckStartButton selfCheckStartButtonSecondary"
                onClick={onComplete}
              >
                メインメニューへ
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
