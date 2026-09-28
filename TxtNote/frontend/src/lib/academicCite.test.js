import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bibliographyHtml,
  bibliographyLine,
  citeLabel,
  citationHtml,
  normalizeHttpUrl,
} from "./academicCite.js";

describe("citeLabel", () => {
  it("handles surname-first authors and per-citation page locators", () => {
    assert.equal(citeLabel({authors:"Yılmaz, A.; Kaya, B.",year:"2024"}, "12–14"), "(Yılmaz & Kaya, 2024, s. 12–14)");
  });
  it("disambiguates matching authors and years consistently", () => {
    const sources = [{id:"b",authors:"Kaya, B.",year:"2024",title:"Zaman"},{id:"a",authors:"Kaya, B.",year:"2024",title:"Araştırma"}];
    assert.equal(citeLabel(sources[0], "", sources), "(Kaya, 2024b)");
    assert.match(bibliographyLine(sources[0],sources), /2024b/);
  });
  it("uses last name and year", () => {
    assert.equal(citeLabel({ authors: "Ada Lovelace", year: "1843" }), "(Lovelace, 1843)");
  });

  it("falls back to title", () => {
    assert.equal(citeLabel({ title: "Analitik Motor" }), "(Analitik Motor)");
  });
});

describe("bibliographyLine", () => {
  it("includes journal volume, issue, pages, URL and access date", () => {
    const line = bibliographyLine({authors:"Kaya, B.",year:"2024",title:"Araştırma",publication:"Bilim",volume:"12",issue:"3",pages:"10–20",url:"https://example.org",accessed:"2026-09-17"});
    for (const part of ["12(3)","10–20","https://example.org","2026-09-17"]) assert.ok(line.includes(part));
  });
  it("joins APA-like parts", () => {
    const line = bibliographyLine({
      authors: "Lovelace, A.",
      year: "1843",
      title: "Notes",
      publication: "Taylor's Scientific Memoirs",
    });
    assert.match(line, /Lovelace/);
    assert.match(line, /\(1843\)/);
    assert.match(line, /Notes/);
  });
});

describe("citationHtml", () => {
  it("marks the source id", () => {
    const html = citationHtml({ id: "src-1", authors: "Ada", year: "1843" });
    assert.match(html, /academic-cite/);
    assert.match(html, /data-source-id="src-1"/);
  });
});

describe("bibliographyHtml", () => {
  it("lists sources under Kaynakça", () => {
    const html = bibliographyHtml([{ authors: "Ada", year: "1843", title: "Notes" }]);
    assert.match(html, /Kaynakça/);
    assert.match(html, /<li>/);
    assert.match(html, /Notes/);
  });
});

describe("normalizeHttpUrl", () => {
  it("adds https when missing", () => {
    assert.equal(normalizeHttpUrl("example.com/a"), "https://example.com/a");
    assert.equal(normalizeHttpUrl("https://x.test"), "https://x.test");
    assert.equal(normalizeHttpUrl(""), "");
  });
});
