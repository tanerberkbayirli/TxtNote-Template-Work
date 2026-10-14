import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountOnDay,
  formatTodoDay,
  isDayComplete,
  isProgressTodo,
  isTodoDone,
  otherDayLogs,
  parseAmount,
  progressRatio,
  progressTarget,
  setDayAmount,
  setProgressTarget,
  TODO_KIND_PROGRESS,
  todoDayKey,
} from "./todoProgress.js";

describe("parseAmount", () => {
  it("reads integers, commas and blanks", () => {
    assert.equal(parseAmount("70"), 70);
    assert.equal(parseAmount("70,5"), 70.5);
    assert.equal(parseAmount(""), null);
    assert.equal(parseAmount("-1"), null);
  });
});

describe("progress days", () => {
  const today = "2026-09-09";
  const base = { id: "t1", kind: TODO_KIND_PROGRESS, text: "koşu", target: 100, logs: [] };

  it("does not mark a day under the target", () => {
    const logged = setDayAmount(base, 70, today);
    assert.equal(amountOnDay(logged, today), 70);
    assert.equal(isDayComplete(logged, today), false);
    assert.equal(isTodoDone(logged, today), false);
  });

  it("auto-marks a day that meets or passes the target", () => {
    const met = setDayAmount(base, 100, today);
    const over = setDayAmount(base, 120, today);
    assert.equal(isDayComplete(met, today), true);
    assert.equal(isTodoDone(met, today), true);
    assert.equal(isDayComplete(over, today), true);
  });

  it("keeps yesterday complete without marking today", () => {
    const logged = setDayAmount(
      { ...base, logs: [{ date: "2026-09-08", amount: 100 }] },
      70,
      today,
    );
    assert.equal(isDayComplete(logged, "2026-09-08"), true);
    assert.equal(isTodoDone(logged, today), false);
    assert.equal(otherDayLogs(logged, today).length, 1);
  });

  it("recomputes the mark when the target changes", () => {
    const logged = setDayAmount(base, 70, today);
    const easier = setProgressTarget(logged, 70);
    assert.equal(isTodoDone(easier, today), true);
  });
});

describe("classic vs progress", () => {
  it("treats missing kind as a classic checkbox", () => {
    const classic = { id: "c", text: "süt", done: true };
    assert.equal(isProgressTodo(classic), false);
    assert.equal(isTodoDone(classic), true);
    assert.equal(progressTarget(classic), 0);
  });
});

describe("display helpers", () => {
  it("formats a day key and clamps the bar", () => {
    assert.equal(todoDayKey(new Date(2026, 8, 9)), "2026-09-09");
    assert.match(formatTodoDay("2026-09-09"), /9/);
    assert.equal(progressRatio({ target: 100, logs: [{ date: "2026-09-09", amount: 250 }] }, "2026-09-09"), 1);
  });
});
