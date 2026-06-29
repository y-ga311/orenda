"use client";

import Image, { type StaticImageData } from "next/image";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import backgroundImage from "@/source-images/background.png";
import buttonImage from "@/source-images/button.png";
import characterImage from "@/source-images/character01.png";
import reviewQuestImage from "@/source-images/018.png";
import logoImage from "@/source-images/logo01.png";
import byouriImage from "@/source-images/byouri.png";
import byouriCardImage from "@/source-images/byouri_card.png";
import eiseiImage from "@/source-images/eisei.png";
import eiseiCardImage from "@/source-images/eisei_card.png";
import hariImage from "@/source-images/hari.png";
import hariCardImage from "@/source-images/hari_card.png";
import iryogaironImage from "@/source-images/iryogairon.png";
import iryogaironCardImage from "@/source-images/iryogairon_card.png";
import kaibouImage from "@/source-images/kaibou.png";
import kaibouCardImage from "@/source-images/kaibou_card.png";
import kakuronImage from "@/source-images/kakuron.png";
import kakuronCardImage from "@/source-images/kakuron_card.png";
import kankeihoukiImage from "@/source-images/kankeihouki.png";
import kankeihoukiCardImage from "@/source-images/kankeihouki_card.png";
import keiketuImage from "@/source-images/keiketu.png";
import keiketuCardImage from "@/source-images/keiketu_card.png";
import kyuImage from "@/source-images/kyu.png";
import kyuCardImage from "@/source-images/kyu_card.png";
import rehaImage from "@/source-images/reha.png";
import rehaCardImage from "@/source-images/reha_card.png";
import seiriImage from "@/source-images/seiri.png";
import seiriCardImage from "@/source-images/seiri_card.png";
import souronImage from "@/source-images/souron.png";
import souronCardImage from "@/source-images/souron_card.png";
import tougaiImage from "@/source-images/tougai.png";
import tougaiCardImage from "@/source-images/tougai_card.png";
import tourinImage from "@/source-images/tourin.png";
import tourinCardImage from "@/source-images/tourin_card.png";
import medal001G from "@/source-images/medal/001G.png";
import medal002G from "@/source-images/medal/002G.png";
import medal003G from "@/source-images/medal/003G.png";
import medal004G from "@/source-images/medal/004G.png";
import medal005G from "@/source-images/medal/005G.png";
import medal006G from "@/source-images/medal/006G.png";
import medal007G from "@/source-images/medal/007G.png";
import medal008G from "@/source-images/medal/008G.png";
import medal009G from "@/source-images/medal/009G.png";
import medal010G from "@/source-images/medal/010G.png";
import medal011G from "@/source-images/medal/011G.png";
import medal012G from "@/source-images/medal/012G.png";
import medal006S from "@/source-images/medal/006S.png";
import medal010C from "@/source-images/medal/010C.png";
import { avatarIcons, getAvatarIcon, type AvatarIconId } from "@/lib/avatarIcons";
import { GACHA_POINTS_PER_TEACHER_QUEST_CORRECT, GACHA_SPIN_COST_PT } from "@/lib/gachaConstants";
import { normalizeGachaPoints } from "@/lib/normalizeGachaPoints";
import {
  isQuestAnswerCorrect,
} from "@/lib/questQuestions";
import type { TeacherQuestSummary } from "@/lib/teacherQuestDb";
import {
  formatNationalExamSource,
  type QuestAnswerLogEntry,
  type QuestSessionQuestion,
  type QuestSubcategoryRow,
} from "@/lib/questDbTypes";
import {
  formatQuestQuestionCountLabel,
  getDefaultQuestQuestionCount,
  getQuestQuestionCountHint,
  getSelectableQuestQuestionCounts,
  normalizeSelectedQuestQuestionCount,
  shouldShowQuestSubcategoryCountBadge,
  sumQuestSubcategoryQuestionCounts,
  type QuestQuestionCount,
} from "@/lib/questSubcategories";
import { getStudyType, studyTypes } from "@/lib/studyTypes";
import { parseStudyTypeId, type StudyTypeId } from "@/lib/studyTypeIds";
import { TimerBottomNav } from "@/components/TimerBottomNav";
import {
  TeacherQuestBattleScreen,
  type TeacherQuestPhase,
} from "@/components/TeacherQuestBattleScreen";
import { useTeacherQuestTransition } from "@/components/TeacherQuestBattleTransition";
import { useBottomNavVisibility } from "@/lib/useBottomNavVisibility";
import { getTeacherQuestSprite } from "@/lib/teacherQuestSprites";

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

const collectionCards = [
  { title: "解剖学", image: kaibouCardImage },
  { title: "生理学", image: seiriCardImage },
  { title: "病理学概論", image: byouriCardImage },
  { title: "臨床医学総論", image: souronCardImage },
  { title: "臨床医学各論", image: kakuronCardImage },
  { title: "リハビリテーション医学", image: rehaCardImage },
  { title: "東洋医学概論", image: tougaiCardImage },
  { title: "経絡経穴概論", image: keiketuCardImage },
  { title: "東洋医学臨床論", image: tourinCardImage },
  { title: "はり理論", image: hariCardImage },
  { title: "きゅう理論", image: kyuCardImage },
  { title: "医療概論", image: iryogaironCardImage },
  { title: "衛生学", image: eiseiCardImage },
  { title: "関係法規", image: kankeihoukiCardImage },
];

type MedalTier = "G" | "S" | "C";

type AchievementMedalEntry = {
  id: string;
  title: string;
  image: StaticImageData;
  medalNo: string;
  tier: MedalTier;
  unlocked: boolean;
};

const medalImageMap: Record<string, StaticImageData> = {
  "001G": medal001G,
  "002G": medal002G,
  "003G": medal003G,
  "004G": medal004G,
  "005G": medal005G,
  "006G": medal006G,
  "007G": medal007G,
  "008G": medal008G,
  "009G": medal009G,
  "010G": medal010G,
  "011G": medal011G,
  "012G": medal012G,
  "006S": medal006S,
  "010C": medal010C,
};

function getMedalImage(medalNo: string, tier: MedalTier) {
  return medalImageMap[`${medalNo}${tier}`] ?? medalImageMap[`${medalNo}G`];
}

const achievementMedalDefs = [
  { id: "career-nav", title: "キャリアnavi", medalNo: "001", tier: "G", unlocked: true },
  { id: "company-session", title: "企業説明会", medalNo: "002", tier: "G", unlocked: true },
  { id: "ankoku", title: "暗刻", medalNo: "003", tier: "G", unlocked: false },
  { id: "mogusa-factory", title: "もぐさ工場見学", medalNo: "004", tier: "G", unlocked: false },
  { id: "career-nav2", title: "キャリアnavi2", medalNo: "005", tier: "G", unlocked: false },
  { id: "anmame", title: "暗豆", medalNo: "006", tier: "S", unlocked: true },
  { id: "job-session", title: "就職説明会", medalNo: "007", tier: "G", unlocked: false },
  { id: "anki", title: "暗爺", medalNo: "008", tier: "G", unlocked: true },
  { id: "sports-win", title: "球技大会優勝", medalNo: "006", tier: "S", unlocked: true },
  { id: "attendance-95", title: "出席率95%以上", medalNo: "010", tier: "C", unlocked: true },
  { id: "mock-exam-1st", title: "模擬試験1位", medalNo: "011", tier: "G", unlocked: false },
  { id: "regular-exam-1st", title: "定期試験1位", medalNo: "010", tier: "C", unlocked: true },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  medalNo: string;
  tier: MedalTier;
  unlocked: boolean;
}>;

/** Pencil メダル画面（達成一覧）準拠のプレビューデータ */
const achievementMedals: AchievementMedalEntry[] = achievementMedalDefs.map((medal) => ({
  ...medal,
  image: getMedalImage(medal.medalNo, medal.tier),
}));

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
  avatarIconId: string;
  className: string | null;
  displayName: string;
  gakuseiId: string;
  isCurrentUser: boolean;
  note: string;
  rank: number | null;
  totalMinutes: number;
};

const rankingPeriodOptions = [
  { id: "week", label: "今週", title: "今週の勉強時間ランキング" },
  { id: "month", label: "今月", title: "今月の勉強時間ランキング" },
  { id: "year", label: "今年", title: "今年の勉強時間ランキング" },
  { id: "total", label: "総合", title: "総学習時間ランキング" },
] as const;

type RankingPeriod = (typeof rankingPeriodOptions)[number]["id"];

type StudyRankingRewardInfo = {
  badgeLabel: string;
  description: string;
  encouragement: string;
  headline: string;
  periodType: "week" | "month";
  points: number;
  recentGrants: Array<{
    grantedAt: string;
    periodKey: string;
    periodType: string;
    pointsAwarded: number;
  }>;
};

