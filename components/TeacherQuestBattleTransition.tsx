"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type TeacherQuestTransitionPhase =
  | "idle"
  | "closing"
  | "blackout"
  | "opening";

type TeacherQuestBattleTransitionProps = {
  phase: TeacherQuestTransitionPhase;
  onClosingComplete: () => void;
  onBlackoutComplete: () => void;
  onOpeningComplete: () => void;
};

const TRANSITION_MS = 680;
const BLACKOUT_HOLD_MS = 220;
const BAR_COUNT = 10;
const BAR_STAGGER = 0.42;
const FLASH_PORTION = 0.14;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function drawSolidWhite(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);
}

function setupCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  return context;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function drawSolidBlack(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
}

function drawBattleBarFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: "closing" | "opening",
) {
  context.clearRect(0, 0, width, height);

  const barHeight = height / BAR_COUNT + 1;

  if (phase === "closing" && progress < FLASH_PORTION) {
    const flashProgress = progress / FLASH_PORTION;
    const flashStrength = 1 - easeOutCubic(flashProgress);
    context.fillStyle = `rgba(255, 255, 255, ${flashStrength})`;
    context.fillRect(0, 0, width, height);
    return;
  }

  const barProgress =
    phase === "closing"
      ? clamp((progress - FLASH_PORTION) / (1 - FLASH_PORTION), 0, 1)
      : clamp(progress, 0, 1);
  const eased = easeInOutCubic(barProgress);

  context.fillStyle = "#000";

  for (let index = 0; index < BAR_COUNT; index += 1) {
    const y = index * (height / BAR_COUNT);
    const delay = (index / BAR_COUNT) * BAR_STAGGER;
    const stripProgress = clamp((eased - delay) / (1 - BAR_STAGGER), 0, 1);
    const travel = easeOutCubic(stripProgress);

    if (phase === "closing") {
      if (index % 2 === 0) {
        context.fillRect(-width + travel * width, y, width, barHeight);
      } else {
        context.fillRect(width - travel * width, y, width, barHeight);
      }
      continue;
    }

    if (index % 2 === 0) {
      context.fillRect(-travel * width, y, width, barHeight);
    } else {
      context.fillRect(travel * width, y, width, barHeight);
    }
  }

  if (phase === "closing" && eased >= 0.98) {
    context.fillRect(0, 0, width, height);
  }

  if (phase === "opening" && eased <= 0.02) {
    context.fillRect(0, 0, width, height);
  }
}

