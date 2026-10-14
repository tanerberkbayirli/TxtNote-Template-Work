import assert from "node:assert/strict";
import { describe, it } from "node:test";
import template from "../thesis/templates/adu-ziraat-lisans.js";

describe("ADÜ Ziraat Lisans cover", () => {
  for (const id of ["outer-cover", "inner-cover"]) {
    const blocks = template.sections.find((s) => s.id === id).blocks;
    it(`${id}: city/year is page-anchored at the source baseline (251.199 mm)`, () => {
      const city = blocks.find((b) => b.field === "CITY_YEAR");
      assert.equal(city.layoutMode, "absolute");
      const baseline = city.yMm + 12 * 0.9336 * (25.4 / 72) - 0.512;
      assert.ok(Math.abs(baseline - 251.199) < 0.01);
    });
    it(`${id}: funding note uses the Word 1.5-lines pitch (1.725 x font size)`, () => {
      const note = blocks.find((b) => b.field === "FUNDING_NOTE");
      assert.equal(note.style.lineHeight, 1.725);
    });
  }
  it("no second-advisor field: the official guide defines none", () => {
    assert.ok(!JSON.stringify(template.placeholders).includes("CO_ADVISOR"));
  });
});
