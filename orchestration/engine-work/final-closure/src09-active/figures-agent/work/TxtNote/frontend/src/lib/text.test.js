import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { badgeFromName, normalizeName } from "./text.js";

describe("normalizeName", () => {
  it("collapses inner whitespace and trims", () => {
    assert.equal(normalizeName("  İş  Notları "), "İş Notları");
  });

  it("does not throw on null, undefined or numbers", () => {
    assert.equal(normalizeName(undefined), "");
    assert.equal(normalizeName(null), "");
    assert.equal(normalizeName(12), "12");
  });
});

describe("badgeFromName", () => {
  it("uppercases the first letter with Turkish casing", () => {
    assert.equal(badgeFromName("iş"), "İ");
    assert.equal(badgeFromName(""), "?");
    assert.equal(badgeFromName(null), "?");
  });
});
