"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import backgroundImage from "@/source-images/background.png";
import buttonImage from "@/source-images/button.png";
import characterImage from "@/source-images/character01.png";
import logoImage from "@/source-images/logo01.png";
import byouriImage from "@/source-images/byouri.png";
import eiseiImage from "@/source-images/eisei.png";
import hariImage from "@/source-images/hari.png";
import iryogaironImage from "@/source-images/iryogairon.png";
import kaibouImage from "@/source-images/kaibou.png";
import kakuronImage from "@/source-images/kakuron.png";
import kankeihoukiImage from "@/source-images/kankeihouki.png";
import keiketuImage from "@/source-images/keiketu.png";
import kyuImage from "@/source-images/kyu.png";
import rehaImage from "@/source-images/reha.png";
import seiriImage from "@/source-images/seiri.png";
import souronImage from "@/source-images/souron.png";
import tougaiImage from "@/source-images/tougai.png";
import tourinImage from "@/source-images/tourin.png";
import { avatarIcons, getAvatarIcon, type AvatarIconId } from "@/lib/avatarIcons";

const menuItems = [
  {
    icon: "🕒",
    title: "学習タイマー",
    description: "勉強時間を記録する",
    tone: "blue",
  },
  {
    icon: "📚",
    title: "クエスト",
    description: "問題に取り組む",
    tone: "indigo",
  },
  {
    icon: "📝",
    title: "勉強時間",
    description: "学習時間を振り返る",
    tone: "green",
  },
  {
    icon: "🎴",
    title: "勉強カード",
    description: "カードを集める・コレクションする",
    tone: "gold",
  },
  {
    icon: "👥",
    title: "交流",
    description: "みんなの成績を確認する",
    tone: "pink",
  },
  {
    icon: "✎",
    title: "マイページ",
    description: "マイページの編集",
    tone: "blue",
  },
];

const studySubjects = [
  { id: "kaibou", title: "解剖学", subjectName: "解剖学", image: kaibouImage },
  { id: "seiri", title: "生理学", subjectName: "生理学", image: seiriImage },
  { id: "byouri", title: "病理学概論", subjectName: "病理学", image: byouriImage },
  {
    id: "souron",
    title: "臨床医学総論",
    subjectName: "臨床医学総論",
    image: souronImage,
  },
  {
    id: "kakuron",
    title: "臨床医学各論",
    subjectName: "臨床医学各論",
    image: kakuronImage,
  },
  {
    id: "reha",
    title: "リハビリテーション医学",
    subjectName: "リハビリテーション医学",
    image: rehaImage,
  },
  {
    id: "tougai",
    title: "東洋医学概論",
    subjectName: "東洋医学概論",
    image: tougaiImage,
  },
  {
    id: "keiketu",
    title: "経絡経穴概論",
    subjectName: "経絡経穴概論",
    image: keiketuImage,
  },
  {
    id: "tourin",
    title: "東洋医学臨床論",
    subjectName: "東洋医学臨床論",
    image: tourinImage,
  },
  { id: "hari", title: "はり理論", subjectName: "はり理論", image: hariImage },
  { id: "kyu", title: "きゅう理論", subjectName: "きゅう理論", image: kyuImage },
  {
    id: "iryogairon",
    title: "医療概論",
    subjectName: "医療概論",
    image: iryogaironImage,
  },
  { id: "eisei", title: "衛生学・公衆衛生学", subjectName: "衛生学", image: eiseiImage },
  {
    id: "kankeihouki",
    title: "関係法規",
    subjectName: "関係法規",
    image: kankeihoukiImage,
  },
];

type StudySubject = (typeof studySubjects)[number];

type StudySummary = {
  todayMinutes: number;
  monthMinutes: number;
  totalMinutes: number;
};

const recordPeriodOptions = [
  { id: "today", label: "今日", title: "今日の学習時間" },
  { id: "week", label: "週間", title: "週間の学習時間" },
  { id: "month", label: "月間", title: "月間の学習時間" },
  { id: "year", label: "年間", title: "年間の学習時間" },
  { id: "total", label: "総時間", title: "総学習時間" },
] as const;

type RecordPeriod = (typeof recordPeriodOptions)[number]["id"];

