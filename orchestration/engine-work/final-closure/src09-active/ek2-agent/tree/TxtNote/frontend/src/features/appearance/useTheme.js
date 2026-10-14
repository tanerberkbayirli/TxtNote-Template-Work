/**
 * Owns the active theme and the clock-based switcher.
 *
 * The theme lands on <html> as classes (`dark`, `theme-black`), which is what
 * the stylesheet keys off. Both the choice and the schedule survive a reload
 * through localStorage.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SCHEDULE, scheduledThemeFor, THEME, THEME_LABEL } from "./theme";

const THEME_KEY = "txtnote.theme";
const SCHEDULE_KEY = "txtnote.themeSchedule";

/** How often the clock is compared against the rules. */
const SCHEDULE_TICK_MS = 30 * 1000;

const readStored = (key, fallback, isValid) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full disk — the session still works, it just forgets.
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState(() =>
    readStored(THEME_KEY, THEME.LIGHT, (value) => Boolean(THEME_LABEL[value])),
  );
  const [schedule, setSchedule] = useState(() =>
    readStored(
      SCHEDULE_KEY,
      DEFAULT_SCHEDULE,
      (value) => value && typeof value.isEnabled === "boolean" && Array.isArray(value.rules),
    ),
  );

  // The theme the schedule last applied. A manual pick is left alone until the
  // clock next crosses a rule — the switcher nudges, it does not nag.
  const lastScheduledRef = useRef(null);

  /* -- apply ---------------------------------------------------------------- */

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme !== THEME.LIGHT);
    root.classList.toggle("theme-black", theme === THEME.BLACK);
    writeStored(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    writeStored(SCHEDULE_KEY, schedule);
  }, [schedule]);

  /* -- the clock ------------------------------------------------------------ */

  useEffect(() => {
    if (!schedule.isEnabled) {
      lastScheduledRef.current = null;
      return undefined;
    }

    const tick = () => {
      const target = scheduledThemeFor(schedule.rules);
      if (!target || target === lastScheduledRef.current) return;
      lastScheduledRef.current = target;
      setTheme(target);
    };

    // Runs straight away: enabling the switch (or editing a rule) takes effect
    // now, not at the next half-minute.
    tick();
    const id = window.setInterval(tick, SCHEDULE_TICK_MS);
    return () => window.clearInterval(id);
  }, [schedule]);

  /* -- edits ----------------------------------------------------------------- */

  const toggleSchedule = useCallback((isEnabled) => {
    setSchedule((current) => ({ ...current, isEnabled }));
  }, []);

  const updateScheduleRule = useCallback((ruleId, patch) => {
    // Re-arms the switcher, so an edited rule is re-evaluated immediately.
    lastScheduledRef.current = null;
    setSchedule((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
    }));
  }, []);

  return { theme, setTheme, schedule, toggleSchedule, updateScheduleRule };
};
