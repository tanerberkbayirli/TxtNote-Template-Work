/**
 * Closes a floating surface on outside pointer-down, ESC, scroll, resize or blur.
 */

import { useEffect } from "react";

/**
 * Closes a floating surface on outside pointer-down, ESC, scroll or resize.
 */
export function useDismiss(isOpen, ref, onDismiss) {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) onDismiss();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onDismiss();
    };
    const handleScroll = (event) => {
      if (ref.current?.contains(event.target)) return;
      onDismiss();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", onDismiss);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("blur", onDismiss);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", onDismiss);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("blur", onDismiss);
    };
  }, [isOpen, ref, onDismiss]);
}

/* ========================================================================== */
/*  Presentational primitives                                                  */
/* ========================================================================== */
