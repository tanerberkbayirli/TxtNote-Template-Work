/**
 * The small pin marker shown on pinned rows — round head, long shaft.
 */

import React from "react";
import { cn } from "../../lib/cn";

export const PinnedIndicator = ({ className }) => (
  <svg
    viewBox="0 0 12 16"
    role="img"
    aria-label="Sabitlenmiş"
    className={cn("h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400", className)}
  >
    <title>Sabitlenmiş</title>
    <circle cx="6" cy="3.5" r="2.75" fill="currentColor" />
    <line
      x1="6"
      y1="6.25"
      x2="6"
      y2="14.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);
