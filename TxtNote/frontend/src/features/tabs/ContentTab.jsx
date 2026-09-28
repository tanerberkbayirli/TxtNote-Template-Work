/**
 * One tab in the top bar.
 */

import { X } from "lucide-react";
import { FileTypeIcon } from "../../components/ui/FileTypeIcon";
import { cn } from "../../lib/cn";

export const ContentTab = ({
  tab,
  isActive,
  dropPlace,
  isDragging,
  onSelect,
  onClose,
  onPointerDownTab,
}) => {
  return (
    <div
      data-tab-id={tab.id}
      data-active={isActive ? "true" : "false"}
      title={tab.title}
      onPointerDown={(event) => onPointerDownTab?.(event, tab)}
      className={cn(
        "group/tab relative flex h-9 w-[180px] shrink-0 cursor-grab select-none items-center rounded-t-md touch-none transition-colors duration-150 active:cursor-grabbing",
        isDragging && "opacity-50",
        isActive
          ? "bg-white dark:bg-neutral-950"
          : "hover:bg-neutral-200/60 dark:hover:bg-neutral-800",
      )}
    >
      {dropPlace === "before" && (
        <span
          aria-hidden="true"
          className="absolute -left-0.5 top-1 z-10 h-7 w-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
        />
      )}
      {dropPlace === "after" && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 top-1 z-10 h-7 w-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100"
        />
      )}

      {isActive && (
        <span
          aria-hidden="true"
          className="absolute inset-x-1.5 top-0 h-[2px] rounded-full bg-neutral-900 dark:bg-neutral-100"
        />
      )}

      <button
        type="button"
        title={tab.title}
        aria-current={isActive ? "page" : undefined}
        onClick={() => onSelect(tab.id)}
        onAuxClick={(event) => {
          if (event.button === 1) {
            event.preventDefault();
            onClose(tab.id);
          }
        }}
        className={cn(
          "flex h-9 min-w-0 flex-1 cursor-grab items-center gap-2 overflow-hidden rounded-t-md pl-2.5 pr-1 text-[13px]",
          "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500",
          isActive
            ? "font-medium text-neutral-900 dark:text-neutral-50"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100",
        )}
      >
        <FileTypeIcon item={tab} className="h-4 w-4 opacity-80" />
        <span className="truncate">{tab.title}</span>
      </button>

      <button
        type="button"
        data-tab-close="true"
        aria-label={`${tab.title} sekmesini kapat`}
        title="Sekmeyi kapat"
        onClick={() => onClose(tab.id)}
        className={cn(
          "mr-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-neutral-500 transition-colors",
          "hover:bg-neutral-300/70 hover:text-neutral-900 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
          "dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
          isActive ? "opacity-100" : "opacity-0 group-hover/tab:opacity-100",
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
};
