import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MATH_FORMULA_PRESETS, searchMathFormulas } from "./mathFormulas.js";

describe("MATH_FORMULA_PRESETS", () => {
  it("loads the full searchable catalog", () => {
    assert.equal(MATH_FORMULA_PRESETS.length, 200);
    assert.equal(MATH_FORMULA_PRESETS[0].name, "İkinci Dereceden Denklem Çözümü");
    assert.match(MATH_FORMULA_PRESETS[0].latex, /\\frac/);
    assert.equal(MATH_FORMULA_PRESETS.at(-1).name, "Radyoaktif Bozunma Denklemi");
  });
});

describe("searchMathFormulas", () => {
  it("lists the catalog when the query is empty", () => {
    const hits = searchMathFormulas("");
    assert.equal(hits.length, 200);
    assert.equal(hits[0].name, "İkinci Dereceden Denklem Çözümü");
  });

  it("finds a formula by its Turkish name", () => {
    const hits = searchMathFormulas("pisagor");
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].name, "Pisagor Teoremi");
    assert.equal(hits[0].latex, "a^2 + b^2 = c^2");
  });

  it("matches names with Turkish folding", () => {
    const hits = searchMathFormulas("ikinci");
    assert.equal(hits[0].name, "İkinci Dereceden Denklem Çözümü");
  });
});
