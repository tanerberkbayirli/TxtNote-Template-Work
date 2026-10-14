import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bibliographyItemsForExport,
  bibliographyItemsFromResearch,
  normalizeBibliographyItems,
} from "./academicBibliography.js";

describe("bibliographyItemsFromResearch", () => {
  it("prefers the item list", () => {
    assert.deepEqual(
      bibliographyItemsFromResearch({
        docBibliographyItems: ["Bir", "İki"],
        docBibliography: "Eski",
      }),
      ["Bir", "İki"],
    );
  });

  it("splits legacy newline text into items", () => {
    assert.deepEqual(
      bibliographyItemsFromResearch({ docBibliography: "Bir\nİki" }),
      ["Bir", "İki"],
    );
  });

  it("starts with one empty item when empty", () => {
    assert.deepEqual(bibliographyItemsFromResearch({}), [""]);
  });
});

describe("bibliographyItemsForExport", () => {
  it("drops blank items", () => {
    assert.deepEqual(
      bibliographyItemsForExport({ docBibliographyItems: [" Ada ", "", "Kaya"] }),
      ["Ada", "Kaya"],
    );
  });
});

describe("normalizeBibliographyItems", () => {
  it("keeps at least one slot", () => {
    assert.deepEqual(normalizeBibliographyItems([]), [""]);
  });
});
