/**
 * Ticking clock, so relative timestamps stay true while a view is left open.
 */

import { useEffect, useState } from "react";

/** Ticking clock, so "5 gün önce" stays true while the view is left open. */
export function useNow(intervalMs) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
