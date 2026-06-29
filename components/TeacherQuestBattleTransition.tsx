"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

const SPIRAL_MS = 720;
const BLACKOUT_HOLD_MS = 220;
const TOTAL_DOTS = 420;
const SPIRAL_TURNS = 9;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getDotLayout(width: number, height: number, rotation = 0) {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.hypot(width, height) * 0.58;
  const dotRadius = Math.max(5, Math.min(width, height) / 34);

  const dots = Array.from({ length: TOTAL_DOTS }, (_, index) => {
    const t = index / (TOTAL_DOTS - 1);
    const angle = t * SPIRAL_TURNS * Math.PI * 2 + rotation;
    const radius = t * maxRadius;

    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: dotRadius * (0.92 + (index % 3) * 0.04),
    };
  });

  return dots;
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

function drawSpiralFrame(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  phase: "closing" | "opening",
) {
  context.clearRect(0, 0, width, height);

  const eased = easeInOutCubic(Math.min(Math.max(progress, 0), 1));
  const rotation = eased * Math.PI * 1.25;
  const dots = getDotLayout(width, height, rotation);
  const threshold = eased * TOTAL_DOTS;

  context.fillStyle = "#000";

  for (let index = 0; index < dots.length; index += 1) {
    const dot = dots[index];
    const isVisible =
      phase === "closing" ? index <= threshold : index >= threshold;

    if (!isVisible) {
      continue;
    }

    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    context.fill();
  }

  if (phase === "closing" && eased >= 0.92) {
    context.fillRect(0, 0, width, height);
  }

  if (phase === "opening" && eased <= 0.04) {
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
  const [isMounted, setIsMounted] = useState(false);

  callbacksRef.current = {
    onClosingComplete,
    onBlackoutComplete,
    onOpeningComplete,
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
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
      const progress = Math.min(elapsed / SPIRAL_MS, 1);
      drawSpiralFrame(
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

      drawSolidBlack(context, window.innerWidth, window.innerHeight);

      if (phase === "closing") {
        callbacksRef.current.onClosingComplete();
      } else {
        callbacksRef.current.onOpeningComplete();
      }
    };

    if (phase === "opening") {
      drawSolidBlack(context, window.innerWidth, window.innerHeight);
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

  if (phase === "idle" || !isMounted) {
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

    setPhase("opening");
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
