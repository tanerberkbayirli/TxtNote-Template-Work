/**
 * Diary date picker: month grid, with the month name and year as switches
 * into a month list or a year list.
 */

import { useCallback, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useDismiss } from "../../hooks/useDismiss";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { cn } from "../../lib/cn";
import {
  MONTHS_TR,
  WEEKDAYS_TR,
  YEARS_PER_PAGE,
  dayKey,
  monthGrid,
  monthName,
  yearBlockStart,
} from "../../lib/diaryCalendar";

const PANEL_WIDTH = 312;
const PANEL_GAP = 8;
const EDGE = 8;

const dayButtonClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

const headerButtonClass =
  "rounded-md px-2 py-1 text-[15px] font-semibold capitalize transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-700 dark:focus-visible:ring-neutral-500";

const cellButtonClass =
  "rounded-lg py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500";

export const DiaryCalendar = ({ selectedDate, todayKey, hasEntry, onSelect }) => {
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("days");
  const [cursor, setCursor] = useState(() => ({
    year: selectedDate.getFullYear(),
    month: selectedDate.getMonth(),
  }));
  const [yearStart, setYearStart] = useState(() => yearBlockStart(selectedDate.getFullYear()));
  const [coords, setCoords] = useState({ bottom: EDGE, right: EDGE, top: null });

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, wrapRef, close);

  const syncFromSelected = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    setCursor({ year, month });
    setYearStart(yearBlockStart(year));
    setView("days");
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    syncFromSelected();
    setOpen(true);
  };

  useIsomorphicLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const right = Math.max(EDGE, window.innerWidth - rect.right);
    const leftShift = Math.max(0, PANEL_WIDTH + right - (window.innerWidth - EDGE));
    const panel = wrapRef.current?.lastElementChild;
    const panelHeight = panel instanceof HTMLElement ? panel.offsetHeight : 320;
    const placeBelow = rect.top < panelHeight + PANEL_GAP + EDGE;
    setCoords(
      placeBelow
        ? { top: rect.bottom + PANEL_GAP, right: right + leftShift, bottom: null }
        : {
            bottom: Math.max(EDGE, window.innerHeight - rect.top + PANEL_GAP),
            right: right + leftShift,
            top: null,
          },
    );
  }, [open, view]);

  const selectedKey = dayKey(selectedDate);
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearStart + index);
  const days = view === "days" ? monthGrid(cursor.year, cursor.month) : [];

  const pickDay = (date) => {
    onSelect(date);
    setOpen(false);
  };

  const pickMonth = (month) => {
    setCursor((current) => ({ ...current, month }));
    setView("days");
  };

  const pickYear = (year) => {
    setCursor((current) => ({ ...current, year }));
    setYearStart(yearBlockStart(year));
    setView("days");
  };

  return (
    <div ref={wrapRef} className="relative flex self-stretch">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label="Takvim"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          dayButtonClass,
          "flex h-full w-12 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-200/70 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          open && "bg-neutral-200/70 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
        )}
      >
        <CalendarDays className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Tarih seç"
          className="fixed z-[180] rounded-xl border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-800 dark:shadow-black/50"
          style={{
            width: PANEL_WIDTH,
            right: coords.right,
            ...(coords.top != null ? { top: coords.top } : { bottom: coords.bottom }),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setView((current) => (current === "months" ? "days" : "months"))}
              aria-label="Ay seç"
              aria-pressed={view === "months"}
              className={cn(
                headerButtonClass,
                "text-neutral-900 dark:text-neutral-50",
                view === "months" && "bg-neutral-100 dark:bg-neutral-700",
              )}
            >
              {monthName(cursor.month, cursor.year)}
            </button>
            <button
              type="button"
              onClick={() => setView((current) => (current === "years" ? "days" : "years"))}
              aria-label="Yıl seç"
              aria-pressed={view === "years"}
              className={cn(
                headerButtonClass,
                "tabular-nums text-neutral-900 dark:text-neutral-50",
                view === "years" && "bg-neutral-100 dark:bg-neutral-700",
              )}
            >
              {cursor.year}
            </button>
          </div>

          {view === "days" && (
            <div className="mt-3">
              <div className="grid grid-cols-7">
                {WEEKDAYS_TR.map((label) => (
                  <span
                    key={label}
                    className="pb-1 text-center text-[10px] font-medium uppercase leading-none text-neutral-400 dark:text-neutral-500"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((cell) => {
                  const isSelected = cell.key === selectedKey;
                  const isToday = cell.key === todayKey;
                  const marked = hasEntry(cell.key);

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => pickDay(cell.date)}
                      aria-label={cell.key}
                      aria-current={isSelected ? "date" : undefined}
                      className={cn(
                        dayButtonClass,
                        "flex h-9 flex-col items-center justify-center rounded-lg text-[13px] tabular-nums transition-colors",
                        isSelected
                          ? "bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                          : cell.inMonth
                            ? "text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-700"
                            : "text-neutral-300 hover:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-700",
                        isToday && !isSelected && "font-semibold underline underline-offset-4",
                      )}
                    >
                      <span className="leading-none">{cell.date.getDate()}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 h-1 w-1 rounded-full",
                          marked
                            ? isSelected
                              ? "bg-neutral-50 dark:bg-neutral-900"
                              : "bg-neutral-500 dark:bg-neutral-400"
                            : "bg-transparent",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === "months" && (
            <div className="mt-3 grid grid-cols-3 gap-1">
              {MONTHS_TR.map((label, month) => {
                const isCurrent = month === cursor.month;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => pickMonth(month)}
                    className={cn(
                      cellButtonClass,
                      isCurrent
                        ? "bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {view === "years" && (
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setYearStart((start) => start - YEARS_PER_PAGE)}
                  aria-label="Önceki yıllar"
                  className={cn(
                    dayButtonClass,
                    "flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                <span className="text-[12px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  {yearStart}–{yearStart + YEARS_PER_PAGE - 1}
                </span>
                <button
                  type="button"
                  onClick={() => setYearStart((start) => start + YEARS_PER_PAGE)}
                  aria-label="Sonraki yıllar"
                  className={cn(
                    dayButtonClass,
                    "flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-100",
                  )}
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {years.map((year) => {
                  const isCurrent = year === cursor.year;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => pickYear(year)}
                      className={cn(
                        cellButtonClass,
                        "tabular-nums",
                        isCurrent
                          ? "bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700",
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
