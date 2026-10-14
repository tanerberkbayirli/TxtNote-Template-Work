/**
 * Workspace avatar or initial badge.
 */

import React from "react";
import { cn } from "../../lib/cn";

export const BADGE_SIZE = {
  sm: "h-6 w-6 rounded-md text-[12px]",
  md: "h-9 w-9 rounded-md text-[13px]",
  lg: "h-14 w-14 rounded-lg text-[20px]",
};

export const BADGE_TONE = {
  solid: "bg-neutral-800 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900",
  muted: "bg-neutral-200 text-neutral-700 dark:bg-neutral-600 dark:text-neutral-100",
};

/**
 * The square that stands for a workspace. A picture replaces the letter when one
 * is set; `letter` can be overridden so a dialog can preview a name as it is typed.
 */
export const WorkspaceBadge = ({
  workspace,
  size = "sm",
  tone = "solid",
  letter,
  className,
}) => {
  const shape = cn("flex shrink-0 items-center justify-center", BADGE_SIZE[size], className);

  if (workspace?.avatar) {
    return (
      <img
        src={workspace.avatar}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={cn(shape, "object-cover")}
      />
    );
  }

  return (
    <span aria-hidden="true" className={cn(shape, "font-semibold", BADGE_TONE[tone])}>
      {letter ?? workspace?.badge ?? "?"}
    </span>
  );
};
