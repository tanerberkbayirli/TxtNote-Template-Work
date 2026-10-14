/**
 * Progress ("süreç") todos: a numeric daily target.
 *
 * Logging less than the target leaves that day unmarked. Meeting or passing
 * it checks the day automatically.
 */

export const TODO_KIND_CLASSIC = "classic";
export const TODO_KIND_PROGRESS = "progress";

/** Local-time "YYYY-MM-DD". */
export function todoDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function parseAmount(value) {
  if (value == null || value === "") return null;
  const n = Number(String(value).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function isProgressTodo(todo) {
  return todo?.kind === TODO_KIND_PROGRESS;
}

export function progressTarget(todo) {
  const n = Number(todo?.target);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function progressLogs(todo) {
  return Array.isArray(todo?.logs) ? todo.logs : [];
}

export function amountOnDay(todo, dateKey) {
  const row = progressLogs(todo).find((log) => log?.date === dateKey);
  const n = Number(row?.amount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** A day is marked only when that day's amount meets the target. */
export function isDayComplete(todo, dateKey) {
  const target = progressTarget(todo);
  if (target <= 0) return false;
  return amountOnDay(todo, dateKey) >= target;
}

export function isTodoDone(todo, today = todoDayKey()) {
  if (isProgressTodo(todo)) return isDayComplete(todo, today);
  return Boolean(todo?.done);
}

const sortedLogs = (logs) =>
  logs
    .filter((log) => log?.date)
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

export function setDayAmount(todo, amount, dateKey = todoDayKey()) {
  const parsed = parseAmount(amount);
  const nextAmount = parsed == null ? 0 : parsed;
  const rest = progressLogs(todo).filter((log) => log?.date !== dateKey);
  const logs =
    nextAmount > 0 ? sortedLogs([...rest, { date: dateKey, amount: nextAmount }]) : sortedLogs(rest);
  const next = { ...todo, kind: TODO_KIND_PROGRESS, logs };
  return { ...next, done: isDayComplete(next, todoDayKey()) };
}

export function setProgressTarget(todo, target, dateKey = todoDayKey()) {
  const parsed = parseAmount(target);
  const next = {
    ...todo,
    kind: TODO_KIND_PROGRESS,
    target: parsed && parsed > 0 ? parsed : 0,
  };
  return { ...next, done: isDayComplete(next, dateKey) };
}

export function otherDayLogs(todo, today = todoDayKey()) {
  return progressLogs(todo)
    .filter((log) => log?.date && log.date !== today)
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function formatTodoDay(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey ?? ""));
  if (!match) return dateKey;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function progressRatio(todo, dateKey = todoDayKey()) {
  const target = progressTarget(todo);
  if (target <= 0) return 0;
  return Math.min(1, amountOnDay(todo, dateKey) / target);
}