type StudyRankingData = {
  currentUser: StudyRankingItem | null;
  period: RankingPeriod;
  ranking: StudyRankingItem[];
  range: {
    label: string;
  } | null;
  rewardInfo: StudyRankingRewardInfo | null;
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

function buildStudyPieGradient(
  subjects: StudyRecordData["subjectBreakdown"],
): string {
  if (subjects.length === 0) {
    return "#e5e5ea";
  }

  const totalMinutes = subjects.reduce((sum, subject) => sum + subject.minutes, 0);
  if (totalMinutes <= 0) {
    return "#e5e5ea";
  }

  let cumulativePercent = 0;
  const stops = subjects.map((subject, index) => {
    const start = cumulativePercent;
    const slicePercent = (subject.minutes / totalMinutes) * 100;
    cumulativePercent += slicePercent;
    const end = index === subjects.length - 1 ? 100 : cumulativePercent;

    return `${subject.color} ${start}% ${end}%`;
  });

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function buildStudyPieChartLabel(
  subjects: StudyRecordData["subjectBreakdown"],
): string {
  return subjects
    .map((subject) => `${subject.subjectName} ${subject.percentage}%`)
    .join("、");
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
  const { runTeacherQuestTransition, isTeacherQuestTransitioning } =
    useTeacherQuestTransition();
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
  const [studyTypeId, setStudyTypeId] = useState<StudyTypeId | null>(null);
  const [pendingStudyTypeId, setPendingStudyTypeId] = useState<StudyTypeId | null>(
    null,
  );
  const [studyTypeMessage, setStudyTypeMessage] = useState("");
  const [isStudyTypeSubmitting, setIsStudyTypeSubmitting] = useState(false);
  const [questView, setQuestView] = useState<
    "select" | "setup" | "question" | "result"
  >("select");
  const [selectedQuestSubject, setSelectedQuestSubject] =
    useState<StudySubject | null>(null);
  const [selectedQuestSubcategoryIds, setSelectedQuestSubcategoryIds] = useState<
    string[]
  >([]);
  const [selectedQuestQuestionCount, setSelectedQuestQuestionCount] =
    useState<QuestQuestionCount>(10);
  const [questQuestionIndex, setQuestQuestionIndex] = useState(0);
  const [isTeacherQuest, setIsTeacherQuest] = useState(false);
  const [isReviewQuest, setIsReviewQuest] = useState(false);
  const [selectedQuestChoice, setSelectedQuestChoice] = useState<number | null>(null);
  const [questAnswerSubmitted, setQuestAnswerSubmitted] = useState(false);
  const [questCorrectCount, setQuestCorrectCount] = useState(0);
  const [isQuestCompleting, setIsQuestCompleting] = useState(false);
  const [questCompleteMessage, setQuestCompleteMessage] = useState("");
  const [questSetupSubcategories, setQuestSetupSubcategories] = useState<
    QuestSubcategoryRow[]
  >([]);
  const [questSessionQuestions, setQuestSessionQuestions] = useState<
    QuestSessionQuestion[]
  >([]);
  const [questAnswerLog, setQuestAnswerLog] = useState<QuestAnswerLogEntry[]>([]);
  const [isQuestSetupLoading, setIsQuestSetupLoading] = useState(false);
  const [isQuestStarting, setIsQuestStarting] = useState(false);
  const [questSetupMessage, setQuestSetupMessage] = useState("");
  const [questSubjectQuestionCounts, setQuestSubjectQuestionCounts] = useState<
    Record<string, number>
  >({});
  const [isQuestSubjectCountsLoading, setIsQuestSubjectCountsLoading] =
    useState(false);
  const [questReviewQuestionCount, setQuestReviewQuestionCount] = useState(0);
  const [isQuestReviewCountLoading, setIsQuestReviewCountLoading] = useState(false);
  const [teacherQuestAvailable, setTeacherQuestAvailable] = useState(false);
  const [teacherQuestQuestionCount, setTeacherQuestQuestionCount] = useState(0);
  const [teacherQuestMeta, setTeacherQuestMeta] = useState<TeacherQuestSummary | null>(
    null,
  );
  const [teacherQuestId, setTeacherQuestId] = useState<string | null>(null);
  const [isTeacherQuestLoading, setIsTeacherQuestLoading] = useState(false);
  const [isTeacherQuestStarting, setIsTeacherQuestStarting] = useState(false);
  const [teacherQuestPhase, setTeacherQuestPhase] =
    useState<TeacherQuestPhase>("encounter");
  const [isQuestReviewStarting, setIsQuestReviewStarting] = useState(false);
  const [questSelectDataVersion, setQuestSelectDataVersion] = useState(0);
  const questSelectDataRequestRef = useRef(0);
  const [message, setMessage] = useState("");
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<{
    dailyBonusAwarded: boolean;
    dailyBonusPoints: number;
    gachaPoints: number;
    displayName: string;
  } | null>(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [myPageTab, setMyPageTab] = useState<"edit" | "type">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isLoggedInPreview, setIsLoggedInPreview] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeScreen, setActiveScreen] = useState<
    | "menu"
    | "timer"
    | "stopwatch"
    | "record"
    | "ranking"
    | "collection"
    | "medal"
    | "gacha"
    | "mypage"
    | "quest"
  >("menu");
  const [stopwatchReturnScreen, setStopwatchReturnScreen] = useState<"timer" | "quest">(
    "timer",
  );
  const [selectedSubject, setSelectedSubject] = useState<StudySubject | null>(null);
  const [selectedCollectionCard, setSelectedCollectionCard] = useState<
    (typeof collectionCards)[number] | null
  >(null);
  const [gachaResultCard, setGachaResultCard] = useState<
    (typeof collectionCards)[number] | null
  >(null);
  const [isGachaPlaying, setIsGachaPlaying] = useState(false);
  const [gachaVideoKey, setGachaVideoKey] = useState(0);
  const gachaVideoEndedRef = useRef(false);
  const gachaVideoRef = useRef<HTMLVideoElement | null>(null);
  const bottomNavResetKey =
    activeScreen === "quest"
      ? `quest-${questView}`
      : activeScreen === "gacha" && isGachaPlaying
        ? "gacha-video"
        : activeScreen;
  const { visible: bottomNavVisible, bindScrollRef: bindBottomNavScrollRef } =
    useBottomNavVisibility(bottomNavResetKey);
  const [studySummary, setStudySummary] = useState<StudySummary>({
    todayMinutes: 0,
    monthMinutes: 0,
    totalMinutes: 0,
  });
  const [studyRecord, setStudyRecord] = useState<StudyRecordData | null>(null);
  const [studyRanking, setStudyRanking] = useState<StudyRankingData | null>(null);
  const [selectedRecordPeriod, setSelectedRecordPeriod] =
    useState<RecordPeriod>("month");
  const [selectedRankingPeriod, setSelectedRankingPeriod] =
    useState<RankingPeriod>("week");
  const [isStudySummaryLoading, setIsStudySummaryLoading] = useState(false);
  const [isStudyRankingLoading, setIsStudyRankingLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchMessage, setStopwatchMessage] = useState("");
  const [isRegisteringStudySession, setIsRegisteringStudySession] = useState(false);
  const [gachaPoints, setGachaPoints] = useState(0);
  const [isGachaChargeLoading, setIsGachaChargeLoading] = useState(false);
  const [gachaChargeMessage, setGachaChargeMessage] = useState("");

  useLayoutEffect(() => {
    if (!selectedCollectionCard) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
    };
  }, [selectedCollectionCard]);

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

  const loadQuestSelectData = useCallback(async () => {
    const requestId = questSelectDataRequestRef.current + 1;
    questSelectDataRequestRef.current = requestId;

    setIsQuestSubjectCountsLoading(true);
    setIsQuestReviewCountLoading(true);
    setIsTeacherQuestLoading(true);

    try {
      const subjectIds = studySubjects.map((subject) => subject.id).join(",");
      const [subjectCountsResponse, reviewCountResponse, teacherQuestResponse] =
        await Promise.all([
          fetch(
            `/api/quest-subject-counts?subjectIds=${encodeURIComponent(subjectIds)}`,
          ).catch(() => null),
          fetch("/api/quest-review").catch(() => null),
          fetch("/api/teacher-quest").catch(() => null),
        ]);

      if (questSelectDataRequestRef.current !== requestId) {
        return;
      }

      if (subjectCountsResponse?.ok) {
        const result = (await subjectCountsResponse.json().catch(() => null)) as {
          counts?: Record<string, number>;
        } | null;

        if (result?.counts) {
          setQuestSubjectQuestionCounts(result.counts);
        }
      }

      if (reviewCountResponse?.ok) {
        const result = (await reviewCountResponse.json().catch(() => null)) as {
          count?: number;
        } | null;

        setQuestReviewQuestionCount(
          typeof result?.count === "number" ? result.count : 0,
        );
      }

      if (teacherQuestResponse?.ok) {
        const result = (await teacherQuestResponse.json().catch(() => null)) as {
          available?: boolean;
          questionCount?: number;
          quest?: TeacherQuestSummary | null;
        } | null;

        setTeacherQuestAvailable(result?.available === true);
        setTeacherQuestQuestionCount(
          typeof result?.questionCount === "number" ? result.questionCount : 0,
        );
        setTeacherQuestMeta(result?.quest ?? null);
      } else {
        setTeacherQuestAvailable(false);
        setTeacherQuestQuestionCount(0);
        setTeacherQuestMeta(null);
      }
    } finally {
      if (questSelectDataRequestRef.current === requestId) {
        setIsQuestSubjectCountsLoading(false);
        setIsQuestReviewCountLoading(false);
        setIsTeacherQuestLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoggedInPreview || activeScreen !== "quest") {
      return;
    }

    void loadQuestSelectData();
  }, [activeScreen, isLoggedInPreview, loadQuestSelectData, questSelectDataVersion]);

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

      const params = new URLSearchParams({
        period: selectedRankingPeriod,
      });
      const response = await fetch(`/api/study-ranking?${params}`).catch(() => null);

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
  }, [activeScreen, isLoggedInPreview, selectedRankingPeriod]);

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
        dailyLoginBonusAwarded?: boolean;
        dailyLoginBonusPoints?: unknown;
        gachaPoints?: unknown;
        name?: string | null;
        needsProfileSetup?: boolean;
        nickname?: string | null;
        studyTypeId?: unknown;
      };
    } | null;

    const dailyLoginBonusPoints = normalizeGachaPoints(
      result?.student?.dailyLoginBonusPoints,
    );

    setStudentName(result?.student?.name ?? "");
    setNickname(result?.student?.nickname ?? "");
    setDaysUntilExam(result?.student?.daysUntilExam ?? null);
    setSelectedAvatarIconId(result?.student?.avatarIconId ?? "pixel01");
    setStudyTypeId(parseStudyTypeId(result?.student?.studyTypeId));
    setPendingStudyTypeId(parseStudyTypeId(result?.student?.studyTypeId));
    const gachaPoints = normalizeGachaPoints(result?.student?.gachaPoints);
    const dailyLoginBonusAwarded = Boolean(result?.student?.dailyLoginBonusAwarded);

    setGachaPoints(gachaPoints);
    setNeedsProfileSetup(Boolean(result?.student?.needsProfileSetup));
    setActiveScreen("menu");
    setIsLoginOpen(false);
    setIsLoggedInPreview(true);
    setPassword("");
    setMessage("");
    setLoginSuccessNotice({
      displayName: result?.student?.nickname || result?.student?.name || "",
      gachaPoints,
      dailyBonusAwarded: dailyLoginBonusAwarded,
      dailyBonusPoints: dailyLoginBonusPoints,
    });
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
        gachaPoints?: unknown;
        name?: string | null;
        nickname?: string | null;
        studyTypeId?: unknown;
      };
    } | null;

    if (!response.ok) {
      setProfileMessage(result?.message ?? "プロフィールを登録できませんでした。");
      return;
    }

    setStudentName(result?.student?.name ?? studentName);
    setNickname(result?.student?.nickname ?? nickname);
    setSelectedAvatarIconId(result?.student?.avatarIconId ?? selectedAvatarIconId);
    setStudyTypeId(parseStudyTypeId(result?.student?.studyTypeId ?? studyTypeId));
    setGachaPoints(normalizeGachaPoints(result?.student?.gachaPoints ?? gachaPoints));
    setNeedsProfileSetup(false);

    if (activeScreen === "mypage") {
      setProfileMessage("変更を保存しました。");
    } else {
      setProfileMessage("");
    }
  }

  async function handleStudyTypeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStudyTypeMessage("");

    if (pendingStudyTypeId === null) {
      setStudyTypeMessage("タイプを選択してください。");
      return;
    }

    setIsStudyTypeSubmitting(true);

    const response = await fetch("/api/study-type", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studyTypeId: pendingStudyTypeId,
      }),
    }).catch(() => null);

    setIsStudyTypeSubmitting(false);

    if (!response) {
      setStudyTypeMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      message?: string;
      student?: {
        studyTypeId?: unknown;
      };
    } | null;

    if (!response.ok) {
      setStudyTypeMessage(result?.message ?? "タイプを保存できませんでした。");
      return;
    }

    const savedStudyTypeId = parseStudyTypeId(result?.student?.studyTypeId);
    setStudyTypeId(savedStudyTypeId);
    setPendingStudyTypeId(savedStudyTypeId);
    setStudyTypeMessage("タイプを保存しました。");
  }

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    }).catch(() => null);

    setIsLoggedInPreview(false);
    setActiveScreen("menu");
    setSelectedSubject(null);
    setSelectedCollectionCard(null);
    setGachaResultCard(null);
    setIsGachaPlaying(false);
    setGachaVideoKey(0);
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setNeedsProfileSetup(false);
    setMyPageTab("edit");
    setIsLoginOpen(false);
    setLoginSuccessNotice(null);
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
    setSelectedRankingPeriod("week");
    setRecordCalendarMonth(getCurrentJapanYearMonth());
    setSelectedAvatarIconId("pixel01");
    setStudyTypeId(null);
    setPendingStudyTypeId(null);
    setStudyTypeMessage("");
    setMessage("");
    setProfileMessage("");
    setStopwatchMessage("");
    setStopwatchReturnScreen("timer");
    setGachaPoints(0);
    setGachaChargeMessage("");
    setQuestView("select");
    setSelectedQuestSubject(null);
    setSelectedQuestSubcategoryIds([]);
    setSelectedQuestQuestionCount(10);
    setQuestQuestionIndex(0);
    setIsTeacherQuest(false);
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    setQuestCorrectCount(0);
    setIsQuestCompleting(false);
    setQuestCompleteMessage("");
    setQuestSetupSubcategories([]);
    setQuestSessionQuestions([]);
    setQuestAnswerLog([]);
    setIsQuestSetupLoading(false);
    setIsQuestStarting(false);
    setQuestSetupMessage("");
    setQuestSubjectQuestionCounts({});
    setIsQuestSubjectCountsLoading(false);
    setQuestReviewQuestionCount(0);
    setIsQuestReviewCountLoading(false);
    setIsReviewQuest(false);
    setIsQuestReviewStarting(false);
    setTeacherQuestAvailable(false);
    setTeacherQuestQuestionCount(0);
    setTeacherQuestMeta(null);
    setTeacherQuestId(null);
    setIsTeacherQuestLoading(false);
    setIsTeacherQuestStarting(false);
    setTeacherQuestPhase("encounter");
  }

  function resetQuestScreen() {
    setQuestView("select");
    setSelectedQuestSubject(null);
    setSelectedQuestSubcategoryIds([]);
    setSelectedQuestQuestionCount(10);
    setQuestQuestionIndex(0);
    setIsTeacherQuest(false);
    setIsReviewQuest(false);
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    setQuestCorrectCount(0);
    setIsQuestCompleting(false);
    setQuestCompleteMessage("");
    setQuestSetupSubcategories([]);
    setQuestSessionQuestions([]);
    setQuestAnswerLog([]);
    setIsQuestSetupLoading(false);
    setIsQuestStarting(false);
    setQuestSetupMessage("");
    setIsQuestReviewStarting(false);
    setTeacherQuestId(null);
    setTeacherQuestMeta(null);
    setTeacherQuestPhase("encounter");
    setQuestSelectDataVersion((current) => current + 1);
  }

  function returnToQuestSelect() {
    setQuestView("select");
    setQuestSelectDataVersion((current) => current + 1);
  }

  const navigateToTimer = useCallback(() => {
    setActiveScreen("timer");
  }, []);

  const navigateToQuest = useCallback(() => {
    resetQuestScreen();
    setActiveScreen("quest");
  }, []);

  const navigateToRecord = useCallback(() => {
    setActiveScreen("record");
  }, []);

  const navigateToCollection = useCallback(() => {
    setActiveScreen("collection");
  }, []);

  const navigateToRanking = useCallback(() => {
    setActiveScreen("ranking");
  }, []);

  async function openQuestSetup(subject: StudySubject) {
    setSelectedQuestSubject(subject);
    setIsTeacherQuest(false);
    setIsReviewQuest(false);
    setSelectedQuestSubcategoryIds([]);
    setSelectedQuestQuestionCount(10);
    setQuestQuestionIndex(0);
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    setQuestCorrectCount(0);
    setIsQuestCompleting(false);
    setQuestCompleteMessage("");
    setQuestSetupSubcategories([]);
    setQuestSessionQuestions([]);
    setQuestAnswerLog([]);
    setIsQuestStarting(false);
    setQuestSetupMessage("");
    setIsQuestSetupLoading(true);
    setQuestView("setup");

    const response = await fetch(
      `/api/quest-subcategories?subjectId=${encodeURIComponent(subject.id)}`,
    ).catch(() => null);

    setIsQuestSetupLoading(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setQuestSetupMessage(result?.message ?? "中分類の取得に失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      subcategories?: QuestSubcategoryRow[];
    } | null;
    const subcategories = result?.subcategories ?? [];

    setQuestSetupSubcategories(subcategories);

    const initialSubcategoryIds = subcategories
      .filter((subcategory) => subcategory.questionCount > 0)
      .slice(0, 1)
      .map((subcategory) => subcategory.id);
    const availableCount = sumQuestSubcategoryQuestionCounts(
      subcategories,
      initialSubcategoryIds,
    );

    setSelectedQuestSubcategoryIds(initialSubcategoryIds);
    setSelectedQuestQuestionCount(getDefaultQuestQuestionCount(availableCount));
  }

  async function startQuestQuestions() {
    if (!selectedQuestSubject || selectedQuestSubcategoryIds.length === 0) {
      return;
    }

    setIsQuestStarting(true);
    setQuestSetupMessage("");

    const response = await fetch("/api/quest-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subjectId: selectedQuestSubject.id,
        subcategoryIds: selectedQuestSubcategoryIds,
        questionCount: selectedQuestQuestionCount,
      }),
    }).catch(() => null);

    setIsQuestStarting(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setQuestSetupMessage(result?.message ?? "問題の取得に失敗しました。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      questions?: QuestSessionQuestion[];
      questionCount?: number;
    } | null;
    const questions = result?.questions ?? [];

    if (questions.length === 0) {
      setQuestSetupMessage("問題を取得できませんでした。");
      return;
    }

    setQuestSessionQuestions(questions);
    setSelectedQuestQuestionCount(result?.questionCount ?? questions.length);
    setQuestQuestionIndex(0);
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    setQuestCorrectCount(0);
    setQuestAnswerLog([]);
    setIsQuestCompleting(false);
    setQuestCompleteMessage("");
    setQuestView("question");
  }

  async function openTeacherQuest() {
    if (
      isTeacherQuestStarting ||
      isTeacherQuestTransitioning ||
      isTeacherQuestLoading ||
      !teacherQuestAvailable ||
      teacherQuestQuestionCount === 0
    ) {
      return;
    }

    runTeacherQuestTransition(async () => {
      setIsTeacherQuestStarting(true);

      const response = await fetch("/api/teacher-quest", {
        method: "POST",
      }).catch(() => null);

      setIsTeacherQuestStarting(false);

      if (!response?.ok) {
        setTeacherQuestAvailable(false);
        setTeacherQuestQuestionCount(0);
        setTeacherQuestMeta(null);
        return { ok: false };
      }

      const result = (await response.json().catch(() => null)) as {
        quest?: TeacherQuestSummary;
        questions?: QuestSessionQuestion[];
        questionCount?: number;
      } | null;
      const questions = result?.questions ?? [];
      const quest = result?.quest ?? null;

      if (questions.length === 0 || !quest) {
        setTeacherQuestAvailable(false);
        setTeacherQuestQuestionCount(0);
        setTeacherQuestMeta(null);
        return { ok: false };
      }

      setSelectedQuestSubject(null);
      setIsTeacherQuest(true);
      setIsReviewQuest(false);
      setSelectedQuestSubcategoryIds([]);
      setQuestSessionQuestions(questions);
      setTeacherQuestId(quest.id);
      setTeacherQuestMeta(quest);
      setSelectedQuestQuestionCount(result?.questionCount ?? questions.length);
      setQuestQuestionIndex(0);
      setSelectedQuestChoice(null);
      setQuestAnswerSubmitted(false);
      setQuestCorrectCount(0);
      setQuestAnswerLog([]);
      setIsQuestCompleting(false);
      setQuestCompleteMessage("");
      setQuestSetupSubcategories([]);
      setIsQuestSetupLoading(false);
      setIsQuestStarting(false);
      setQuestSetupMessage("");
      setQuestView("question");
      setTeacherQuestPhase("encounter");

      return { ok: true };
    });
  }

  async function openReviewQuest() {
    if (isQuestReviewStarting || questReviewQuestionCount === 0) {
      return;
    }

    setIsQuestReviewStarting(true);

    try {
      const response = await fetch("/api/quest-review", {
        method: "POST",
      }).catch(() => null);

      if (!response?.ok) {
        return;
      }

      const result = (await response.json().catch(() => null)) as {
        questions?: QuestSessionQuestion[];
        questionCount?: number;
      } | null;
      const questions = result?.questions ?? [];

      if (questions.length === 0) {
        setQuestReviewQuestionCount(0);
        return;
      }

      setSelectedQuestSubject(null);
      setIsTeacherQuest(false);
      setIsReviewQuest(true);
      setSelectedQuestSubcategoryIds([]);
      setQuestSessionQuestions(questions);
      setSelectedQuestQuestionCount(result?.questionCount ?? questions.length);
      setQuestQuestionIndex(0);
      setSelectedQuestChoice(null);
      setQuestAnswerSubmitted(false);
      setQuestCorrectCount(0);
      setQuestAnswerLog([]);
      setIsQuestCompleting(false);
      setQuestCompleteMessage("");
      setQuestSetupSubcategories([]);
      setIsQuestSetupLoading(false);
      setIsQuestStarting(false);
      setQuestSetupMessage("");
      setQuestView("question");
    } finally {
      setIsQuestReviewStarting(false);
    }
  }

  async function completeQuestAndShowResult() {
    if (isQuestCompleting) {
      return;
    }

    setIsQuestCompleting(true);
    setQuestCompleteMessage("");

    const response = await fetch("/api/quest-complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correctCount: questCorrectCount,
        questionCount: selectedQuestQuestionCount,
        questScope: isTeacherQuest ? "teacher" : isReviewQuest ? "review" : "subject",
        ...(isTeacherQuest
          ? {
              teacherQuestId,
              answers: questAnswerLog,
            }
          : isReviewQuest
            ? { answers: questAnswerLog }
            : !selectedQuestSubject || selectedQuestSubcategoryIds.length === 0
              ? {}
              : {
                  subjectId: selectedQuestSubject.id,
                  subcategoryIds: selectedQuestSubcategoryIds,
                  answers: questAnswerLog,
                }),
      }),
    }).catch(() => null);

    setIsQuestCompleting(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setQuestCompleteMessage(
        result?.message ?? "ガチャポイントを付与できませんでした。",
      );
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      gachaPoints?: unknown;
    } | null;

    setGachaPoints(normalizeGachaPoints(result?.gachaPoints));
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    setQuestCompleteMessage("");
    setQuestView("result");
  }

  function goToNextQuestQuestion() {
    if (questQuestionIndex + 1 >= selectedQuestQuestionCount) {
      void completeQuestAndShowResult();
      return;
    }

    setQuestQuestionIndex((current) => current + 1);
    setSelectedQuestChoice(null);
    setQuestAnswerSubmitted(false);
    if (isTeacherQuest) {
      setTeacherQuestPhase("intro");
    }
  }

  function getQuestChoiceClassName(
    index: number,
    correctIndex: number,
  ): string {
    if (!questAnswerSubmitted || selectedQuestChoice === null) {
      return "questChoice";
    }

    if (index === selectedQuestChoice) {
      return index === correctIndex
        ? "questChoice questChoiceCorrect"
        : "questChoice questChoiceWrong";
    }

    return "questChoice questChoiceMuted";
  }

  function openStopwatch(subject: StudySubject, returnTo: "timer" | "quest" = "timer") {
    setStopwatchReturnScreen(returnTo);
    setSelectedSubject(subject);
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setStopwatchMessage("");
    setActiveScreen("stopwatch");
  }

  const finishGachaDraw = useCallback(() => {
    if (gachaVideoEndedRef.current) {
      return;
    }

    gachaVideoEndedRef.current = true;

    const nextCard =
      collectionCards[Math.floor(Math.random() * collectionCards.length)] ??
      collectionCards[0];

    setIsGachaPlaying(false);
    setGachaResultCard(nextCard);
  }, []);

  const startGachaDraw = useCallback(async () => {
    if (isGachaChargeLoading || isGachaPlaying) {
      return;
    }

    setIsGachaChargeLoading(true);
    setGachaChargeMessage("");

    try {
      const response = await fetch("/api/gacha-spin", {
        method: "POST",
      }).catch(() => null);

      if (!response?.ok) {
        const payload = response
          ? ((await response.json().catch(() => null)) as { message?: string } | null)
          : null;
        setGachaChargeMessage(payload?.message ?? "ガチャを回せませんでした。");
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        gachaPoints?: unknown;
      } | null;

      setGachaPoints(normalizeGachaPoints(payload?.gachaPoints));

      gachaVideoEndedRef.current = false;
      setGachaResultCard(null);
      setIsGachaPlaying(true);
      setGachaVideoKey((current) => current + 1);
    } finally {
      setIsGachaChargeLoading(false);
    }
  }, [isGachaChargeLoading, isGachaPlaying]);

  /** 動画ノードへの ref とメタデータ準備タイミング差を吸収して再生開始する */
  useLayoutEffect(() => {
    if (!isGachaPlaying || activeScreen !== "gacha") {
      return;
    }

    const video = gachaVideoRef.current;
    if (!video) {
      return;
    }

    let cancelled = false;
    let playbackAttempted = false;

    let endFallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let fallbackScheduled = false;

    const scheduleEndFallback = () => {
      if (fallbackScheduled) {
        return;
      }
      fallbackScheduled = true;

      const finiteDuration =
        typeof video.duration === "number" &&
        Number.isFinite(video.duration) &&
        video.duration > 0;
      const ms = finiteDuration
        ? Math.min(Math.ceil(video.duration * 1000) + 4_000, 180_000)
        : 180_000;

      endFallbackTimer = setTimeout(() => {
        if (!cancelled && !gachaVideoEndedRef.current) {
          finishGachaDraw();
        }
      }, ms);
    };

    const tryPlay = () => {
      if (cancelled || playbackAttempted) {
        return;
      }

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      playbackAttempted = true;
      video.removeEventListener("loadeddata", onMediaProgress);
      video.removeEventListener("canplay", onMediaProgress);

      video.currentTime = 0;
      void video.play().catch(() => {
        if (!cancelled) {
          finishGachaDraw();
        }
      });
    };

    const onMediaProgress = () => {
      tryPlay();
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      scheduleEndFallback();
    } else {
      video.addEventListener("loadedmetadata", scheduleEndFallback, { once: true });
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      tryPlay();
    } else {
      video.addEventListener("loadeddata", onMediaProgress, { passive: true });
      video.addEventListener("canplay", onMediaProgress, { passive: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", scheduleEndFallback);
      video.removeEventListener("loadeddata", onMediaProgress);
      video.removeEventListener("canplay", onMediaProgress);

      if (endFallbackTimer) {
        clearTimeout(endFallbackTimer);
      }
    };
  }, [isGachaPlaying, activeScreen, gachaVideoKey, finishGachaDraw]);

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
      body: JSON.stringify({ durationMinutes }),
    }).catch(() => null);

    setIsRegisteringStudySession(false);

    if (!response?.ok) {
      const result = (await response?.json().catch(() => null)) as {
        message?: string;
      } | null;
      setStopwatchMessage(result?.message ?? "ガチャポイントを付与できませんでした。");
      return;
    }

    const result = (await response.json().catch(() => null)) as {
      gachaPoints?: unknown;
      pointsEarned?: unknown;
    } | null;
    const pointsEarned = normalizeGachaPoints(result?.pointsEarned);

    setGachaPoints(normalizeGachaPoints(result?.gachaPoints));
    setElapsedSeconds(0);
    setIsStopwatchRunning(false);
    setStopwatchMessage(
      pointsEarned > 0
        ? `ガチャポイント +${pointsEarned.toLocaleString("ja-JP")} pt を獲得しました。`
        : "ガチャポイントを付与しました。",
    );
  }

  const loginSuccessNoticeModal = loginSuccessNotice ? (
    <div
      className="modalOverlay loginSuccessOverlay"
      role="presentation"
      onClick={() => setLoginSuccessNotice(null)}
    >
      <section
        className="loginSuccessModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="loginSuccessBadge" aria-hidden="true">
          ✓
        </p>
        <h2 id="login-success-title">ログインしました</h2>
        {loginSuccessNotice.displayName ? (
          <p className="loginSuccessLead">
            {loginSuccessNotice.displayName}さん、おかえりなさい
          </p>
        ) : null}
        {loginSuccessNotice.dailyBonusAwarded &&
        loginSuccessNotice.dailyBonusPoints > 0 ? (
          <p className="loginSuccessBonus">
            本日初回ログインボーナス
            <strong>
              +{loginSuccessNotice.dailyBonusPoints.toLocaleString("ja-JP")} pt
            </strong>
          </p>
        ) : null}
        <div className="loginSuccessPointsCard" aria-label="ガチャポイント残高">
          <span>現在のガチャポイント</span>
          <strong>{loginSuccessNotice.gachaPoints.toLocaleString("ja-JP")} pt</strong>
        </div>
        <button
          className="loginSuccessButton"
          type="button"
          onClick={() => setLoginSuccessNotice(null)}
        >
          OK
        </button>
      </section>
    </div>
  ) : null;

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
        {loginSuccessNoticeModal}
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "mypage") {
    const registeredStudyType =
      studyTypeId === null ? null : getStudyType(studyTypeId);

    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen"
          aria-label="マイページ"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                setProfileMessage("");
                setStudyTypeMessage("");
                setMyPageTab("edit");
                setActiveScreen("menu");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>マイページ</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="timerContent myPageScroll">
            <div className="myPageTabs" role="tablist" aria-label="マイページメニュー">
              <button
                className={
                  myPageTab === "edit"
                    ? "myPageTab myPageTabActive"
                    : "myPageTab"
                }
                type="button"
                role="tab"
                aria-selected={myPageTab === "edit"}
                onClick={() => {
                  setStudyTypeMessage("");
                  setMyPageTab("edit");
                }}
              >
                編集
              </button>
              <button
                className={
                  myPageTab === "type"
                    ? "myPageTab myPageTabActive"
                    : "myPageTab"
                }
                type="button"
                role="tab"
                aria-selected={myPageTab === "type"}
                onClick={() => {
                  setProfileMessage("");
                  setStudyTypeMessage("");
                  setPendingStudyTypeId(studyTypeId);
                  setMyPageTab("type");
                }}
              >
                タイプ
              </button>
            </div>

            {myPageTab === "edit" ? (
              <form className="myPageCard" onSubmit={handleProfileSubmit}>
                <h2 className="myPageSectionTitle">プロフィールを編集</h2>

                <label className="profileField">
                  ニックネーム{" "}
                  <span className="myPageHint">（1〜12文字）</span>
                  <input
                    maxLength={12}
                    autoComplete="nickname"
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="ニックネームを入力"
                    required
                    type="text"
                    value={nickname}
                  />
                </label>

                <fieldset className="avatarFieldset">
                  <legend>アイコン</legend>
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
                  <p
                    className={
                      profileMessage === "変更を保存しました。"
                        ? "formMessage formMessageSuccess"
                        : "formMessage"
                    }
                    role="status"
                  >
                    {profileMessage}
                  </p>
                ) : null}

                <button
                  className="profileSubmitButton"
                  disabled={isProfileSubmitting}
                  type="submit"
                >
                  {isProfileSubmitting ? "保存中..." : "保存する"}
                </button>
              </form>
            ) : (
              <form className="myPageCard myPageTypeCard" onSubmit={handleStudyTypeSubmit}>
                <div className="myPageTypeHeader">
                  <h2 className="myPageSectionTitle">得意な勉強タイプ</h2>
                  <span
                    className={
                      studyTypeId === null
                        ? "myPageTypeStatus myPageTypeStatusUnset"
                        : "myPageTypeStatus myPageTypeStatusSet"
                    }
                  >
                    {studyTypeId === null ? "未登録" : "登録済み"}
                  </span>
                </div>

                {registeredStudyType ? (
                  <div className="myPageTypeImageWrap">
                    <Image
                      src={registeredStudyType.image}
                      alt={`勉強${registeredStudyType.label}`}
                      className="myPageTypeImage"
                      priority
                    />
                  </div>
                ) : (
                  <div className="myPageTypeEmpty" aria-label="勉強タイプ未登録">
                    <p>タイプが未登録です</p>
                    <span>下からタイプを選んで保存してください</span>
                  </div>
                )}

                <fieldset className="studyTypeFieldset">
                  <legend>タイプを選択</legend>
                  <div className="studyTypeGrid">
                    {studyTypes.map((type) => (
                      <label className="studyTypeOption" key={type.id}>
                        <input
                          checked={pendingStudyTypeId === type.id}
                          name="studyType"
                          onChange={() => setPendingStudyTypeId(type.id)}
                          type="radio"
                          value={type.id}
                        />
                        <span className="studyTypeImageWrap">
                          <Image src={type.image} alt={type.label} />
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {studyTypeMessage ? (
                  <p
                    className={
                      studyTypeMessage === "タイプを保存しました。"
                        ? "formMessage formMessageSuccess"
                        : "formMessage"
                    }
                    role="status"
                  >
                    {studyTypeMessage}
                  </p>
                ) : null}

                <button
                  className="profileSubmitButton"
                  disabled={pendingStudyTypeId === null || isStudyTypeSubmitting}
                  type="submit"
                >
                  {isStudyTypeSubmitting ? "保存中..." : "保存する"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "quest") {
    const questShelfRows: StudySubject[][] = [];
    for (let i = 0; i < studySubjects.length; i += 2) {
      questShelfRows.push(studySubjects.slice(i, i + 2));
    }

    if (
      questView === "question" &&
      (selectedQuestSubject || isTeacherQuest || isReviewQuest)
    ) {
      const questionNumber = questQuestionIndex + 1;
      const sessionQuest = questSessionQuestions[questQuestionIndex] ?? null;
      const currentQuest = sessionQuest;
      const questChoiceKeyPrefix = isReviewQuest
        ? "review"
        : isTeacherQuest
          ? "teacher"
          : selectedQuestSubject?.id ?? "quest";

      if (!currentQuest) {
        return (
          <main className="appShell">
            <section
              className="phoneFrame timerScreen questScreen"
              aria-label="クエスト問題"
              style={{ backgroundImage: `url(${backgroundImage.src})` }}
            >
              <header className="timerHeader">
                <button
                  className="timerBackButton"
                  type="button"
                  onClick={() => {
                    if (isTeacherQuest || isReviewQuest) {
                      returnToQuestSelect();
                      return;
                    }

                    setQuestView("setup");
                  }}
                >
                  <span aria-hidden="true">‹</span>
                  戻る
                </button>
                <h1>クエスト</h1>
                <span className="timerHeaderBalance" aria-hidden="true" />
              </header>
              <div className="questQuestionMain">
                <p className="formMessage" role="alert">
                  問題を読み込めませんでした。
                </p>
              </div>
            </section>
          </main>
        );
      }

      const displayQuestionNumber = sessionQuest?.displayNumber ?? questionNumber;
      const nationalExamSource = sessionQuest
        ? formatNationalExamSource(
            sessionQuest.nationalExamRound,
            sessionQuest.nationalExamQuestionNo,
          )
        : null;
      const isCorrect = isQuestAnswerCorrect(currentQuest, selectedQuestChoice);
      const isLastQuestion = questionNumber >= selectedQuestQuestionCount;

      if (isTeacherQuest && teacherQuestMeta) {
        function handleTeacherQuestBack() {
          setSelectedQuestChoice(null);
          setQuestAnswerSubmitted(false);
          setTeacherQuestPhase("encounter");
          setIsTeacherQuest(false);
          setTeacherQuestId(null);
          setTeacherQuestMeta(null);
          setQuestSessionQuestions([]);
          returnToQuestSelect();
        }

        function handleTeacherQuestSelectChoice(index: number) {
          if (questAnswerSubmitted || teacherQuestPhase !== "choice") {
            return;
          }

          setSelectedQuestChoice(index);
          setQuestAnswerSubmitted(true);
          const answeredCorrectly = index === currentQuest.correctIndex;
          if (answeredCorrectly) {
            setQuestCorrectCount((current) => current + 1);
          }
          if (sessionQuest) {
            setQuestAnswerLog((current) => [
              ...current,
              {
                questionId: sessionQuest.questionId,
                questionNumber,
                selectedIndex: index,
                isCorrect: answeredCorrectly,
              },
            ]);
          }
          setTeacherQuestPhase("feedback");
        }

        function handleTeacherQuestFeedbackContinue() {
          if (isLastQuestion) {
            void completeQuestAndShowResult();
            return;
          }

          goToNextQuestQuestion();
        }

        return (
          <main className="appShell">
            <TeacherQuestBattleScreen
              answerSubmitted={questAnswerSubmitted}
              completeMessage={questCompleteMessage}
              isCompleting={isQuestCompleting}
              isLastQuestion={isLastQuestion}
              phase={teacherQuestPhase}
              question={currentQuest}
              questionCount={selectedQuestQuestionCount}
              questionIndex={questQuestionIndex}
              selectedChoice={selectedQuestChoice}
              teacherName={teacherQuestMeta.teacherName}
              teacherSprite={getTeacherQuestSprite(teacherQuestMeta.teacherName)}
              onBack={handleTeacherQuestBack}
              onEncounterComplete={() => setTeacherQuestPhase("intro")}
              onFeedbackContinue={handleTeacherQuestFeedbackContinue}
              onIntroContinue={() => setTeacherQuestPhase("choice")}
              onSelectChoice={handleTeacherQuestSelectChoice}
            />
          </main>
        );
      }

      return (
        <main className="appShell">
          <section
            className="phoneFrame timerScreen questScreen"
            aria-label="クエスト問題"
            style={{ backgroundImage: `url(${backgroundImage.src})` }}
          >
            <header className="timerHeader">
              <button
                className="timerBackButton"
                type="button"
                onClick={() => {
                  setSelectedQuestChoice(null);
                  setQuestAnswerSubmitted(false);
                  if (isTeacherQuest || isReviewQuest) {
                    returnToQuestSelect();
                    return;
                  }

                  setQuestView("setup");
                }}
              >
                <span aria-hidden="true">‹</span>
                戻る
              </button>
              <h1>{isTeacherQuest && teacherQuestMeta ? teacherQuestMeta.title : "クエスト"}</h1>
              <span className="timerHeaderBalance" aria-hidden="true" />
            </header>

            <div className="questQuestionMain">
              <p className="questQuestionProgress" aria-live="polite">
                {isTeacherQuest && teacherQuestMeta ? (
                  <>
                    {teacherQuestMeta.teacherName}
                    <br />
                  </>
                ) : null}
                問{questionNumber}/{selectedQuestQuestionCount}
              </p>

              <article className="questQuestionCard" aria-labelledby="quest-question-label">
                <p className="questQuestionNumber" id="quest-question-label">
                  問{displayQuestionNumber}
                </p>
                {nationalExamSource ? (
                  <p className="questQuestionNationalExamSource">{nationalExamSource}</p>
                ) : null}
                <p className="questQuestionBody">{currentQuest.body}</p>
              </article>

              <div
                className="questChoiceList"
                role="listbox"
                aria-label={`問${displayQuestionNumber}の選択肢`}
              >
                {currentQuest.choices.map((choice, index) => (
                  <button
                    className={getQuestChoiceClassName(index, currentQuest.correctIndex)}
                    key={`${questChoiceKeyPrefix}-${questQuestionIndex}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selectedQuestChoice === index}
                    disabled={questAnswerSubmitted}
                    onClick={() => {
                      if (questAnswerSubmitted) {
                        return;
                      }

                      setSelectedQuestChoice(index);
                      setQuestAnswerSubmitted(true);
                      const answeredCorrectly = index === currentQuest.correctIndex;
                      if (answeredCorrectly) {
                        setQuestCorrectCount((current) => current + 1);
                      }
                      if (sessionQuest) {
                        setQuestAnswerLog((current) => [
                          ...current,
                          {
                            questionId: sessionQuest.questionId,
                            questionNumber,
                            selectedIndex: index,
                            isCorrect: answeredCorrectly,
                          },
                        ]);
                      }
                    }}
                  >
                    <span className="questChoiceBadge" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="questChoiceLabel">{choice}</span>
                  </button>
                ))}
              </div>

              {questAnswerSubmitted && selectedQuestChoice !== null ? (
                <>
                  <section
                    className={
                      isCorrect
                        ? "questResultPanel questResultPanelCorrect"
                        : "questResultPanel questResultPanelWrong"
                    }
                    aria-live="polite"
                    aria-label={isCorrect ? "正解" : "不正解"}
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
                    <p className="questResultExplanation">{currentQuest.explanation}</p>
                  </section>

                  <button
                    className="profileSubmitButton questNextButton"
                    disabled={isQuestCompleting}
                    type="button"
                    onClick={goToNextQuestQuestion}
                  >
                    {isQuestCompleting
                      ? "結果を保存中..."
                      : isLastQuestion
                        ? "結果を見る"
                        : "次の問題へ"}
                  </button>
                  {questCompleteMessage ? (
                    <p className="formMessage" role="alert">
                      {questCompleteMessage}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </section>
        </main>
      );
    }

    if (questView === "result") {
      const questWrongCount = selectedQuestQuestionCount - questCorrectCount;
      const questAccuracy =
        selectedQuestQuestionCount > 0
          ? Math.round((questCorrectCount / selectedQuestQuestionCount) * 100)
          : 0;
      const questPointsEarned = isTeacherQuest
        ? questCorrectCount * GACHA_POINTS_PER_TEACHER_QUEST_CORRECT
        : questCorrectCount;

      return (
        <main className="appShell">
          <section
            className="phoneFrame timerScreen questScreen"
            aria-label="クエスト結果"
            style={{ backgroundImage: `url(${backgroundImage.src})` }}
          >
            <header className="timerHeader">
              <button
                className="timerBackButton"
                type="button"
                onClick={resetQuestScreen}
              >
                <span aria-hidden="true">‹</span>
                戻る
              </button>
              <h1>クエスト</h1>
              <span className="timerHeaderBalance" aria-hidden="true" />
            </header>

            <div className="questResultMain">
              <section className="questResultArea" aria-label="結果">
                <div className="questScorePointsRow">
                  <article className="questScoreCard">
                    <p className="questScoreCardLabel">今回のスコア</p>
                    <p className="questScoreCardValue">
                      {questCorrectCount} / {selectedQuestQuestionCount}
                    </p>
                    <p className="questScoreCardRate">正解率 {questAccuracy}%</p>
                  </article>

                  <article className="questGachaEarnCard">
                    <p className="questGachaEarnLabel">カードガチャ</p>
                    <p className="questGachaEarnValue">+{questPointsEarned} pt</p>
                  </article>
                </div>

                <div className="questStatsRow">
                  <article className="questStatCorrect">
                    <p className="questStatLabel">正解</p>
                    <p className="questStatValue">{questCorrectCount}</p>
                  </article>
                  <article className="questStatWrong">
                    <p className="questStatLabel">不正解</p>
                    <p className="questStatValue">{questWrongCount}</p>
                  </article>
                </div>

                {!isTeacherQuest ? (
                  <p className="questResultHint">
                    間違えた問題は復習リストから再度確認できます。
                  </p>
                ) : null}

                <button
                  className="profileSubmitButton"
                  type="button"
                  onClick={resetQuestScreen}
                >
                  {isTeacherQuest ? "クエスト一覧に戻る" : "科目一覧に戻る"}
                </button>
              </section>
            </div>
          </section>
        </main>
      );
    }

    if (questView === "setup" && selectedQuestSubject) {
      const subcategories = questSetupSubcategories;
      const availableQuestionCount = sumQuestSubcategoryQuestionCounts(
        subcategories,
        selectedQuestSubcategoryIds,
      );
      const selectableQuestionCounts =
        getSelectableQuestQuestionCounts(availableQuestionCount);

      const questionCountHint = getQuestQuestionCountHint(
        availableQuestionCount,
        selectedQuestSubcategoryIds.length,
      );
      const canStartQuest =
        selectedQuestSubcategoryIds.length > 0 &&
        availableQuestionCount > 0 &&
        selectableQuestionCounts.length > 0;

      function toggleQuestSubcategory(subcategoryId: string) {
        const subcategory = subcategories.find((item) => item.id === subcategoryId);
        if (!subcategory || subcategory.questionCount === 0) {
          return;
        }

        const nextSubcategoryIds = selectedQuestSubcategoryIds.includes(subcategoryId)
          ? selectedQuestSubcategoryIds.filter((id) => id !== subcategoryId)
          : [...selectedQuestSubcategoryIds, subcategoryId];
        const nextAvailableCount = sumQuestSubcategoryQuestionCounts(
          subcategories,
          nextSubcategoryIds,
        );

        setSelectedQuestSubcategoryIds(nextSubcategoryIds);
        setSelectedQuestQuestionCount((current) =>
          normalizeSelectedQuestQuestionCount(nextAvailableCount, current),
        );
      }

      return (
        <main className="appShell">
          <section
            className="phoneFrame timerScreen questScreen"
            aria-label="クエスト設定"
            style={{ backgroundImage: `url(${backgroundImage.src})` }}
          >
            <header className="timerHeader">
              <button
                className="timerBackButton"
                type="button"
                onClick={() => {
                  setSelectedQuestSubject(null);
                  setSelectedQuestSubcategoryIds([]);
                  setQuestView("select");
                }}
              >
                <span aria-hidden="true">‹</span>
                戻る
              </button>
              <h1>クエスト</h1>
              <span className="timerHeaderBalance" aria-hidden="true" />
            </header>

            <div className="questSetupMain">
              <section className="questSetupCard">
                <h2 className="questSetupTitle">{selectedQuestSubject.title}</h2>
                <p className="questSetupLead">
                  中分類（複数選択可）と問題数を選んでください。
                </p>

                {isQuestSetupLoading ? (
                  <p className="questSetupNote">中分類を読み込んでいます...</p>
                ) : null}
                {!isQuestSetupLoading &&
                subcategories.length > 0 &&
                subcategories.every((subcategory) => subcategory.questionCount === 0) ? (
                  <p className="questSetupNote questSetupUnavailableNote">
                    この科目にはまだ問題が登録されていません。
                  </p>
                ) : null}
                {questSetupMessage ? (
                  <p className="formMessage" role="alert">
                    {questSetupMessage}
                  </p>
                ) : null}

                <fieldset className="questSetupFieldset">
                  <legend>中分類</legend>
                  {subcategories.length > 5 ? (
                    <p className="questScrollHint questSetupScrollHint">
                      <span aria-hidden="true">⇅</span>
                      上下にスクロールして中分類を選べます（複数可）
                    </p>
                  ) : null}
                  <div className="questSubcategoryList">
                    {subcategories.map((subcategory) => {
                      const isSelected = selectedQuestSubcategoryIds.includes(
                        subcategory.id,
                      );
                      const isSubcategoryUnavailable = subcategory.questionCount === 0;

                      return (
                      <label
                        className={
                          isSubcategoryUnavailable
                            ? "questSubcategoryOption questSubcategoryOptionUnavailable"
                            : "questSubcategoryOption"
                        }
                        key={subcategory.id}
                      >
                        <input
                          checked={isSelected}
                          disabled={isQuestSetupLoading || isSubcategoryUnavailable}
                          name={`questSubcategory-${subcategory.id}`}
                          onChange={() => toggleQuestSubcategory(subcategory.id)}
                          type="checkbox"
                          value={subcategory.id}
                        />
                        <span>{subcategory.label}</span>
                        {isSubcategoryUnavailable ? (
                          <span className="questSubcategoryUnavailable">
                            問題未登録
                          </span>
                        ) : shouldShowQuestSubcategoryCountBadge(
                          subcategory.questionCount,
                        ) ? (
                          <span className="questSubcategoryCount">
                            全{subcategory.questionCount}問
                          </span>
                        ) : null}
                      </label>
                      );
                    })}
                  </div>
                </fieldset>

                {questionCountHint ? (
                  <p className="questSetupNote">{questionCountHint}</p>
                ) : null}

                {selectableQuestionCounts.length > 1 ? (
                <fieldset className="questSetupFieldset">
                  <legend>問題数</legend>
                  <div className="questCountTabs" role="group" aria-label="問題数">
                    {selectableQuestionCounts.map((count) => (
                      <button
                        className={
                          selectedQuestQuestionCount === count
                            ? "questCountTab questCountTabActive"
                            : "questCountTab"
                        }
                        key={count}
                        type="button"
                        onClick={() => setSelectedQuestQuestionCount(count)}
                      >
                        {formatQuestQuestionCountLabel(count)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                ) : null}

                <button
                  className="profileSubmitButton"
                  disabled={!canStartQuest || isQuestSetupLoading || isQuestStarting}
                  type="button"
                  onClick={() => {
                    void startQuestQuestions();
                  }}
                >
                  {isQuestStarting ? "問題を読み込み中..." : "問題を開始"}
                </button>
              </section>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="appShell">
        <section
          className="phoneFrame timerScreen questScreen"
          aria-label="クエスト"
          style={{ backgroundImage: `url(${backgroundImage.src})` }}
        >
          <header className="timerHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => {
                resetQuestScreen();
                setActiveScreen("menu");
              }}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>クエスト</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="questMain">
            <div className="questGachaBanner" role="status">
              <span className="questGachaBannerLabel">現在の獲得ガチャポイント</span>
              <strong className="questGachaBannerValue">
                {gachaPoints.toLocaleString("ja-JP")} pt
              </strong>
            </div>

            <p className="questScrollHint">
              <span aria-hidden="true">⇅</span>
              上下にスクロールして科目を選べます
            </p>

            <div
              ref={bindBottomNavScrollRef}
              aria-busy={
                isQuestSubjectCountsLoading ||
                isQuestReviewCountLoading ||
                isTeacherQuestLoading
              }
              className={
                isQuestSubjectCountsLoading ||
                isQuestReviewCountLoading ||
                isTeacherQuestLoading
                  ? "questShelf questShelfLoading"
                  : "questShelf"
              }
              aria-label="クエスト一覧"
            >
              {isQuestSubjectCountsLoading ||
              isQuestReviewCountLoading ||
              isTeacherQuestLoading ? (
                <p className="questSetupNote questShelfLoadingNote">
                  クエスト情報を読み込んでいます...
                </p>
              ) : null}

              <div className="questBookRow">
                {(() => {
                  const isTeacherQuestUnavailable =
                    !isTeacherQuestLoading &&
                    (!teacherQuestAvailable || teacherQuestQuestionCount === 0);

                  return (
                    <button
                      className={
                        isTeacherQuestUnavailable
                          ? "subjectCard questBookCard questBookCardUnavailable questSpecialCard"
                          : "subjectCard questBookCard questSpecialCard"
                      }
                      disabled={
                        isTeacherQuestUnavailable ||
                        isTeacherQuestStarting ||
                        isTeacherQuestLoading ||
                        isTeacherQuestTransitioning
                      }
                      type="button"
                      aria-label={
                        isTeacherQuestUnavailable
                          ? "教員クエスト（現在利用できるクエストはありません）"
                          : teacherQuestMeta
                            ? `教員クエスト（${teacherQuestMeta.title}・${teacherQuestQuestionCount}問）`
                            : `教員クエスト（${teacherQuestQuestionCount}問）`
                      }
                      onClick={() => {
                        void openTeacherQuest();
                      }}
                    >
                      <div className="questBookCoverWrap questTeacherCoverWrap">
                        <Image
                          src={characterImage}
                          alt=""
                          className={
                            isTeacherQuestUnavailable
                              ? "questTeacherCover questBookCoverUnavailable"
                              : "questTeacherCover"
                          }
                          priority
                        />
                        {!isTeacherQuestUnavailable ? (
                          <span className="questUnavailableBadge">
                            {teacherQuestQuestionCount}問
                          </span>
                        ) : null}
                      </div>
                      <div className="questBookCardMeta">
                        <span>教員クエスト</span>
                        {isTeacherQuestUnavailable ? (
                          <span className="questUnavailableHint">利用不可</span>
                        ) : teacherQuestMeta ? (
                          <span className="questUnavailableHint">{teacherQuestMeta.title}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })()}

                {(() => {
                  const isReviewUnavailable =
                    !isQuestReviewCountLoading && questReviewQuestionCount === 0;

                  return (
                    <button
                      className={
                        isReviewUnavailable
                          ? "subjectCard questBookCard questBookCardUnavailable questSpecialCard"
                          : "subjectCard questBookCard questSpecialCard"
                      }
                      disabled={isReviewUnavailable}
                      type="button"
                      aria-label={
                        isReviewUnavailable
                          ? "復習クエスト（復習する問題なし）"
                          : `復習クエスト（${questReviewQuestionCount}問）`
                      }
                      onClick={() => {
                        void openReviewQuest();
                      }}
                    >
                      <div className="questBookCoverWrap questReviewCoverWrap">
                        <Image
                          src={reviewQuestImage}
                          alt=""
                          className={
                            isReviewUnavailable
                              ? "questReviewCover questBookCoverUnavailable"
                              : "questReviewCover"
                          }
                        />
                        {!isReviewUnavailable ? (
                          <span className="questUnavailableBadge">
                            {questReviewQuestionCount}問
                          </span>
                        ) : null}
                      </div>
                      <div className="questBookCardMeta">
                        <span>復習クエスト</span>
                        {isReviewUnavailable ? (
                          <span className="questUnavailableHint">問題なし</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })()}
              </div>

              {questShelfRows.map((row) => (
                <div
                  className="questBookRow"
                  key={row.map((subject) => subject.id).join("-")}
                >
                  {row.map((subject) => {
                    const subjectQuestionCount =
                      questSubjectQuestionCounts[subject.id] ?? 0;
                    const isSubjectUnavailable =
                      !isQuestSubjectCountsLoading && subjectQuestionCount === 0;

                    return (
                    <button
                      className={
                        isSubjectUnavailable
                          ? "subjectCard questBookCard questBookCardUnavailable"
                          : "subjectCard questBookCard"
                      }
                      disabled={isSubjectUnavailable}
                      key={subject.id}
                      type="button"
                      aria-label={
                        isSubjectUnavailable
                          ? `${subject.title}（問題未登録）`
                          : subject.title
                      }
                      onClick={() => {
                        if (isSubjectUnavailable) {
                          return;
                        }

                        void openQuestSetup(subject);
                      }}
                    >
                      <div className="questBookCoverWrap">
                        <Image
                          src={subject.image}
                          alt=""
                          className={
                            isSubjectUnavailable
                              ? "subjectCover questBookCoverUnavailable"
                              : "subjectCover"
                          }
                        />
                        {isSubjectUnavailable ? (
                          <span className="questUnavailableBadge">準備中</span>
                        ) : null}
                      </div>
                      <div className="questBookCardMeta">
                        <span>{subject.title}</span>
                        {isSubjectUnavailable ? (
                          <span className="questUnavailableHint">問題未登録</span>
                        ) : null}
                      </div>
                    </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <TimerBottomNav
            activeTab="quest"
            className="questTabBar"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />
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

          <div ref={bindBottomNavScrollRef} className="timerContent">
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

          <TimerBottomNav
            activeTab="timer"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />
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
                setActiveScreen(stopwatchReturnScreen);
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
                <p
                  className={
                    stopwatchMessage.includes("を獲得しました") ||
                    stopwatchMessage.includes("を付与しました")
                      ? "stopwatchMessage stopwatchMessageSuccess"
                      : "stopwatchMessage"
                  }
                >
                  {stopwatchMessage}
                </p>
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
    const subjectBreakdown = studyRecord?.subjectBreakdown ?? [];
    const studyPieGradient = buildStudyPieGradient(subjectBreakdown);

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

          <div ref={bindBottomNavScrollRef} className="recordContent">
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
              <div className="studyBreakdown studyBreakdownPie">
                {subjectBreakdown.length ? (
                  <>
                    <div
                      className="studyPieChart"
                      style={{ background: studyPieGradient }}
                      role="img"
                      aria-label={`科目別の時間配分: ${buildStudyPieChartLabel(subjectBreakdown)}`}
                    />
                    <ul className="studyPieLegend" aria-label="科目別の内訳">
                      {subjectBreakdown.map((subject) => (
                        <li className="studyPieLegendItem" key={subject.subjectName}>
                          <span className="studyPieLegendLabel">
                            <i
                              className="studyBreakdownDot"
                              style={{ backgroundColor: subject.color }}
                              aria-hidden="true"
                            />
                            {subject.subjectName}
                          </span>
                          <strong className="studyPieLegendMinutes">
                            {formatStudyMinutes(subject.minutes)}
                          </strong>
                          <small className="studyPieLegendPercent">{subject.percentage}%</small>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="recordEmptyText">
                    選択期間の学習時間を登録すると配分が表示されます。
                  </p>
                )}
              </div>
            </section>

            <section className="recordCard calendarCard" aria-label="勉強した日">
              <h3>勉強した日</h3>
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

          <TimerBottomNav
            activeTab="record"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "ranking") {
    const selectedRankingOption =
      rankingPeriodOptions.find((option) => option.id === selectedRankingPeriod) ??
      rankingPeriodOptions[0];
    const currentRankingItem = studyRanking?.currentUser ?? null;
    const rankingItems = studyRanking?.ranking ?? [];
    const rankingRewardInfo = studyRanking?.rewardInfo ?? null;
    const latestRankingGrant = rankingRewardInfo?.recentGrants[0] ?? null;

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

          <div ref={bindBottomNavScrollRef} className="rankingContent">
            <section className="rankingIntroCard">
              <h2>{selectedRankingOption.title}</h2>
              <p>
                {studyRanking?.range?.label
                  ? `集計期間: ${studyRanking.range.label}`
                  : "他のユーザーの学習量をチェックしよう"}
              </p>
              {rankingRewardInfo ? (
                <div className="rankingRewardBanner" aria-label="ランキング報酬">
                  <span className="rankingRewardBadge">{rankingRewardInfo.badgeLabel}</span>
                  <p className="rankingRewardHeadline">{rankingRewardInfo.headline}</p>
                  {rankingRewardInfo.description ? (
                    <p className="rankingRewardDescription">{rankingRewardInfo.description}</p>
                  ) : null}
                  <p className="rankingRewardEncouragement">
                    {rankingRewardInfo.encouragement}
                  </p>
                  {latestRankingGrant ? (
                    <p className="rankingRewardRecent">
                      最近の付与: {latestRankingGrant.pointsAwarded}pt（
                      {latestRankingGrant.periodType === "week" ? "週間" : "月間"}・
                      {latestRankingGrant.periodKey}）
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="rankingPeriodTabs" aria-label="ランキング期間">
                {rankingPeriodOptions.map((option) => (
                  <button
                    className={
                      selectedRankingPeriod === option.id
                        ? "rankingPeriodTab rankingPeriodTabActive"
                        : "rankingPeriodTab"
                    }
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedRankingPeriod(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rankingCurrentCard" aria-label="あなたのランキング">
              <h2>あなたの順位</h2>
              {currentRankingItem ? (
                <article className="rankingItem rankingItemCurrent rankingItemFeatured">
                  <span className="rankingRank">
                    {currentRankingItem.rank ? `${currentRankingItem.rank}` : "-"}
                  </span>
                  <Image
                    src={getAvatarIcon(currentRankingItem.avatarIconId).image}
                    alt=""
                    className="rankingAvatar"
                    aria-hidden="true"
                  />
                  <div className="rankingMeta">
                    <h3>{currentRankingItem.displayName}</h3>
                    <p>
                      {currentRankingItem.className ?? "クラス未設定"}・
                      {currentRankingItem.note}
                    </p>
                  </div>
                  <strong>{formatStudyMinutes(currentRankingItem.totalMinutes)}</strong>
                </article>
              ) : (
                <p className="rankingEmptyText">あなたの情報を取得できませんでした。</p>
              )}
            </section>

            <section className="rankingList" aria-label="上位10名ランキング">
              <h2>上位10名</h2>
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
                    className="rankingItem"
                    key={item.gakuseiId}
                  >
                    <span className={`rankingRank rankingRank-${item.rank}`}>
                      {item.rank ?? "-"}
                    </span>
                    <Image
                      src={avatar.image}
                      alt=""
                      className="rankingAvatar"
                      aria-hidden="true"
                    />
                    <div className="rankingMeta">
                      <h3>{item.displayName}</h3>
                      <p>
                        {item.className ?? "クラス未設定"}・
                        {item.isCurrentUser ? "あなた" : item.note}
                      </p>
                    </div>
                    <strong>{formatStudyMinutes(item.totalMinutes)}</strong>
                  </article>
                );
              })}
            </section>
          </div>

          <TimerBottomNav
            activeTab="ranking"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "gacha") {
    return (
      <main className="appShell">
        <section
          className={`phoneFrame collectionScreen${isGachaPlaying ? " collectionScreen--gachaVideo" : ""}`}
          aria-label="ガチャ画面"
        >
          {!isGachaPlaying ? (
            <header className="collectionHeader">
              <button
                className="timerBackButton"
                type="button"
                onClick={() => {
                  gachaVideoRef.current?.pause();
                  setIsGachaPlaying(false);
                  setActiveScreen("collection");
                }}
              >
                <span aria-hidden="true">‹</span>
                戻る
              </button>
              <h1>ガチャ</h1>
              <span className="timerHeaderBalance" aria-hidden="true" />
            </header>
          ) : null}

          <div ref={bindBottomNavScrollRef} className="gachaContent">
            {isGachaPlaying ? (
              <div className="gachaVideoStage" aria-live="polite">
                <video
                  key={gachaVideoKey}
                  ref={gachaVideoRef}
                  className="gachaMovieCinematic"
                  playsInline
                  muted
                  controls={false}
                  preload="auto"
                  disablePictureInPicture
                  aria-label="ガチャ演出動画"
                  onEnded={finishGachaDraw}
                  onError={finishGachaDraw}
                >
                  <source src="/gacha_mov.mp4" type="video/mp4" />
                </video>
              </div>
            ) : (
              <section className="gachaPanel">
                <h2>勉強カードが当たる!</h2>
                <p>ランダムでカードが1枚手に入るよ</p>

                <div className="collectionTabs" aria-label="カードメニュー">
                  <button
                    className="collectionTab"
                    type="button"
                    onClick={() => setActiveScreen("collection")}
                  >
                    <span aria-hidden="true">▣</span>
                    コレクション
                  </button>
                  <button className="collectionTab collectionTabActive" type="button" aria-current="page">
                    <span aria-hidden="true">✦</span>
                    ガチャ
                  </button>
                  <button
                    className="collectionTab"
                    type="button"
                    onClick={() => setActiveScreen("medal")}
                  >
                    <span aria-hidden="true">♕</span>
                    メダル
                  </button>
                </div>

                <div className="gachaMachine" aria-live="polite">
                  {gachaResultCard ? (
                    <div className="gachaResult">
                      <span>GET!</span>
                      <Image
                        src={gachaResultCard.image}
                        alt={gachaResultCard.title}
                        className="gachaResultCard"
                        priority
                      />
                      <strong>{gachaResultCard.title}</strong>
                    </div>
                  ) : (
                    <div className="gachaMachineIdle">
                      <Image
                        src="/gacha.jpg"
                        alt=""
                        className="gachaMachineIdleImage"
                        width={780}
                        height={780}
                        priority
                      />
                    </div>
                  )}
                </div>

                <div className="gachaPointRow">
                  <span>ガチャポイント</span>
                  <strong>{gachaPoints.toLocaleString("ja-JP")} pt</strong>
                </div>

                <button
                  className="gachaButton"
                  type="button"
                  disabled={
                    isGachaChargeLoading ||
                    gachaPoints < GACHA_SPIN_COST_PT ||
                    isGachaPlaying
                  }
                  onClick={() => void startGachaDraw()}
                >
                  {isGachaChargeLoading
                    ? "処理中..."
                    : gachaResultCard
                      ? `もう一度回す（${GACHA_SPIN_COST_PT} pt）`
                      : `${GACHA_SPIN_COST_PT}ptでガチャを回す`}
                </button>
                {gachaPoints < GACHA_SPIN_COST_PT && !isGachaPlaying ? (
                  <p className="gachaPointShortage" role="status">
                    ガチャを回すには {GACHA_SPIN_COST_PT} pt 必要です。
                  </p>
                ) : null}
                {gachaChargeMessage ? (
                  <p className="formMessage" role="alert">
                    {gachaChargeMessage}
                  </p>
                ) : null}
              </section>
            )}
          </div>

          {!isGachaPlaying ? (
            <TimerBottomNav
              activeTab="collection"
              visible={bottomNavVisible}
              onSelectTimer={navigateToTimer}
              onSelectQuest={navigateToQuest}
              onSelectRecord={navigateToRecord}
              onSelectCollection={navigateToCollection}
              onSelectRanking={navigateToRanking}
            />
          ) : null}
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "medal") {
    const medalUnlockedCount = achievementMedals.filter((entry) => entry.unlocked).length;
    const medalRemainingCount = achievementMedals.length - medalUnlockedCount;
    const medalRows = Math.ceil(achievementMedals.length / 3);

    return (
      <main className="appShell">
        <section className="phoneFrame collectionScreen" aria-label="メダル一覧">
          <header className="collectionHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => setActiveScreen("collection")}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>メダル</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="collectionContent">
            <section className="collectionPanel medalPanel">
              <div className="collectionTabs" aria-label="カードメニュー">
                <button className="collectionTab" type="button" onClick={() => setActiveScreen("collection")}>
                  <span aria-hidden="true">▣</span>
                  コレクション
                </button>
                <button
                  className="collectionTab"
                  type="button"
                  onClick={() => {
                    setGachaResultCard(null);
                    setIsGachaPlaying(false);
                    setActiveScreen("gacha");
                  }}
                >
                  <span aria-hidden="true">✦</span>
                  ガチャ
                </button>
                <button
                  className="collectionTab collectionTabActive"
                  type="button"
                  aria-current="page"
                  onClick={() => setActiveScreen("medal")}
                >
                  <span aria-hidden="true">♕</span>
                  メダル
                </button>
              </div>

              <div className="medalStatsBar">
                <div className="medalStatsBarLeft">
                  <p className="medalStatsBarTitle">GETしたメダル</p>
                  <p className="medalStatsBarSub">コンプリートして特典をもらおう</p>
                </div>
                <div className="medalStatsBarRight" aria-live="polite">
                  <p className="medalStatsBarCount">現在 {medalUnlockedCount}種</p>
                  <p className="medalStatsBarRemain">残り {medalRemainingCount}種</p>
                </div>
              </div>

              <div ref={bindBottomNavScrollRef} className="medalBadgeScroll">
                <div className="medalBadgeGrid" role="list" aria-label="達成メダル一覧">
                  {Array.from({ length: medalRows }, (_, rowIndex) => (
                    <div className="medalGridRow" key={rowIndex}>
                      {achievementMedals.slice(rowIndex * 3, rowIndex * 3 + 3).map((medal) => (
                        <div
                          className={`medalCell${medal.unlocked ? "" : " medalCell--locked"}`}
                          key={medal.id}
                          role="listitem"
                        >
                          <div className="medalRingWrap" aria-hidden="true">
                            <div className="medalRingInner">
                              <div className="medalThumbClip">
                                <Image
                                  src={medal.image}
                                  alt=""
                                  className="medalBadgeThumb"
                                  fill
                                  sizes="(max-width: 430px) 31vw, 116px"
                                />
                              </div>
                            </div>
                          </div>
                          <p
                            className={
                              medal.unlocked ? "medalBadgeLabel" : "medalBadgeLabel medalBadgeLabelLocked"
                            }
                          >
                            {medal.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <TimerBottomNav
            activeTab="collection"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />
        </section>
      </main>
    );
  }

  if (isLoggedInPreview && activeScreen === "collection") {
    const cardSlots = Array.from({ length: 99 }, (_, index) => {
      return collectionCards[index]
        ? { ...collectionCards[index], slotNumber: index + 1, isOwned: true }
        : { title: "", image: null, slotNumber: index + 1, isOwned: false };
    });

    return (
      <main className="appShell">
        <section className="phoneFrame collectionScreen" aria-label="コレクション画面">
          <header className="collectionHeader">
            <button
              className="timerBackButton"
              type="button"
              onClick={() => setActiveScreen("menu")}
            >
              <span aria-hidden="true">‹</span>
              戻る
            </button>
            <h1>コレクション</h1>
            <span className="timerHeaderBalance" aria-hidden="true" />
          </header>

          <div className="collectionContent">
            <section className="collectionPanel">
              <h2>勉強カードを集めよう!</h2>

              <div className="collectionSubHeader">
                <h3>Myカード</h3>
                <span aria-hidden="true">ⓘ</span>
              </div>

              <div className="collectionTabs" aria-label="カードメニュー">
                <button className="collectionTab collectionTabActive" type="button" aria-current="page">
                  <span aria-hidden="true">▣</span>
                  コレクション
                </button>
                <button
                  className="collectionTab"
                  type="button"
                  onClick={() => {
                    setGachaResultCard(null);
                    setIsGachaPlaying(false);
                    setActiveScreen("gacha");
                  }}
                >
                  <span aria-hidden="true">✦</span>
                  ガチャ
                </button>
                <button
                  className="collectionTab"
                  type="button"
                  onClick={() => setActiveScreen("medal")}
                >
                  <span aria-hidden="true">♕</span>
                  メダル
                </button>
              </div>

              <div className="collectionSummary">
                <span className="collectionSummaryIcon" aria-hidden="true">▣</span>
                <strong>すべてのカード</strong>
                <small>{collectionCards.length}/99</small>
              </div>

              <section
                ref={bindBottomNavScrollRef}
                className="collectionGrid"
                aria-label="カード一覧"
              >
                {cardSlots.map((card) => (
                  card.image ? (
                    <button
                      className="collectionCardSlot collectionCardSlotOwned"
                      key={card.slotNumber}
                      type="button"
                      onClick={() =>
                        setSelectedCollectionCard({
                          title: card.title,
                          image: card.image,
                        })
                      }
                    >
                      <Image
                        src={card.image}
                        alt={card.title}
                        className="collectionCardImage"
                      />
                    </button>
                  ) : (
                    <div className="collectionCardSlot" key={card.slotNumber}>
                      <span>{card.slotNumber}</span>
                    </div>
                  )
                ))}
              </section>
            </section>
          </div>

          <TimerBottomNav
            activeTab="collection"
            visible={bottomNavVisible}
            onSelectTimer={navigateToTimer}
            onSelectQuest={navigateToQuest}
            onSelectRecord={navigateToRecord}
            onSelectCollection={navigateToCollection}
            onSelectRanking={navigateToRanking}
          />

          {selectedCollectionCard ? (
            <div
              className="collectionZoomOverlay"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedCollectionCard.title} のカード詳細`}
              onClick={() => setSelectedCollectionCard(null)}
            >
              <div
                className="collectionZoomCard"
                role="presentation"
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={selectedCollectionCard.image}
                  alt={selectedCollectionCard.title}
                  className="collectionZoomImage"
                  priority
                />
              </div>
            </div>
          ) : null}
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

                  if (item.title === "勉強カード") {
                    setActiveScreen("collection");
                  }

                  if (item.title === "交流") {
                    setActiveScreen("ranking");
                  }

                  if (item.title === "マイページ") {
                    setProfileMessage("");
                    setActiveScreen("mypage");
                  }

                  if (item.title === "クエスト") {
                    resetQuestScreen();
                    setActiveScreen("quest");
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
        {loginSuccessNoticeModal}
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

      {loginSuccessNoticeModal}

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
