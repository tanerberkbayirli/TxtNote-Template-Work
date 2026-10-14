/**
 * On/off switch for the bin.
 */

import React from "react";
import { cn } from "../../lib/cn";

/** The bin's on/off switch. Off is destructive, so the label says so out loud. */
export const TrashToggle = ({ isEnabled, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isEnabled}
    aria-label="Çöp kutusu"
    onClick={() => onToggle(!isEnabled)}
    className={cn(
      "flex items-center gap-2.5 rounded-full transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
      "focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-neutral-500 dark:focus-visible:ring-offset-neutral-900",
    )}
  >
    <span
      aria-hidden="true"
      className={cn(
        "relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        isEnabled
          ? "bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-white"
          : "bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 dark:bg-neutral-900",
          isEnabled ? "left-[22px]" : "left-0.5",
        )}
      />
    </span>

    <span
      className={cn(
        "text-[13px] font-medium transition-colors duration-150",
        isEnabled
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-500 dark:text-neutral-400",
      )}
    >
      {isEnabled ? "Açık" : "Kapalı"}
    </span>
  </button>
);
