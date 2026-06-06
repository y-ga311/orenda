type BottomNavTab = "timer" | "quest" | "record" | "collection" | "ranking";

type TimerBottomNavProps = {
  activeTab: BottomNavTab;
  className?: string;
  visible: boolean;
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
  onSelectTimer,
  onSelectQuest,
  onSelectRecord,
  onSelectCollection,
  onSelectRanking,
}: TimerBottomNavProps) {
  const navClassName = [
    "timerBottomNav",
    className,
    visible ? "" : "timerBottomNav--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <nav className={navClassName} aria-label="下部ナビゲーション" aria-hidden={!visible}>
      <button
        className={getNavItemClassName(activeTab === "timer")}
        type="button"
        onClick={onSelectTimer}
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">⏱</span>
        タイマー
      </button>
      <button
        className={getNavItemClassName(activeTab === "quest")}
        type="button"
        onClick={onSelectQuest}
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">📋</span>
        問題
      </button>
      <button
        className={getNavItemClassName(activeTab === "record")}
        type="button"
        onClick={onSelectRecord}
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">⌛</span>
        タイム
      </button>
      <button
        className={getNavItemClassName(activeTab === "collection")}
        type="button"
        onClick={onSelectCollection}
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">▣</span>
        カード
      </button>
      <button
        className={getNavItemClassName(activeTab === "ranking")}
        type="button"
        onClick={onSelectRanking}
        tabIndex={visible ? 0 : -1}
      >
        <span aria-hidden="true">👥</span>
        交流
      </button>
    </nav>
  );
}

export type { BottomNavTab };