type StudyRecordData = {
  summary: StudySummary;
  selectedPeriod: RecordPeriod;
  periodSummary: {
    averageMinutes: number;
    studiedDays: number;
    totalMinutes: number;
  };
  subjectBreakdown: {
    color: string;
    minutes: number;
    percentage: number;
    subjectName: string;
  }[];
  calendar: {
    year: number;
    month: number;
    days: {
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      minutes: number;
    }[];
  };
};

type StudyRankingItem = {
  avatarIconId: AvatarIconId;
  displayName: string;
  gakuseiId: string;
  isCurrentUser: boolean;
  note: string;
  rank: number;
  weekMinutes: number;
};

type StudyRankingData = {
  ranking: StudyRankingItem[];
  week: {
    endDate: string;
    startDate: string;
  };
};

function formatStudyMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours === 0) {
    return `${restMinutes}分`;
  }

  if (restMinutes === 0) {
    return `${hours}時間`;
  }

  return `${hours}時間${restMinutes}分`;
}

function formatStopwatchTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function getCurrentJapanYearMonth() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  });
  const [year, month] = formatter.format(new Date()).split("-").map(Number);

  return { year, month };
}

function addMonths(year: number, month: number, amount: number) {
  const date = new Date(Date.UTC(year, month - 1 + amount, 1));

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

function PasswordVisibilityIcon({ isVisible }: { isVisible: boolean }) {
  if (isVisible) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="22"
        viewBox="0 0 24 24"
        width="22"
      >
        <path
          d="M3 3l18 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M9.88 5.08A8.63 8.63 0 0 1 12 4.82c5 0 8.5 4.18 9.5 7.18a10.7 10.7 0 0 1-2.4 3.76"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M6.61 6.61A10.43 10.43 0 0 0 2.5 12c1 3 4.5 7.18 9.5 7.18a8.9 8.9 0 0 0 4.02-.96"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="22"
      viewBox="0 0 24 24"
      width="22"
    >
      <path
        d="M2.5 12s3.5-7.18 9.5-7.18S21.5 12 21.5 12 18 19.18 12 19.18 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function HomeScreen() {
  const [recordCalendarMonth, setRecordCalendarMonth] = useState(
    getCurrentJapanYearMonth,
  );
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [nickname, setNickname] = useState("");
  const [daysUntilExam, setDaysUntilExam] = useState<number | null>(null);
  const [selectedAvatarIconId, setSelectedAvatarIconId] =
    useState<AvatarIconId>("pixel01");
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isLoggedInPreview, setIsLoggedInPreview] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeScreen, setActiveScreen] = useState<
    "menu" | "timer" | "stopwatch" | "record" | "ranking"
  >("menu");
  const [selectedSubject, setSelectedSubject] = useState<StudySubject | null>(null);
  const [studySummary, setStudySummary] = useState<StudySummary>({
    todayMinutes: 0,
    monthMinutes: 0,
    totalMinutes: 0,
  });
  const [studyRecord, setStudyRecord] = useState<StudyRecordData | null>(null);
  const [studyRanking, setStudyRanking] = useState<StudyRankingData | null>(null);
  const [selectedRecordPeriod, setSelectedRecordPeriod] =
    useState<RecordPeriod>("month");
  const [isStudySummaryLoading, setIsStudySummaryLoading] = useState(false);
  const [isStudyRankingLoading, setIsStudyRankingLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchMessage, setStopwatchMessage] = useState("");
  const [isRegisteringStudySession, setIsRegisteringStudySession] = useState(false);

  useEffect(() => {
    if (!isLoggedInPreview || activeScreen !== "timer") {
      return;
    }

    let isMounted = true;

    async function loadStudySummary() {
      setIsStudySummaryLoading(true);

      const response = await fetch("/api/study-summary").catch(() => null);

      if (!isMounted) {
        return;
      }

      setIsStudySummaryLoading(false);

      if (!response?.ok) {
        return;
      }

      const result = (await response.json().catch(() => null)) as
        | Partial<StudySummary>
        | null;

      if (!result) {
        return;
      }

      setStudySummary({
        todayMinutes: result.todayMinutes ?? 0,
        monthMinutes: result.monthMinutes ?? 0,
        totalMinutes: result.totalMinutes ?? 0,
      });
    }

    void loadStudySummary();

    return () => {
      isMounted = false;
    };
  }, [activeScreen, isLoggedInPreview]);

  useEffect(() => {
    if (!isLoggedInPreview || activeScreen !== "record") {
      return;
    }

    let isMounted = true;

    async function loadStudyRecord() {
      const params = new URLSearchParams({
        year: recordCalendarMonth.year.toString(),
        month: recordCalendarMonth.month.toString(),
        period: selectedRecordPeriod,
      });
      const response = await fetch(`/api/study-records?${params}`).catch(() => null);

      if (!isMounted) {
        return;
      }

      if (!response?.ok) {
        return;
      }

      const result = (await response.json().catch(() => null)) as
        | StudyRecordData
        | null;

      if (!result) {
        return;
      }

      setStudyRecord(result);
      setStudySummary(result.summary);
    }

    void loadStudyRecord();

    return () => {
      isMounted = false;
    };
  }, [
    activeScreen,
    isLoggedInPreview,
    recordCalendarMonth.month,
    recordCalendarMonth.year,
    selectedRecordPeriod,
  ]);

  useEffect(() => {
    if (!isLoggedInPreview || activeScreen !== "ranking") {
      return;
    }

    let isMounted = true;

    async function loadStudyRanking() {
      setIsStudyRankingLoading(true);

      const response = await fetch("/api/study-ranking").catch(() => null);

      if (!isMounted) {
        return;
      }

      setIsStudyRankingLoading(false);

      if (!response?.ok) {
        return;
      }

      const result = (await response.json().catch(() => null)) as
        | StudyRankingData
        | null;

      if (!result) {
        return;
      }

      setStudyRanking(result);
    }

    void loadStudyRanking();

    return () => {
      isMounted = false;
    };
  }, [activeScreen, isLoggedInPreview]);

  useEffect(() => {
    if (!isStopwatchRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isStopwatchRunning]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginId,
        password,
      }),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!response) {
      setMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      return;
    }

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setMessage(result?.message ?? "ログインできませんでした。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      student?: {
        avatarIconId?: AvatarIconId | null;
        daysUntilExam?: number | null;
        name?: string | null;
        needsProfileSetup?: boolean;
        nickname?: string | null;
      };
    } | null;

    setStudentName(result?.student?.name ?? "");
    setNickname(result?.student?.nickname ?? "");
    setDaysUntilExam(result?.student?.daysUntilExam ?? null);
    setSelectedAvatarIconId(result?.student?.avatarIconId ?? "pixel01");
    setNeedsProfileSetup(Boolean(result?.student?.needsProfileSetup));
    setActiveScreen("menu");
    setIsLoginOpen(false);
    setIsLoggedInPreview(true);
    setPassword("");
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage("");
    setIsProfileSubmitting(true);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nickname,
        avatarIconId: selectedAvatarIconId,
      }),
    }).catch(() => null);

    setIsProfileSubmitting(false);

    if (!response) {
      setProfileMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      message?: string;
      student?: {
        avatarIconId?: AvatarIconId | null;
        name?: string | null;
        nickname?: string | null;
      };
    } | null;

    if (!response.ok) {
      setProfileMessage(result?.message ?? "プロフィールを登録できませんでした。");
      return;
    }

    setStudentName(result?.student?.name ?? studentName);
    setNickname(result?.student?.nickname ?? nickname);
    setSelectedAvatarIconId(result?.student?.avatarIconId ?? selectedAvatarIconId);
    setNeedsProfileSetup(false);
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    }).catch(() => null);

    setIsLoggedInPreview(false);
    setActiveScreen("menu");
    setSelectedSubject(null);
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setNeedsProfileSetup(false);
    setIsLoginOpen(false);
    setLoginId("");
    setPassword("");
    setStudentName("");
    setNickname("");
    setDaysUntilExam(null);
    setStudySummary({
      todayMinutes: 0,
      monthMinutes: 0,
      totalMinutes: 0,
    });
    setStudyRecord(null);
    setStudyRanking(null);
    setSelectedRecordPeriod("month");
    setRecordCalendarMonth(getCurrentJapanYearMonth());
    setSelectedAvatarIconId("pixel01");
    setMessage("");
    setProfileMessage("");
    setStopwatchMessage("");
  }

  function openStopwatch(subject: StudySubject) {
    setSelectedSubject(subject);
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setStopwatchMessage("");
    setActiveScreen("stopwatch");
  }

  async function handleStudySessionRegister() {
    if (!selectedSubject) {
      return;
    }

    const durationMinutes = Math.floor(elapsedSeconds / 60);

    if (durationMinutes < 1) {
      setStopwatchMessage("1分以上学習してから登録してください。");
      return;
    }

    setIsRegisteringStudySession(true);
    setIsStopwatchRunning(false);
    setStopwatchMessage("");

    const response = await fetch("/api/study-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.subjectName,
        durationMinutes,
      }),
    }).catch(() => null);

    setIsRegisteringStudySession(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setStopwatchMessage(result?.message ?? "学習時間を登録できませんでした。");
      return;
    }

    setStudySummary((current) => ({
      todayMinutes: current.todayMinutes + durationMinutes,
      monthMinutes: current.monthMinutes + durationMinutes,
      totalMinutes: current.totalMinutes + durationMinutes,
    }));
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setStopwatchMessage("学習時間を登録しました。");
  }

  if (isLoggedInPreview && needsProfileSetup) {
    return (
      <main className="appShell">
        <section
          className="phoneFrame"
          aria-label="Orenda プロフィール設定画面"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <div className="logoHeader profileLogoHeader">
            <Image
              src={logoImage}
              alt="Orenda"
              className="logoImage"
              priority
            />
          </div>

          <Image
            src={characterImage}
            alt="Orenda キャラクター"
            className="characterImage profileCharacterImage"
            priority
          />

          <div className="profileOverlay">
            <form className="profileCard" onSubmit={handleProfileSubmit}>
              <h1>プロフィール設定</h1>
              <p className="profileLead">
                ログインありがとうございます。ニックネームとアイコンを登録してください。
              </p>

              <label className="profileField">
                ニックネーム
                <input
                  maxLength={12}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="ニックネームを入力"
                  required
                  type="text"
                  value={nickname}
                />
              </label>

              <fieldset className="avatarFieldset">
                <legend>アイコン（画像から選択）</legend>
                <div className="avatarGrid">
                  {avatarIcons.map((icon) => (
                    <label className="avatarOption" key={icon.id}>
                      <input
                        checked={selectedAvatarIconId === icon.id}
                        name="avatarIcon"
                        onChange={() => setSelectedAvatarIconId(icon.id)}
                        type="radio"
                        value={icon.id}
                      />
                      <span className="avatarImageWrap">
                        <Image src={icon.image} alt={icon.label} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {profileMessage ? (
                <p className="formMessage">{profileMessage}</p>
              ) : null}

              <button
                className="profileSubmitButton"
                disabled={isProfileSubmitting}
                type="submit"
              >
                {isProfileSubmitting ? "登録中..." : "登録してはじめる"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "timer") {
    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen"
          aria-label="学習タイマー 科目選択画面"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => setActiveScreen("menu")}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>学習タイマー</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="timerContent">
            <section className="timerSummary" aria-label="学習時間サマリー">
              <div>
                <span>今日</span>
                <strong>
                  {isStudySummaryLoading
                    ? "読込中"
                    : formatStudyMinutes(studySummary.todayMinutes)}
                </strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>今月</span>
                <strong>
                  {isStudySummaryLoading
                    ? "読込中"
                    : formatStudyMinutes(studySummary.monthMinutes)}
                </strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>総学習時間</span>
                <strong>
                  {isStudySummaryLoading
                    ? "読込中"
                    : formatStudyMinutes(studySummary.totalMinutes)}
                </strong>
              </div>
            </section>

            <p className="timerScrollHint">
              <span aria-hidden="true">⇅</span>
              上下にスクロールして科目を選べます
            </p>

            <section className="subjectGrid" aria-label="科目一覧">
              {studySubjects.map((subject) => (
                <button
                  className="subjectCard"
                  key={subject.title}
                  type="button"
                  onClick={() => openStopwatch(subject)}
                >
                  <Image src={subject.image} alt="" className="subjectCover" />
                  <span>{subject.title}</span>
                </button>
              ))}
            </section>
          </div>

          <nav className="timerBottomNav" aria-label="下部ナビゲーション">
            <button className="timerNavItem timerNavItemActive" type="button">
              <span aria-hidden="true">⏱</span>
              タイマー
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">📋</span>
              問題
            </button>
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("record")}
            >
              <span aria-hidden="true">⌛</span>
              タイム
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">▣</span>
              カード
            </button>
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("ranking")}
            >
              <span aria-hidden="true">👥</span>
              交流
            </button>
          </nav>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "stopwatch" && selectedSubject) {
    return (
      <main className="appShell">
        <section
          className="phoneFrame stopwatchScreen"
          aria-label={`${selectedSubject.title} 学習タイマー画面`}
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                setIsStopwatchRunning(false);
                setActiveScreen("timer");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>学習タイマー</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="stopwatchContent">
            <section className="timerSummary" aria-label="学習時間サマリー">
              <div>
                <span>今日</span>
                <strong>{formatStudyMinutes(studySummary.todayMinutes)}</strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>今月</span>
                <strong>{formatStudyMinutes(studySummary.monthMinutes)}</strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>総学習時間</span>
                <strong>{formatStudyMinutes(studySummary.totalMinutes)}</strong>
              </div>
            </section>

            <section className="stopwatchPanel" aria-label="ストップウォッチ">
              <div className="stopwatchSubjectImageWrap">
                <Image
                  src={selectedSubject.image}
                  alt={selectedSubject.title}
                  className="stopwatchSubjectImage"
                  priority
                />
              </div>

              <p className="stopwatchSubjectName">{selectedSubject.title}</p>
              <p className="stopwatchDisplay">{formatStopwatchTime(elapsedSeconds)}</p>

              <div className="stopwatchActions">
                <button
                  className="stopwatchCircleButton stopwatchCircleButtonSub"
                  type="button"
                  onClick={() => {
                    setElapsedSeconds(0);
                    setIsStopwatchRunning(false);
                    setStopwatchMessage("");
                  }}
                >
                  リセット
                </button>
                <button
                  className={`stopwatchCircleButton stopwatchCircleButtonMain ${
                    isStopwatchRunning ? "stopwatchCircleButtonStop" : ""
                  }`}
                  type="button"
                  onClick={() => setIsStopwatchRunning((current) => !current)}
                >
                  {isStopwatchRunning ? "停止" : "スタート"}
                </button>
                <button
                  className="stopwatchCircleButton stopwatchCircleButtonSub"
                  type="button"
                  disabled={isRegisteringStudySession}
                  onClick={handleStudySessionRegister}
                >
                  {isRegisteringStudySession ? "登録中" : "登録"}
                </button>
              </div>

              {stopwatchMessage ? (
                <p className="stopwatchMessage">{stopwatchMessage}</p>
              ) : null}
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "record") {
    const selectedPeriodOption =
      recordPeriodOptions.find((option) => option.id === selectedRecordPeriod) ??
      recordPeriodOptions[2];
    const calendarWeeks = Array.from({ length: 6 }, (_, weekIndex) => {
      return studyRecord?.calendar.days.slice(weekIndex * 7, weekIndex * 7 + 7) ?? [];
    });
    const periodSummary = studyRecord?.periodSummary ?? {
      averageMinutes: 0,
      studiedDays: 0,
      totalMinutes: 0,
    };

    return (
      <main className="appShell">
        <section
          className="phoneFrame recordScreen"
          aria-label="学習記録画面"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => setActiveScreen("menu")}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>学習記録</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="recordContent">
            <h2 className="recordPageTitle">学習推移</h2>

            <section className="recordCard" aria-label="期間別の学習時間">
              <h3>{selectedPeriodOption.title}</h3>
              <div className="recordPeriodTabs" aria-label="表示する期間">
                {recordPeriodOptions.map((option) => (
                  <button
                    className={
                      selectedRecordPeriod === option.id
                        ? "recordPeriodTab recordPeriodTabActive"
                        : "recordPeriodTab"
                    }
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedRecordPeriod(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="monthlyOverview">
                <div className="monthlyOverviewMain">
                  <span>合計</span>
                  <strong>{formatStudyMinutes(periodSummary.totalMinutes)}</strong>
                </div>
                <div>
                  <span>学習日数</span>
                  <strong>{periodSummary.studiedDays}日</strong>
                </div>
                <div>
                  <span>1日平均</span>
                  <strong>{formatStudyMinutes(periodSummary.averageMinutes)}</strong>
                </div>
              </div>

              <h3>時間配分</h3>
              <div className="studyBreakdown">
                {studyRecord?.subjectBreakdown.length ? (
                  studyRecord.subjectBreakdown.map((subject) => (
                    <div className="studyBreakdownRow" key={subject.subjectName}>
                      <div className="studyBreakdownHead">
                        <span>
                          <i
                            className="studyBreakdownDot"
                            style={{ backgroundColor: subject.color }}
                            aria-hidden="true"
                          />
                          {subject.subjectName}
                        </span>
                        <strong>{formatStudyMinutes(subject.minutes)}</strong>
                      </div>
                      <div
                        className="studyBreakdownTrack"
                        aria-label={`${subject.subjectName} ${subject.percentage}%`}
                      >
                        <span
                          style={{
                            width: `${subject.percentage}%`,
                            backgroundColor: subject.color,
                          }}
                        />
                      </div>
                      <small>選択期間の{subject.percentage}%</small>
                    </div>
                  ))
                ) : (
                  <p className="recordEmptyText">
                    選択期間の学習時間を登録すると配分が表示されます。
                  </p>
                )}
              </div>
            </section>

            <section className="recordCard calendarCard" aria-label="カレンダー">
              <h3>カレンダー</h3>
              <div className="calendarMonth">
                <button
                  type="button"
                  onClick={() =>
                    setRecordCalendarMonth((current) =>
                      addMonths(current.year, current.month, -1),
                    )
                  }
                  aria-label="前の月を表示"
                >
                  ‹
                </button>
                <strong>
                  {studyRecord
                    ? `${studyRecord.calendar.year}年${studyRecord.calendar.month}月`
                    : "今月"}
                </strong>
                <button
                  type="button"
                  onClick={() =>
                    setRecordCalendarMonth((current) =>
                      addMonths(current.year, current.month, 1),
                    )
                  }
                  aria-label="次の月を表示"
                >
                  ›
                </button>
              </div>

              <div className="calendarWeekdays" aria-hidden="true">
                {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="calendarGrid">
                {calendarWeeks.map((week, weekIndex) => (
                  <div className="calendarWeek" key={weekIndex}>
                    {week.map((day) => (
                      <span
                        className={[
                          "calendarDay",
                          day.isCurrentMonth ? "" : "calendarDayMuted",
                          day.minutes > 0 ? "calendarDayStudied" : "",
                          day.isToday ? "calendarDayToday" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={day.date}
                        title={`${day.date}: ${formatStudyMinutes(day.minutes)}`}
                      >
                        {day.day}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <nav className="timerBottomNav" aria-label="下部ナビゲーション">
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("timer")}
            >
              <span aria-hidden="true">⏱</span>
              タイマー
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">📋</span>
              問題
            </button>
            <button className="timerNavItem timerNavItemActive" type="button">
              <span aria-hidden="true">⌛</span>
              タイム
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">▣</span>
              カード
            </button>
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("ranking")}
            >
              <span aria-hidden="true">👥</span>
              交流
            </button>
          </nav>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "ranking") {
    const rankingItems = studyRanking?.ranking ?? [];

    return (
      <main className="appShell">
        <section
          className="phoneFrame rankingScreen"
          aria-label="学習ランキング画面"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => setActiveScreen("menu")}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>学習ランキング</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="rankingContent">
            <section className="rankingIntroCard">
              <h2>今週の勉強時間ランキング</h2>
              <p>他のユーザーの学習量をチェックしよう</p>
            </section>

            <section className="rankingList" aria-label="今週のランキング">
              {isStudyRankingLoading ? (
                <p className="rankingEmptyText">ランキングを読み込んでいます。</p>
              ) : null}

              {!isStudyRankingLoading && rankingItems.length === 0 ? (
                <p className="rankingEmptyText">
                  今週の学習記録が登録されるとランキングが表示されます。
                </p>
              ) : null}

              {rankingItems.map((item) => {
                const avatar = getAvatarIcon(item.avatarIconId);

                return (
                  <article
                    className={`rankingItem ${
                      item.isCurrentUser ? "rankingItemCurrent" : ""
                    }`}
                    key={item.gakuseiId}
                  >
                    <span className={`rankingRank rankingRank-${item.rank}`}>
                      {item.rank}
                    </span>
                    <Image
                      src={avatar.image}
                      alt=""
                      className="rankingAvatar"
                      aria-hidden="true"
                    />
                    <div className="rankingMeta">
                      <h3>{item.displayName}</h3>
                      <p>{item.isCurrentUser ? "あなた" : item.note}</p>
                    </div>
                    <strong>{formatStudyMinutes(item.weekMinutes)}</strong>
                  </article>
                );
              })}
            </section>
          </div>

          <nav className="timerBottomNav" aria-label="下部ナビゲーション">
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("timer")}
            >
              <span aria-hidden="true">⏱</span>
              タイマー
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">📋</span>
              問題
            </button>
            <button
              className="timerNavItem"
              type="button"
              onClick={() => setActiveScreen("record")}
            >
              <span aria-hidden="true">⌛</span>
              タイム
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">▣</span>
              カード
            </button>
            <button className="timerNavItem timerNavItemActive" type="button">
              <span aria-hidden="true">👥</span>
              交流
            </button>
          </nav>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview) {
    return (
      <main className="appShell">
        <section
          className="phoneFrame menuScreen"
          aria-label="Orenda メニュー画面"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="menuHeader">
            <Image
              src={logoImage}
              alt="Orenda"
              className="menuLogo"
              priority
            />
            <div className="menuUserActions">
              <p className="studentName" aria-label="ログイン中のユーザー名">
                {nickname || studentName ? `${nickname || studentName}さん` : ""}
              </p>
              <button className="logoutButton" type="button" onClick={handleLogout}>
                ログアウト
              </button>
            </div>
          </header>

          <section className="examCountdown" aria-label="国家試験カウントダウン">
            <p>国家試験まであと</p>
            <div className="examDays">
              {daysUntilExam === null ? (
                <strong className="examDaysUnset">未設定</strong>
              ) : (
                <>
                  <strong>{daysUntilExam}</strong>
                  <span>日</span>
                </>
              )}
            </div>
          </section>

          <nav className="menuList" aria-label="学習管理メニュー">
            {menuItems.map((item) => (
              <button
                className="menuItem"
                key={item.title}
                type="button"
                onClick={() => {
                  if (item.title === "学習タイマー") {
                    setActiveScreen("timer");
                  }

                  if (item.title === "勉強時間") {
                    setActiveScreen("record");
                  }

                  if (item.title === "交流") {
                    setActiveScreen("ranking");
                  }
                }}
              >
                <span className={`menuIcon menuIcon-${item.tone}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span className="menuText">
                  <span className="menuTitle">{item.title}</span>
                  <span className="menuDescription">{item.description}</span>
                </span>
                <span className="menuChevron" aria-hidden="true">
                  &gt;
                </span>
              </button>
            ))}
          </nav>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section
        className="phoneFrame"
        aria-label="Orenda ホーム画面"
        style={{ backgroundImage: `url(${backgroundImage.src})` }}
      >
        <div className="logoHeader">
          <Image
            src={logoImage}
            alt="Orenda"
            className="logoImage"
            priority
          />
        </div>

        <Image
          src={characterImage}
          alt="Orenda キャラクター"
          className="characterImage"
          priority
        />

        <button
          className="loginButton"
          type="button"
          onClick={() => setIsLoginOpen(true)}
          aria-haspopup="dialog"
        >
          <Image
            src={buttonImage}
            alt=""
            className="loginButtonImage"
            aria-hidden="true"
          />
          <span>ログイン</span>
        </button>
      </section>

      {isLoginOpen ? (
        <div className="modalOverlay" role="presentation">
          <section
            className="loginModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
          >
            <button
              className="modalClose"
              type="button"
              onClick={() => setIsLoginOpen(false)}
              aria-label="ログイン画面を閉じる"
            >
              ×
            </button>

            <h1 id="login-title">ログイン</h1>

            <form className="loginForm" onSubmit={handleLogin}>
              <label>
                ログインID
                <input
                  autoComplete="username"
                  inputMode="text"
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="学籍番号"
                  required
                  type="text"
                  value={loginId}
                />
              </label>

              <label>
                パスワード
                <span className="passwordInputWrap">
                  <input
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="パスワード"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    className="passwordToggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "パスワードを隠す" : "パスワードを表示"
                    }
                  >
                    <PasswordVisibilityIcon isVisible={showPassword} />
                  </button>
                </span>
              </label>

              {message ? <p className="formMessage">{message}</p> : null}

              <button className="submitButton" disabled={isSubmitting} type="submit">
                {isSubmitting ? "確認中..." : "ログインする"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