export function TeacherQuestBattleTransition({
  phase,
  onClosingComplete,
  onBlackoutComplete,
  onOpeningComplete,
}: TeacherQuestBattleTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const blackoutTimerRef = useRef<number | null>(null);
  const callbacksRef = useRef({
    onClosingComplete,
    onBlackoutComplete,
    onOpeningComplete,
  });

  callbacksRef.current = {
    onClosingComplete,
    onBlackoutComplete,
    onOpeningComplete,
  };

  useLayoutEffect(() => {
    if (phase === "idle") {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = setupCanvas(canvas);
    if (!context) {
      return;
    }

    if (phase === "closing") {
      drawSolidWhite(context, window.innerWidth, window.innerHeight);
      return;
    }

    drawSolidBlack(context, window.innerWidth, window.innerHeight);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle") {
      startRef.current = null;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (blackoutTimerRef.current !== null) {
        window.clearTimeout(blackoutTimerRef.current);
        blackoutTimerRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = setupCanvas(canvas);
    if (!context) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resizeCanvas = () => {
      const context = setupCanvas(canvas);
      if (!context) {
        return;
      }

      if (phase === "closing") {
        drawSolidWhite(context, window.innerWidth, window.innerHeight);
        return;
      }

      drawSolidBlack(context, window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", resizeCanvas);

    if (prefersReducedMotion) {
      if (phase === "closing") {
        callbacksRef.current.onClosingComplete();
      } else if (phase === "blackout") {
        callbacksRef.current.onBlackoutComplete();
      } else if (phase === "opening") {
        callbacksRef.current.onOpeningComplete();
      }
      window.removeEventListener("resize", resizeCanvas);
      return;
    }

    if (phase === "blackout") {
      drawSolidBlack(context, window.innerWidth, window.innerHeight);
      blackoutTimerRef.current = window.setTimeout(() => {
        callbacksRef.current.onBlackoutComplete();
      }, BLACKOUT_HOLD_MS);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        if (blackoutTimerRef.current !== null) {
          window.clearTimeout(blackoutTimerRef.current);
          blackoutTimerRef.current = null;
        }
      };
    }

    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }

      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / TRANSITION_MS, 1);
      drawBattleBarFrame(
        context,
        window.innerWidth,
        window.innerHeight,
        progress,
        phase,
      );

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (phase === "closing") {
        drawSolidBlack(context, window.innerWidth, window.innerHeight);
        callbacksRef.current.onClosingComplete();
      } else {
        callbacksRef.current.onOpeningComplete();
      }
    };

    if (phase === "opening") {
      drawSolidBlack(context, window.innerWidth, window.innerHeight);
    } else if (phase === "closing") {
      drawSolidWhite(context, window.innerWidth, window.innerHeight);
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [phase]);

  if (phase === "idle") {
    return null;
  }

  return createPortal(
    <div
      className="teacherQuestBattleTransition"
      aria-hidden="true"
      data-phase={phase}
    >
      <canvas ref={canvasRef} className="teacherQuestBattleTransitionCanvas" />
    </div>,
    document.body,
  );
}

export type TeacherQuestLaunchResult = { ok: true } | { ok: false };

type TeacherQuestLaunchTask = () => Promise<TeacherQuestLaunchResult>;

type TeacherQuestTransitionContextValue = {
  isTeacherQuestTransitioning: boolean;
  runTeacherQuestTransition: (task: TeacherQuestLaunchTask) => void;
};

const TeacherQuestTransitionContext =
  createContext<TeacherQuestTransitionContextValue | null>(null);

export function TeacherQuestTransitionProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<TeacherQuestTransitionPhase>("idle");
  const fetchDoneRef = useRef(false);
  const blackoutDoneRef = useRef(false);

  const tryAdvanceToOpening = useCallback(() => {
    if (!fetchDoneRef.current || !blackoutDoneRef.current) {
      return;
    }

    void waitForNextPaint().then(() => {
      if (!fetchDoneRef.current || !blackoutDoneRef.current) {
        return;
      }

      setPhase("opening");
    });
  }, []);

  const runTeacherQuestTransition = useCallback(
    (task: TeacherQuestLaunchTask) => {
      if (phase !== "idle") {
        return;
      }

      fetchDoneRef.current = false;
      blackoutDoneRef.current = false;
      setPhase("closing");

      void (async () => {
        await task();
        fetchDoneRef.current = true;
        tryAdvanceToOpening();
      })();
    },
    [phase, tryAdvanceToOpening],
  );

  const handleClosingComplete = useCallback(() => {
    setPhase("blackout");
  }, []);

  const handleBlackoutComplete = useCallback(() => {
    blackoutDoneRef.current = true;
    tryAdvanceToOpening();
  }, [tryAdvanceToOpening]);

  const handleOpeningComplete = useCallback(() => {
    setPhase("idle");
    fetchDoneRef.current = false;
    blackoutDoneRef.current = false;
  }, []);

  return (
    <TeacherQuestTransitionContext.Provider
      value={{
        isTeacherQuestTransitioning: phase !== "idle",
        runTeacherQuestTransition,
      }}
    >
      {children}
      <TeacherQuestBattleTransition
        onBlackoutComplete={handleBlackoutComplete}
        onClosingComplete={handleClosingComplete}
        onOpeningComplete={handleOpeningComplete}
        phase={phase}
      />
    </TeacherQuestTransitionContext.Provider>
  );
}

export function useTeacherQuestTransition() {
  const context = useContext(TeacherQuestTransitionContext);

  if (!context) {
    throw new Error(
      "useTeacherQuestTransition must be used within TeacherQuestTransitionProvider",
    );
  }

  return context;
}
