import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DAYS_IN_GRID,
  MONTHS_TR,
  WEEKDAYS_TR,
  YEARS_PER_PAGE,
  addDays,
  dayKey,
  monthGrid,
  monthName,
  yearBlockStart,
} from "./diaryCalendar.js";

describe("dayKey", () => {
  it("formats local dates as YYYY-MM-DD", () => {
    assert.equal(dayKey(new Date(2026, 8, 17)), "2026-09-17");
    assert.equal(dayKey(new Date(2026, 0, 5)), "2026-01-05");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    assert.equal(dayKey(addDays(new Date(2026, 8, 30), 1)), "2026-10-01");
    assert.equal(dayKey(addDays(new Date(2026, 11, 31), 1)), "2027-01-01");
  });
});

describe("monthName", () => {
  it("returns Turkish long month names", () => {
    assert.equal(monthName(8), "Eylül");
    assert.equal(MONTHS_TR[0], "Ocak");
    assert.equal(MONTHS_TR[11], "Aralık");
  });
});

describe("WEEKDAYS_TR", () => {
  it("starts the week on Monday", () => {
    assert.equal(WEEKDAYS_TR.length, 7);
    assert.match(WEEKDAYS_TR[0], /^pzt/i);
    assert.match(WEEKDAYS_TR[6], /^paz/i);
  });
});

describe("yearBlockStart", () => {
  it("aligns a year to a 12-year block", () => {
    assert.equal(yearBlockStart(2026), 2016);
    assert.equal(yearBlockStart(2016), 2016);
    assert.equal(yearBlockStart(2015), 2004);
    assert.equal(yearBlockStart(2026) + YEARS_PER_PAGE - 1, 2027);
  });
});

describe("monthGrid", () => {
  it("always returns six Monday-first weeks", () => {
    const cells = monthGrid(2026, 8);
    assert.equal(cells.length, DAYS_IN_GRID);
    assert.equal(cells[0].key, "2026-08-31");
    assert.equal(cells[0].inMonth, false);
    assert.equal(cells[1].key, "2026-09-01");
    assert.equal(cells[1].inMonth, true);
    assert.equal(cells[1].date.getDay(), 2);
  });

  it("covers a 31-day month that needs six rows", () => {
    const cells = monthGrid(2026, 2);
    const inMonth = cells.filter((cell) => cell.inMonth);
    assert.equal(inMonth.length, 31);
    assert.equal(inMonth[0].key, "2026-03-01");
    assert.equal(inMonth[30].key, "2026-03-31");
  });
});
