/**
 * CSS-only tooltip.
 */

import React from "react";
import { cn } from "../../lib/cn";

export const TOOLTIP_PLACEMENT = {
  right: "left-full top-1/2 ml-3 -translate-y-1/2",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
};

export const Tooltip = ({ label, placement = "right", children }) => {
  return (
    <div className="group/tip relative">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover/tip:opacity-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
          TOOLTIP_PLACEMENT[placement],
        )}
      >
        {label}
      </span>
    </div>
  );
};

/* -- workspace badge -------------------------------------------------------- */
