"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
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
import { avatarIcons, type AvatarIconId } from "@/lib/avatarIcons";

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
  { title: "解剖学", image: kaibouImage },
  { title: "生理学", image: seiriImage },
  { title: "病理学概論", image: byouriImage },
  { title: "臨床医学総論", image: souronImage },
  { title: "臨床医学各論", image: kakuronImage },
  { title: "リハビリテーション医学", image: rehaImage },
  { title: "東洋医学概論", image: tougaiImage },
  { title: "経絡経穴概論", image: keiketuImage },
  { title: "東洋医学臨床論", image: tourinImage },
  { title: "はり理論", image: hariImage },
  { title: "きゅう理論", image: kyuImage },
  { title: "医療概論", image: iryogaironImage },
  { title: "衛生学・公衆衛生学", image: eiseiImage },
  { title: "関係法規", image: kankeihoukiImage },
];

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
  const [activeScreen, setActiveScreen] = useState<"menu" | "timer">("menu");

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
    setNeedsProfileSetup(false);
    setIsLoginOpen(false);
    setLoginId("");
    setPassword("");
    setStudentName("");
    setNickname("");
    setDaysUntilExam(null);
    setSelectedAvatarIconId("pixel01");
    setMessage("");
    setProfileMessage("");
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
                <strong>2時間35分</strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>今月</span>
                <strong>42時間</strong>
              </div>
              <i aria-hidden="true" />
              <div>
                <span>総学習時間</span>
                <strong>186時間</strong>
              </div>
            </section>

            <p className="timerScrollHint">
              <span aria-hidden="true">⇅</span>
              上下にスクロールして科目を選べます
            </p>

            <section className="subjectGrid" aria-label="科目一覧">
              {studySubjects.map((subject) => (
                <button className="subjectCard" key={subject.title} type="button">
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
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">⌛</span>
              タイム
            </button>
            <button className="timerNavItem" type="button">
              <span aria-hidden="true">▣</span>
              カード
            </button>
            <button className="timerNavItem" type="button">
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
