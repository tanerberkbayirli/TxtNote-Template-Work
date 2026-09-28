/**
 * Locks the session after idle time (vault + auth), per Ayarlar → Otomatik kilitleme.
 */

import { useEffect, useRef } from "react";
import { endUserSession } from "../lib/sessionLock.js";

const MS = {
  "10m": 10 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1mo": 30 * 24 * 60 * 60 * 1000,
};

export const autoLockDelayMs = (autoLockId) => MS[autoLockId] ?? null;

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "wheel", "scroll"];

export function useAutoLock(autoLockId, { enabled = true } = {}) {
  const delay = autoLockDelayMs(autoLockId);
  const timerRef = useRef(null);
  const lockingRef = useRef(false);

  useEffect(() => {
    if (!enabled || delay == null) return undefined;

    const clearTimer = () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = () => {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (lockingRef.current) return;
        lockingRef.current = true;
        void endUserSession().finally(() => {
          lockingRef.current = false;
        });
      }, delay);
    };

    const onActivity = () => schedule();

    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, onActivity, { passive: true, capture: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") schedule();
    });

    schedule();

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, onActivity, { capture: true });
      });
    };
  }, [autoLockId, delay, enabled]);
}
