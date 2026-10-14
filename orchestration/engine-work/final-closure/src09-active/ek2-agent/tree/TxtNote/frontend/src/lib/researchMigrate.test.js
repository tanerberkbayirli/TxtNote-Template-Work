import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flattenResearchData,
  flattenResearchNote,
  migrateAcademicNote,
  promoteAcademicItem,
} from "./researchMigrate.js";

describe("flattenResearchData", () => {
  it("returns empty when there is nothing to keep", () => {
    assert.equal(flattenResearchData(null), "");
    assert.equal(flattenResearchData({}), "");
    assert.equal(flattenResearchData({ abstract: "<p></p>", quotes: [] }), "");
  });

  it("keeps source fields and rich sections in order", () => {
    const html = flattenResearchData({
      sourceTitle: "Makale",
      authors: "Ada",
      abstract: "<span class=\"fmt-bold\">Özet</span>",
      quotes: [{ id: "q1", text: "Alıntı metni", page: "12", comment: "not" }],
    });
    assert.match(html, /Kaynak \/ çalışma adı/);
    assert.match(html, /Makale/);
    assert.match(html, /Yazar\(lar\)/);
    assert.match(html, /Ada/);
    assert.match(html, /Özet/);
    assert.match(html, /fmt-bold/);
    assert.match(html, /Alıntı 1/);
    assert.match(html, /Sayfa: 12/);
  });
});

describe("flattenResearchNote", () => {
  it("fills an empty body from research fields", () => {
    const next = flattenResearchNote({
      title: "Tez",
      content: "",
      researchData: { abstract: "Kısa özet" },
    });
    assert.equal(next.title, "Tez");
    assert.match(next.content, /Kısa özet/);
  });

  it("leaves an already filled body alone", () => {
    const next = flattenResearchNote({
      content: "Kendi yazım",
      researchData: { abstract: "Kısa özet" },
    });
    assert.equal(next.content, "Kendi yazım");
  });
});

describe("migrateAcademicNote", () => {
  it("copies a legacy özet into the paper abstract field", () => {
    const next = migrateAcademicNote({
      content: "Metin",
      researchData: { abstract: "<p>Kısa özet</p>" },
    });
    assert.equal(next.researchData.docAbstract, "Kısa özet");
  });

  it("turns legacy source fields into a sources list", () => {
    const next = migrateAcademicNote({
      content: "Metin",
      researchData: { sourceTitle: "Makale", authors: "Ada", publicationYear: "2020" },
    });
    assert.equal(next.content, "Metin");
    assert.equal(next.researchData.sources[0].title, "Makale");
    assert.equal(next.researchData.sources[0].year, "2020");
  });
});

describe("promoteAcademicItem", () => {
  it("turns a research item into akademik yazı", () => {
    const item = promoteAcademicItem({ id: "itm-1", noteType: "research", title: "Tez" });
    assert.equal(item.noteType, "academic");
    assert.equal(item.title, "Tez");
  });

  it("leaves other types untouched", () => {
    const item = { id: "itm-2", noteType: "todo" };
    assert.equal(promoteAcademicItem(item), item);
  });
});
