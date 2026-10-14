/**
 * One entry in the bin, with its countdown.
 */

import React from "react";
import { ChevronRight, Clock, Heart, Lock, RotateCcw, Trash2 } from "lucide-react";
import { FileTypeIcon } from "../../components/ui/FileTypeIcon";
import { cn } from "../../lib/cn";
import { formatRelativePast, formatRetentionLeft } from "../../lib/time";
import { isFolderItem } from "../../lib/folder";

/** One deleted item: what it was, where it came from, how long it has left. */
export const TrashRow = ({
  entry,
  now,
  childCount = 0,
  isExpanded = false,
  onToggleFolder,
  onRestore,
  onRequestDelete,
}) => {
  const retention = formatRetentionLeft(entry.deletedAt, now);
  const folder = isFolderItem(entry);

  const rowActionClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 transition-colors duration-150 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <button
        type="button"
        aria-label={folder ? `${entry.title} klasörünü ${isExpanded ? "kapat" : "aç"}` : undefined}
        aria-expanded={folder ? isExpanded : undefined}
        disabled={!folder}
        onClick={() => folder && onToggleFolder?.(entry.id)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      >
        {folder ? (
          <span className="flex items-center gap-0.5">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-90")} strokeWidth={2} />
            <FileTypeIcon item={entry} open={isExpanded} className="h-[16px] w-[16px]" />
          </span>
        ) : (
          <FileTypeIcon item={entry} className="h-[18px] w-[18px]" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {folder ? (
            <button
              type="button"
              title={entry.title}
              aria-expanded={isExpanded}
              onClick={() => onToggleFolder?.(entry.id)}
              className="truncate text-left text-[13px] font-medium text-neutral-800 hover:underline dark:text-neutral-100"
            >
              {entry.title}
            </button>
          ) : (
            <p title={entry.title} className="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">
              {entry.title}
            </p>
          )}
          {folder && childCount > 0 && (
            <span className="shrink-0 text-[11px] text-neutral-400 dark:text-neutral-500">
              {childCount} içerik
            </span>
          )}
          {entry.isPrivate && (
            <Lock
              className="h-3 w-3 shrink-0 text-neutral-400 dark:text-neutral-500"
              strokeWidth={2}
              aria-label="Gizli"
            />
          )}
          {entry.isFavorite && (
            <Heart
              className="h-3 w-3 shrink-0 fill-rose-500/20 text-rose-500 dark:fill-rose-400/20 dark:text-rose-400"
              strokeWidth={2}
              aria-label="Favori"
            />
          )}
        </div>

        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          {entry.workspaceName && (
            <>
              <span className="truncate">{entry.workspaceName}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatRelativePast(entry.deletedAt, now)} silindi</span>
          <span aria-hidden="true">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              retention.isUrgent && "font-medium text-amber-600 dark:text-amber-400",
            )}
          >
            <Clock className="h-3 w-3" strokeWidth={2} />
            {retention.label}
          </span>
        </p>
      </div>

      {/* Both actions stay visible: on touch there is no hover to reveal them. */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          title="Geri yükle"
          aria-label={`${entry.title} içeriğini geri yükle`}
          onClick={() => onRestore(entry.id)}
          className={cn(
            rowActionClass,
            "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          )}
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          title="Kalıcı olarak sil"
          aria-label={`${entry.title} içeriğini kalıcı olarak sil`}
          onClick={() => onRequestDelete(entry)}
          className={cn(
            rowActionClass,
            "text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-400",
          )}
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
};
