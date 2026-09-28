/**
 * Calendar math for the diary date picker. Weeks start on Monday (tr-TR).
 */

/** Local-time "YYYY-MM-DD" — the key a day's text is stored under. */
export const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export const addDays = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);

export const YEARS_PER_PAGE = 12;
export const DAYS_IN_GRID = 42;

const MONTH_LONG = new Intl.DateTimeFormat("tr-TR", { month: "long" });
const WEEKDAY_SHORT = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

/** A Monday used only to label the seven weekday columns. */
const WEEKDAY_ANCHOR = new Date(2026, 8, 14);

export const monthName = (month, year = 2020) => MONTH_LONG.format(new Date(year, month, 1));

export const MONTHS_TR = Array.from({ length: 12 }, (_, month) => monthName(month));

export const WEEKDAYS_TR = Array.from({ length: 7 }, (_, index) =>
  WEEKDAY_SHORT.format(addDays(WEEKDAY_ANCHOR, index)),
);

/** First year of the 12-year block that contains `year`. */
export const yearBlockStart = (year, size = YEARS_PER_PAGE) => Math.floor(year / size) * size;

/**
 * Six Monday-first weeks covering `year`/`month` (0-indexed), including
 * leading and trailing days from the neighbouring months.
 */
export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: DAYS_IN_GRID }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      key: dayKey(date),
      inMonth: date.getMonth() === month,
    };
  });
};
