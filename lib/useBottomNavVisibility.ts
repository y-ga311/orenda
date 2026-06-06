import { useCallback, useLayoutEffect, useRef, useState } from "react";

const SCROLL_DOWN_HIDE_THRESHOLD = 6;
const WHEEL_UP_THRESHOLD = -1;
const WHEEL_DOWN_THRESHOLD = 1;
const TOUCH_MOVE_THRESHOLD = 2;

export function useBottomNavVisibility(resetKey: string) {
  const [visible, setVisible] = useState(false);
  const [attachVersion, setAttachVersion] = useState(0);
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const lastScrollTopRef = useRef(0);
  const lastTouchYRef = useRef<number | null>(null);

  const bindScrollRef = useCallback((node: HTMLElement | null) => {
    if (scrollTargetRef.current === node) {
      return;
    }

    scrollTargetRef.current = node;
    setAttachVersion((current) => current + 1);
  }, []);

  useLayoutEffect(() => {
    setVisible(false);
    lastScrollTopRef.current = 0;
    lastTouchYRef.current = null;

    const element = scrollTargetRef.current;
    if (!element) {
      return;
    }

    lastScrollTopRef.current = element.scrollTop;

    const showNav = () => setVisible(true);
    const hideNav = () => setVisible(false);

    const updateForNonScrollable = () => {
      if (element.scrollHeight <= element.clientHeight + 1) {
        showNav();
      }
    };

    const onScroll = () => {
      const current = element.scrollTop;
      const delta = current - lastScrollTopRef.current;

      if (delta < 0) {
        showNav();
      } else if (delta > SCROLL_DOWN_HIDE_THRESHOLD) {
        hideNav();
      }

      lastScrollTopRef.current = current;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= WHEEL_UP_THRESHOLD) {
        showNav();
      } else if (event.deltaY >= WHEEL_DOWN_THRESHOLD) {
        hideNav();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      lastTouchYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY;
      const lastTouchY = lastTouchYRef.current;

      if (touchY == null || lastTouchY == null) {
        return;
      }

      const fingerDelta = touchY - lastTouchY;

      if (fingerDelta > TOUCH_MOVE_THRESHOLD) {
        showNav();
      } else if (fingerDelta < -TOUCH_MOVE_THRESHOLD) {
        hideNav();
      }

      lastTouchYRef.current = touchY;
    };

    updateForNonScrollable();
    element.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("wheel", onWheel, { passive: true, capture: true });
    element.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    element.addEventListener("touchmove", onTouchMove, { passive: true, capture: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            updateForNonScrollable();
          })
        : null;
    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("wheel", onWheel, true);
      element.removeEventListener("touchstart", onTouchStart, true);
      element.removeEventListener("touchmove", onTouchMove, true);
      resizeObserver?.disconnect();
    };
  }, [resetKey, attachVersion]);

  return { visible, bindScrollRef };
}
