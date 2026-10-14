/**
 * Daily to-do notes: a task list that can change with the selected day,
 * or stay the same across days while only the marks / progress move.
 */

import { isProgressTodo, progressLogs } from "./todoProgress.js";

export function isTodoPlan(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isDailyTodoNote(note) {
  return Boolean(note?.todoDaily) || isTodoPlan(note?.todoPlan);
}

const asMark = (mark) => ({
  done: Boolean(mark?.done),
  failed: Boolean(mark?.failed),
});

const normalizeDays = (days) => {
  if (!days || typeof days !== "object" || Array.isArray(days)) return {};
  const out = {};
  for (const [key, list] of Object.entries(days)) {
    if (typeof key === "string" && Array.isArray(list)) out[key] = list;
  }
  return out;
};

const normalizeMarks = (marks) => {
  if (!marks || typeof marks !== "object" || Array.isArray(marks)) return {};
  const out = {};
  for (const [day, row] of Object.entries(marks)) {
    if (typeof day !== "string" || !row || typeof row !== "object" || Array.isArray(row)) continue;
    const next = {};
    for (const [id, mark] of Object.entries(row)) {
      if (!id || !mark || typeof mark !== "object") continue;
      if (mark.done || mark.failed) next[id] = asMark(mark);
    }
    if (Object.keys(next).length) out[day] = next;
  }
  return out;
};

export function normalizeTodoPlan(plan) {
  const src = isTodoPlan(plan) ? plan : {};
  return {
    persistent: Boolean(src.persistent),
    days: normalizeDays(src.days),
    marks: normalizeMarks(src.marks),
  };
}

/** Fields that travel with the note body (sync, vault, fingerprint). */
export function pickTodoDailyFields(note) {
  if (!isDailyTodoNote(note)) return {};
  return {
    todoDaily: true,
    todoPlan: normalizeTodoPlan(note.todoPlan),
  };
}

export function cloneTodo(todo) {
  if (!todo || typeof todo !== "object") return todo;
  return {
    ...todo,
    logs: Array.isArray(todo.logs) ? todo.logs.map((log) => ({ ...log })) : todo.logs,
  };
}

const stripClassicStatus = (todo) => ({ ...todo, done: false, failed: false });

export function applyDayMarks(todos, marks) {
  const row = marks && typeof marks === "object" ? marks : {};
  return (Array.isArray(todos) ? todos : []).map((todo) => {
    if (isProgressTodo(todo)) return todo;
    const mark = row[todo.id];
    if (!mark) return { ...todo, done: false, failed: false };
    return { ...todo, done: Boolean(mark.done), failed: Boolean(mark.failed) };
  });
}

export function extractDayMarks(todos) {
  const row = {};
  for (const todo of todos ?? []) {
    if (!todo?.id || isProgressTodo(todo)) continue;
    if (todo.done || todo.failed) row[todo.id] = asMark(todo);
  }
  return row;
}

const pruneMarks = (marks, ids) => {
  const idSet = new Set(ids);
  const next = {};
  for (const [day, row] of Object.entries(marks ?? {})) {
    const kept = {};
    for (const [id, mark] of Object.entries(row ?? {})) {
      if (idSet.has(id) && (mark?.done || mark?.failed)) kept[id] = asMark(mark);
    }
    if (Object.keys(kept).length) next[day] = kept;
  }
  return next;
};

const mergeLogs = (left, right) => {
  const byDate = new Map();
  for (const log of [...progressLogs(left), ...progressLogs(right)]) {
    if (log?.date) byDate.set(log.date, { ...log });
  }
  return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
};

export function todosForDay(plan, sharedTodos, dateKey) {
  const normalized = normalizeTodoPlan(plan);
  if (normalized.persistent) {
    return applyDayMarks(sharedTodos, normalized.marks[dateKey]);
  }
  return Array.isArray(normalized.days[dateKey]) ? normalized.days[dateKey] : [];
}

export function writeTodosForDay(plan, sharedTodos, dateKey, nextTodos) {
  const normalized = normalizeTodoPlan(plan);
  const list = Array.isArray(nextTodos) ? nextTodos : [];

  if (normalized.persistent) {
    const shared = list.map((todo) => stripClassicStatus(cloneTodo(todo)));
    const marks = { ...normalized.marks };
    const extracted = extractDayMarks(list);
    if (Object.keys(extracted).length) marks[dateKey] = extracted;
    else delete marks[dateKey];
    return {
      todos: shared,
      todoPlan: {
        persistent: true,
        days: {},
        marks: pruneMarks(marks, shared.map((todo) => todo.id)),
      },
    };
  }

  const days = { ...normalized.days };
  if (list.length) days[dateKey] = list;
  else delete days[dateKey];
  return {
    todos: list,
    todoPlan: {
      persistent: false,
      days,
      marks: {},
    },
  };
}

const enablePersistent = (plan, sharedTodos, dateKey) => {
  const byId = new Map();
  const order = [];
  const marks = {};

  const rememberMark = (todo, day) => {
    if (!day || !todo?.id || isProgressTodo(todo)) return;
    if (!todo.done && !todo.failed) return;
    marks[day] = { ...marks[day], [todo.id]: asMark(todo) };
  };

  const ingest = (list, day) => {
    for (const todo of list ?? []) {
      if (!todo?.id) continue;
      if (!byId.has(todo.id)) {
        byId.set(todo.id, cloneTodo(todo));
        order.push(todo.id);
      } else if (isProgressTodo(todo)) {
        const existing = byId.get(todo.id);
        existing.logs = mergeLogs(existing, todo);
      }
      rememberMark(todo, day);
    }
  };

  ingest(plan.days[dateKey], dateKey);
  for (const [day, list] of Object.entries(plan.days)) {
    if (day === dateKey) continue;
    ingest(list, day);
  }
  ingest(sharedTodos, null);

  for (const [day, row] of Object.entries(plan.marks)) {
    marks[day] = { ...row, ...marks[day] };
  }

  const shared = order.map((id) => stripClassicStatus(byId.get(id)));
  return {
    todos: shared,
    todoPlan: { persistent: true, days: {}, marks: pruneMarks(marks, shared.map((todo) => todo.id)) },
  };
};

const disablePersistent = (plan, sharedTodos, dateKey) => {
  const shared = (Array.isArray(sharedTodos) ? sharedTodos : []).map(cloneTodo);
  const days = { ...plan.days };
  const dates = new Set([dateKey, ...Object.keys(plan.marks), ...Object.keys(plan.days)]);
  for (const todo of shared) {
    for (const log of progressLogs(todo)) {
      if (log?.date) dates.add(log.date);
    }
  }
  for (const day of dates) {
    if (!Array.isArray(days[day])) {
      const list = applyDayMarks(shared, plan.marks[day]).map(cloneTodo);
      if (list.length) days[day] = list;
    }
  }
  for (const day of Object.keys(days)) {
    if (!days[day]?.length) delete days[day];
  }
  return {
    todos: days[dateKey] ?? [],
    todoPlan: { persistent: false, days, marks: {} },
  };
};

export function setTodoPersistent(plan, sharedTodos, dateKey, persistent) {
  const normalized = normalizeTodoPlan(plan);
  if (normalized.persistent === Boolean(persistent)) {
    return { todos: Array.isArray(sharedTodos) ? sharedTodos : [], todoPlan: normalized };
  }
  return persistent
    ? enablePersistent(normalized, sharedTodos, dateKey)
    : disablePersistent(normalized, sharedTodos, dateKey);
}

/** A day carries a dot when it already has tasks or a recorded mark. */
export function dayHasTodos(plan, sharedTodos, dateKey) {
  const normalized = normalizeTodoPlan(plan);
  if (normalized.persistent) {
    const marks = normalized.marks[dateKey];
    if (marks && Object.values(marks).some((mark) => mark.done || mark.failed)) return true;
    return (Array.isArray(sharedTodos) ? sharedTodos : []).some((todo) =>
      progressLogs(todo).some((log) => log?.date === dateKey),
    );
  }
  return (normalized.days[dateKey] ?? []).length > 0;
}
