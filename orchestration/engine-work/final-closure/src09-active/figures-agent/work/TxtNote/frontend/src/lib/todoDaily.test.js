import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TODO_KIND_CLASSIC, TODO_KIND_PROGRESS } from "./todoProgress.js";
import {
  dayHasTodos,
  pickTodoDailyFields,
  setTodoPersistent,
  todosForDay,
  writeTodosForDay,
} from "./todoDaily.js";

const classic = (id, text, patch = {}) => ({
  id,
  kind: TODO_KIND_CLASSIC,
  text,
  done: false,
  failed: false,
  ...patch,
});

const progress = (id, text, logs = []) => ({
  id,
  kind: TODO_KIND_PROGRESS,
  text,
  target: 2,
  logs,
  done: false,
});

describe("day-local lists", () => {
  it("keeps a separate list per day until persistence is on", () => {
    const monday = writeTodosForDay(
      { persistent: false, days: {}, marks: {} },
      [],
      "2026-09-14",
      [classic("a", "diş fırçala")],
    );
    const tuesday = writeTodosForDay(
      monday.todoPlan,
      monday.todos,
      "2026-09-15",
      [classic("b", "market")],
    );

    assert.equal(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-14")[0].text, "diş fırçala");
    assert.equal(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-15")[0].text, "market");
    assert.deepEqual(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-16"), []);
    assert.equal(dayHasTodos(tuesday.todoPlan, tuesday.todos, "2026-09-14"), true);
    assert.equal(dayHasTodos(tuesday.todoPlan, tuesday.todos, "2026-09-16"), false);
  });
});

describe("persistent tasks", () => {
  it("reuses the same tasks and only moves the day's marks", () => {
    const seeded = writeTodosForDay(
      { persistent: false, days: {}, marks: {} },
      [],
      "2026-09-14",
      [classic("a", "diş fırçala", { done: true }), classic("b", "su iç")],
    );
    const locked = setTodoPersistent(seeded.todoPlan, seeded.todos, "2026-09-14", true);

    assert.equal(locked.todoPlan.persistent, true);
    assert.deepEqual(
      todosForDay(locked.todoPlan, locked.todos, "2026-09-14").map((todo) => [todo.text, todo.done]),
      [
        ["diş fırçala", true],
        ["su iç", false],
      ],
    );
    assert.deepEqual(
      todosForDay(locked.todoPlan, locked.todos, "2026-09-15").map((todo) => [todo.text, todo.done]),
      [
        ["diş fırçala", false],
        ["su iç", false],
      ],
    );

    const tuesday = writeTodosForDay(
      locked.todoPlan,
      locked.todos,
      "2026-09-15",
      [
        { ...locked.todos[0], done: true },
        { ...locked.todos[1], failed: true },
      ],
    );

    assert.equal(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-14")[0].done, true);
    assert.equal(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-15")[0].done, true);
    assert.equal(todosForDay(tuesday.todoPlan, tuesday.todos, "2026-09-15")[1].failed, true);
    assert.equal(tuesday.todos[0].done, false);
    assert.equal(dayHasTodos(tuesday.todoPlan, tuesday.todos, "2026-09-15"), true);
  });

  it("keeps progress amounts on their own days", () => {
    const locked = setTodoPersistent(
      {
        persistent: false,
        days: {
          "2026-09-14": [progress("p", "su", [{ date: "2026-09-14", amount: 2 }])],
        },
        marks: {},
      },
      [],
      "2026-09-14",
      true,
    );
    const next = writeTodosForDay(
      locked.todoPlan,
      locked.todos,
      "2026-09-15",
      [{ ...locked.todos[0], logs: [...locked.todos[0].logs, { date: "2026-09-15", amount: 1 }] }],
    );
    const logs = next.todos[0].logs;
    assert.equal(logs.find((log) => log.date === "2026-09-14").amount, 2);
    assert.equal(logs.find((log) => log.date === "2026-09-15").amount, 1);
  });

  it("materializes visited days when persistence is turned off", () => {
    const locked = setTodoPersistent(
      {
        persistent: false,
        days: { "2026-09-14": [classic("a", "diş fırçala", { done: true })] },
        marks: {},
      },
      [],
      "2026-09-14",
      true,
    );
    const marked = writeTodosForDay(locked.todoPlan, locked.todos, "2026-09-15", [
      { ...locked.todos[0], done: true },
    ]);
    const unlocked = setTodoPersistent(marked.todoPlan, marked.todos, "2026-09-15", false);

    assert.equal(unlocked.todoPlan.persistent, false);
    assert.equal(todosForDay(unlocked.todoPlan, unlocked.todos, "2026-09-14")[0].done, true);
    assert.equal(todosForDay(unlocked.todoPlan, unlocked.todos, "2026-09-15")[0].done, true);
    assert.deepEqual(todosForDay(unlocked.todoPlan, unlocked.todos, "2026-09-16"), []);
  });
});

describe("pickTodoDailyFields", () => {
  it("omits the slice on ordinary to-do notes", () => {
    assert.deepEqual(pickTodoDailyFields({ todos: [] }), {});
  });

  it("keeps a normalized plan on daily notes", () => {
    const fields = pickTodoDailyFields({
      todoDaily: true,
      todoPlan: { persistent: 1, days: { "2026-09-14": [classic("a", "x")] }, marks: null },
    });
    assert.equal(fields.todoDaily, true);
    assert.equal(fields.todoPlan.persistent, true);
    assert.equal(fields.todoPlan.days["2026-09-14"].length, 1);
    assert.deepEqual(fields.todoPlan.marks, {});
  });
});
