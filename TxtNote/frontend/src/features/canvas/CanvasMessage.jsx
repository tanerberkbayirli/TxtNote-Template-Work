/**
 * Empty/placeholder state for the canvas area.
 */

import React from "react";
import { cn } from "../../lib/cn";

/** Shared shell for the canvas states that hold no note. */
export const CanvasMessage = ({ icon: Icon, heading, children }) => (
  <div className="h-full overflow-y-auto">
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-8 py-16 text-center">
      {Icon && <Icon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />}
      <h1
        className={cn(
          "text-lg font-semibold text-neutral-900 dark:text-neutral-100",
          Icon && "mt-3",
        )}
      >
        {heading}
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{children}</p>
    </div>
  </div>
);

/* ========================================================================== */
/*  Trash                                                                      */
/* ========================================================================== */
