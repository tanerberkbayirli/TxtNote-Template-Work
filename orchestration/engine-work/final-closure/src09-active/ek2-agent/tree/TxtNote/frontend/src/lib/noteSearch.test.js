import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { foldSearch, titleMatchesQuery, uniqueMatchingWords } from "./noteSearch.js";

const SAMPLE = "İğne yalnız teklik insan yakamoz çingene";

describe("foldSearch", () => {
  it("treats İ, I, i and ı as the same letter", () => {
    assert.equal(foldSearch("İ"), foldSearch("i"));
    assert.equal(foldSearch("I"), foldSearch("ı"));
    assert.equal(foldSearch("İğne"), foldSearch("iĞNE"));
  });
});

describe("uniqueMatchingWords", () => {
  it("İ matches Turkish i/ı words, starts-with first, max 5", () => {
    assert.deepEqual(uniqueMatchingWords(SAMPLE, "İ"), [
      "İğne",
      "insan",
      "yalnız",
      "teklik",
      "çingene",
    ]);
  });

  it("contains matches like yalniz → yalnız", () => {
    assert.deepEqual(uniqueMatchingWords(SAMPLE, "yalniz"), ["yalnız"]);
  });

  it("caps unique hits at 5 and prefers starts-with", () => {
    const text = "elma armut ayva ananas avokado ahududu";
    assert.deepEqual(uniqueMatchingWords(text, "a"), [
      "armut",
      "ayva",
      "ananas",
      "avokado",
      "ahududu",
    ]);
  });

  it("does not glue words across line breaks", () => {
    assert.deepEqual(uniqueMatchingWords("İğne\nyalnız", "İğne"), ["İğne"]);
  });

  it("returns nothing for a blank query", () => {
    assert.deepEqual(uniqueMatchingWords(SAMPLE, "   "), []);
  });

  it("keeps the first spelling of a duplicate word", () => {
    assert.deepEqual(uniqueMatchingWords("İnsan insan", "insan"), ["İnsan"]);
  });

  it("keeps hyphenated words together and matches their hyphen", () => {
    const text = "Mor-Pusula başka bir pusula";
    assert.deepEqual(uniqueMatchingWords(text, "Mor-Pusula"), ["Mor-Pusula"]);
    assert.deepEqual(uniqueMatchingWords(text, "-"), ["Mor-Pusula"]);
  });

  it("does not include standalone hyphens in neighboring words", () => {
    assert.deepEqual(uniqueMatchingWords("Mor - Pusula", "-"), []);
  });
});

describe("titleMatchesQuery", () => {
  it("matches titles with Turkish folding", () => {
    assert.equal(titleMatchesQuery("İğne defteri", "İğ"), true);
    assert.equal(titleMatchesQuery("Yalnız not", "yalniz"), true);
    assert.equal(titleMatchesQuery("Yakamoz", "çinge"), false);
  });

  it("treats a blank query as a match", () => {
    assert.equal(titleMatchesQuery("İğne", "  "), true);
  });
});
