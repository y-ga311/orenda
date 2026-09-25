import type { ClassAppFeatures } from "@/lib/classAppFeatures";
import { isFeatureEnabled } from "@/lib/classAppFeatures";

type BottomNavTab = "timer" | "quest" | "record" | "collection" | "ranking";

type TimerBottomNavProps = {
  activeTab: BottomNavTab;
  className?: string;
  visible: boolean;
  enabledFeatures?: ClassAppFeatures;
  onSelectTimer: () => void;
  onSelectQuest: () => void;
  onSelectRecord: () => void;
  onSelectCollection: () => void;
  onSelectRanking: () => void;
};

function getNavItemClassName(isActive: boolean) {
  return isActive ? "timerNavItem timerNavItemActive" : "timerNavItem";
}

export function TimerBottomNav({
  activeTab,
  className,
  visible,
  enabledFeatures,
  onSelectTimer,
  onSelectQuest,
  onSelectRecord,
  onSelectCollection,
  onSelectRanking,
}: TimerBottomNavProps) {
  const show = (key: BottomNavTab) =>
    !enabledFeatures || isFeatureEnabled(enabledFeatures, key);

  const navClassName = [
    "timerBottomNav",
    className,
    visible ? "" : "timerBottomNav--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClassName} aria-label="下部ナビゲーション" aria-hidden={!visible}>
      {show("timer") ? (
        <button
          className={getNavItemClassName(activeTab === "timer")}
          type="button"
          onClick={onSelectTimer}
          tabIndex={visible ? 0 : -1}
        >
          <span aria-hidden="true">⏱</span>
          タイマー
        </button>
      ) : null}
      {show("quest") ? (
        <button
          className={getNavItemClassName(activeTab === "quest")}
          type="button"
          onClick={onSelectQuest}
          tabIndex={visible ? 0 : -1}
        >
          <span aria-hidden="true">📋</span>
          問題
        </button>
      ) : null}
      {show("record") ? (
        <button
          className={getNavItemClassName(activeTab === "record")}
          type="button"
          onClick={onSelectRecord}
          tabIndex={visible ? 0 : -1}
        >
          <span aria-hidden="true">⌛</span>
          タイム
        </button>
      ) : null}
      {show("collection") ? (
        <button
          className={getNavItemClassName(activeTab === "collection")}
          type="button"
          onClick={onSelectCollection}
          tabIndex={visible ? 0 : -1}
        >
          <span aria-hidden="true">▣</span>
          カード
        </button>
      ) : null}
      {show("ranking") ? (
        <button
          className={getNavItemClassName(activeTab === "ranking")}
          type="button"
          onClick={onSelectRanking}
          tabIndex={visible ? 0 : -1}
        >
          <span aria-hidden="true">👥</span>
          交流
        </button>
      ) : null}
    </nav>
  );
}

export type { BottomNavTab };
