/**
 * Seven-day strip used by the diary and the daily to-do: selected day in the
 * middle, arrows to walk, calendar on the right, a "Bugün" jump when needed.
 */

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { addDays, dayKey } from "../../lib/diaryCalendar";
import { DiaryCalendar } from "./DiaryCalendar";

const WEEKDAY_SHORT = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
const DATE_LONG = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const dayButtonClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

export const DayStrip = ({ selectedDate, todayKey, hasEntry, onSelect, className, children }) => {
  const selectedKey = dayKey(selectedDate);
  const strip = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index - 3)),
    [selectedDate],
  );

  return (
    <div
      className={cn(
        "flex shrink-0 items-stretch justify-center gap-1.5 border-t border-neutral-200 px-4 py-2.5 dark:border-neutral-800",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(addDays(selectedDate, -1))}
        aria-label="Önceki gün"
        className={cn(
          dayButtonClass,
          "flex h-9 w-9 items-center justify-center self-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        )}
      >
        <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {strip.map((date) => {
        const key = dayKey(date);
        const isSelected = key === selectedKey;
        const isToday = key === todayKey;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(date)}
            aria-label={DATE_LONG.format(date)}
            aria-current={isSelected ? "date" : undefined}
            className={cn(
              dayButtonClass,
              "flex w-12 flex-col items-center rounded-lg py-1.5 transition-colors duration-150",
              isSelected
                ? "bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-200/70 dark:text-neutral-300 dark:hover:bg-neutral-800",
            )}
          >
            <span
              className={cn(
                "text-[10px] font-medium uppercase leading-none",
                isSelected
                  ? "text-neutral-400 dark:text-neutral-500"
                  : "text-neutral-400 dark:text-neutral-500",
              )}
            >
              {WEEKDAY_SHORT.format(date)}
            </span>
            <span
              className={cn(
                "mt-0.5 text-[15px] leading-none tabular-nums",
                isToday && !isSelected && "font-semibold underline underline-offset-4",
              )}
            >
              {date.getDate()}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 h-1 w-1 rounded-full",
                hasEntry(key)
                  ? isSelected
                    ? "bg-neutral-50 dark:bg-neutral-900"
                    : "bg-neutral-500 dark:bg-neutral-400"
                  : "bg-transparent",
              )}
            />
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelect(addDays(selectedDate, 1))}
        aria-label="Sonraki gün"
        className={cn(
          dayButtonClass,
          "flex h-9 w-9 items-center justify-center self-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        )}
      >
        <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      <DiaryCalendar
        selectedDate={selectedDate}
        todayKey={todayKey}
        hasEntry={hasEntry}
        onSelect={onSelect}
      />

      {selectedKey !== todayKey && (
        <button
          type="button"
          onClick={() => onSelect(new Date())}
          className={cn(
            dayButtonClass,
            "ml-1 self-center rounded-full border border-neutral-300 px-3 py-1.5 text-[12px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          )}
        >
          Bugün
        </button>
      )}

      {children}
    </div>
  );
};
