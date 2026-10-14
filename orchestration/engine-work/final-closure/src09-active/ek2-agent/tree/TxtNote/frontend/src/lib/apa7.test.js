import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { apa7Citation, apa7Reference, apa7ReferenceRuns, apa7Bibliography, apa7BibliographyHtml, apa7CheckCoverage, withApa7Bibliography, APA7_HANGING_INDENT_MM } from "./apa7.js";
import { mcbuMaster, mcbuPhd } from "../thesis/templates/mcbu.js";
import { mcbuTipUzmanlik } from "../thesis/templates/mcbu-tip.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";

const article = { id: "a", kind: "article", authors: "Yılmaz, Ayşe; Kaya, Bora", year: "2020", title: "Çevrimiçi öğrenme ve başarı", publication: "Eğitim Dergisi", volume: "12", issue: "3", pages: "45-67", doi: "10.1000/xyz" };

describe("APA 7 citations", () => {
  it("one, two and three-plus authors", () => {
    assert.equal(apa7Citation({ authors: "Lovelace, Ada", year: "1843" }), "(Lovelace, 1843)");
    assert.equal(apa7Citation(article), "(Yılmaz & Kaya, 2020)");
    assert.equal(apa7Citation(article, { narrative: true }), "Yılmaz ve Kaya (2020)");
    assert.equal(apa7Citation({ authors: "A, X; B, Y; C, Z", year: "2021" }), "(A vd., 2021)");
    assert.equal(apa7Citation({ authors: "A, X; B, Y; C, Z", year: "2021" }, { lang: "en" }), "(A et al., 2021)");
  });
  it("page locators and year letters", () => {
    assert.equal(apa7Citation(article, { locator: "5" }), "(Yılmaz & Kaya, 2020, s. 5)");
    assert.equal(apa7Citation(article, { locator: "5–7", lang: "en" }), "(Yılmaz & Kaya, 2020, pp. 5–7)");
    const s = [{ id: "1", authors: "Kaya, B.", year: "2024", title: "Zaman" }, { id: "2", authors: "Kaya, B.", year: "2024", title: "Araştırma" }];
    assert.equal(apa7Citation(s[0], { sources: s }), "(Kaya, 2024b)");
  });
});

describe("APA 7 reference list", () => {
  it("journal article: italic journal and volume, en dash pages, DOI link", () => {
    assert.equal(apa7Reference(article), "Yılmaz, A., & Kaya, B. (2020). Çevrimiçi öğrenme ve başarı. Eğitim Dergisi, 12(3), 45–67. https://doi.org/10.1000/xyz");
    assert.deepEqual(apa7ReferenceRuns(article).filter((r) => r.italic).map((r) => r.text), ["Eğitim Dergisi", "12"]);
  });
  it("book: italic title", () => {
    const book = { kind: "book", authors: "Ada Lovelace", year: "1843", title: "Notlar", publication: "Londra Yayınları" };
    assert.equal(apa7Reference(book), "Lovelace, A. (1843). Notlar. Londra Yayınları.");
    assert.deepEqual(apa7ReferenceRuns(book).filter((r) => r.italic).map((r) => r.text), ["Notlar"]);
  });
  it("sorted alphabetically, unnumbered, hanging indent in HTML", () => {
    const list = apa7Bibliography([{ id: "z", authors: "Zeybek, A.", year: "2019", title: "Z" }, { id: "a", authors: "Akın, B.", year: "2019", title: "A" }]);
    assert.deepEqual(list.map((e) => e.id), ["a", "z"]);
    const html = apa7BibliographyHtml([article]);
    assert.match(html, /margin:0 0 0 12\.7mm;text-indent:-12\.7mm/);
    assert.match(html, /<i>Eğitim Dergisi<\/i>/);
    assert.doesNotMatch(html, /<ol|<li/);
  });
  it("coverage check", () => {
    assert.deepEqual(apa7CheckCoverage(["a", "x"], [{ id: "a" }, { id: "b" }]), { uncited: ["b"], missing: ["x"] });
  });
});

describe("withApa7Bibliography", () => {
  it("returns a copy with APA 7 reference layout and leaves the template alone", () => {
    const before = JSON.stringify(mcbuMaster.bibliography);
    const apa = withApa7Bibliography(mcbuMaster);
    assert.equal(JSON.stringify(mcbuMaster.bibliography), before);
    assert.equal(apa.bibliography.style.hangingIndentMm, APA7_HANGING_INDENT_MM);
    assert.equal(apa.bibliography.style.lineHeight, 2);
    assert.equal(apa.bibliography.hangingIndentMm, mcbuMaster.bibliography.hangingIndentMm);
    assert.equal(apa.page, mcbuMaster.page);
  });
  it("refuses numbered-style (Vancouver) templates", () => {
    assert.throws(() => withApa7Bibliography(mcbuTipUzmanlik), /numbered citation style/);
  });
  it("Word output: hanging 720 twip and double spacing in the reference list", async () => {
    for (const base of [mcbuMaster, mcbuPhd]) {
      const model = compileThesisDocument(withApa7Bibliography(base), { values: {}, sectionContent: {} }, "T", "<h1>G</h1><p>x</p>", ["Yılmaz, A. (2020). Kitap. Yayın.", "Kaya, B. (2021). Başka. Yayın."]);
      const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
      assert.match(xml, /<w:ind[^>]*w:left="720"[^>]*w:hanging="720"|<w:ind[^>]*w:hanging="720"[^>]*w:left="720"/);
      assert.match(xml, /w:line="480"/);
    }
  });
});
