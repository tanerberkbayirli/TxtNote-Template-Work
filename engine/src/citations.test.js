import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { mcbuMaster } from "./templates/mcbu.js";
import { compileThesisDocument } from "./engine.js";
import { buildThesisDocx } from "./export.js";
import { updateThesisNoteSection } from "./document.js";
import { sameThesisEditorProjection, thesisSourceHtml } from "./sourceHtml.js";
import { citationContext, citationHtml, citationMode, normalizeSource, sourceFieldsFor, presentedCitationHtml, removeSourceCitations, renderCitationHtml, storedCitationHtml, templateCitationMode } from "./citations.js";

const sources = [
  { id: "src_y", kind: "book", authors: "Yılmaz, Ahmet", year: "2026", title: "Kitap Adı", publication: "Yayınevi" },
  { id: "src_a", kind: "article", authors: "Aksoy, Bora; Demir, Can", year: "2024", title: "Makale başlığı", publication: "Dergi", volume: "12", issue: "3", pages: "10-20" },
  { id: "src_u", kind: "book", authors: "Zeren, Deniz", year: "2020", title: "Kullanılmayan", publication: "Yayınevi" },
];
const cite = (id, locator = "", key = `k_${id}_${locator}`) => citationHtml(id, { locator, key });
const body = (...cites) => `<h1>GİRİŞ</h1>${cites.map((html, index) => `<p>Cümle ${index + 1}${html}.</p>`).join("")}`;
const compile = (content, thesis = {}) => compileThesisDocument(mcbuMaster, { values: {}, sectionContent: {}, sources, ...thesis }, "Tez", content);
const bibliography = (model) => model.sections.find((section) => section.type === "bibliography");
const entries = (model) => [...(bibliography(model).html.match(/<li data-thesis-source-id="[^"]+"[^>]*>[\s\S]*?<\/li>/g) || [])];
const main = (model) => model.sections.find((section) => section.type === "mainContent");

describe("linked citations and bibliography", () => {
  it("lists exactly the cited sources, one entry each, A→Z by first author surname", () => {
    const model = compile(body(cite("src_y", "45"), cite("src_a"), cite("src_y", "50")));
    const rows = entries(model);
    assert.equal(rows.length, 2, "two cited sources (src_y twice), the unused src_u is not listed");
    assert.match(rows[0], /data-thesis-source-id="src_a"/);
    assert.match(rows[1], /data-thesis-source-id="src_y"/);
    assert.match(rows[1], /Yılmaz, A\. \(2026\)\. <i>Kitap Adı<\/i>\. Yayınevi\./);
    assert.equal(model.citations.entryCount, model.citations.citedCount);
  });

  it("a citation removed from the text drops its source from the bibliography; an added one appears", () => {
    assert.equal(entries(compile(body(cite("src_y")))).length, 1);
    assert.equal(entries(compile(body())).length, 0);
    assert.equal(entries(compile(body(cite("src_y"), cite("src_u")))).length, 2);
  });

  it("parenthetical mode: short label inline in every output", () => {
    const model = compile(body(cite("src_y", "45")), { citationMode: "parenthetical" });
    assert.match(main(model).editableHtml, /<span class="thesis-cite"[^>]*>\(Yılmaz, 2026, s\. 45\)<\/span>/);
    assert.match(main(model).html, /\(Yılmaz, 2026, s\. 45\)/);
  });

  it("footnote mode: the same citation is a page-bottom footnote with the short label, also in Word", async () => {
    const model = compile(body(cite("src_y", "45")), { citationMode: "footnote" });
    assert.match(main(model).editableHtml, /<sup class="academic-footnote thesis-cite"[^>]*data-fn-text="Yılmaz, 2026, s\. 45\."/);
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    assert.match(strFromU8(files["word/footnotes.xml"]), /Yılmaz, 2026, s\. 45\./);
    assert.match(strFromU8(files["word/document.xml"]), /w:footnoteReference/);
    // The detailed entry is in the bibliography, not in the note.
    assert.match(strFromU8(files["word/document.xml"]), /Yılmaz, A\. \(2026\)\./);
  });

  it("numeric mode numbers by first citation and lists in that order", () => {
    const model = compile(body(cite("src_y"), cite("src_a"), cite("src_y", "7")), { citationMode: "numeric" });
    const html = main(model).editableHtml;
    assert.deepEqual([...html.matchAll(/class="thesis-cite"[^>]*>([^<]*)</g)].map((m) => m[1]), ["(1)", "(2)", "(1, s. 7)"]);
    const rows = entries(model);
    assert.match(rows[0], /src_y[\s\S]*>1\. /);
    assert.match(rows[1], /src_a[\s\S]*>2\. /);
  });

  it("a hand-corrected entry replaces only the text; the link to the source and the sync stay", () => {
    const corrected = sources.map((source) => (source.id === "src_y" ? { ...source, entryOverride: "Yılmaz, A. (2026). Kitap Adı (2. bs.). Yayınevi." } : source));
    const thesis = { sources: corrected };
    const model = compile(body(cite("src_y"), cite("src_a")), thesis);
    const row = entries(model).find((r) => r.includes("src_y"));
    assert.match(row, /data-thesis-source-manual="true"[^>]*>Yılmaz, A\. \(2026\)\. Kitap Adı \(2\. bs\.\)\. Yayınevi\./);
    assert.equal(entries(compile(body(cite("src_a")), thesis)).length, 1, "removing its citation still removes the hand-edited entry");
  });

  it("the note stores only the citation, never its label; editor projection ignores the label", () => {
    const presented = presentedCitationHtml(citationContext(mcbuMaster, { sources }, []), { id: "src_y", key: "k1", locator: "45" });
    const stored = storedCitationHtml(`<p>x${presented}.</p>`);
    assert.equal(stored, `<p>x${citationHtml("src_y", { key: "k1", locator: "45" })}.</p>`);
    assert.equal(storedCitationHtml(stored), stored, "idempotent");
    assert.ok(sameThesisEditorProjection(`<p>x${presented}.</p>`, stored));
    const section = { id: "main", type: "mainContent", editable: true, mode: "editable" };
    const saved = updateThesisNoteSection({ content: "", researchData: {} }, { ...section, status: "required" }, `<p>x${presented}.</p>`);
    assert.ok(!saved.content.includes("Yılmaz"), "label not stored");
    assert.match(saved.content, /data-cite-id="src_y"/);
  });

  it("a citation inserted inside a word-justification run does not keep the run in the note", () => {
    const live = `<p><span data-thesis-word-fit="0" style="word-spacing: 0px">Metin <span class="thesis-cite" data-cite-id="src_y" data-cite-key="k">(Yılmaz, 2026)</span>. Son.</span></p>`;
    assert.equal(thesisSourceHtml(live), '<p>Metin <span class="thesis-cite" data-cite-id="src_y" data-cite-key="k">(Yılmaz, 2026)</span>. Son.</p>');
    assert.equal(thesisSourceHtml('<p><span data-thesis-word-fit="1">düz</span> metin</p>'), "<p>düz metin</p>");
  });

  it("one stored position, placed per mode: label before the stop with a space, footnote mark after the stop", () => {
    const stored = storedCitationHtml(`<p>Metin <span class="thesis-cite" data-cite-id="src_y" data-cite-key="k">(Yılmaz, 2026)</span>.</p>`);
    assert.equal(stored, `<p>Metin${citationHtml("src_y", { key: "k" })}.</p>`);
    const fromNote = storedCitationHtml(`<p>Metin.<sup class="academic-footnote thesis-cite" data-cite-id="src_y" data-cite-key="k" data-fn-text="x">1</sup> Son.</p>`);
    assert.equal(fromNote, stored.replace("</p>", " Son.</p>"));
    const paren = main(compile(`<h1>G</h1>${stored}`, { citationMode: "parenthetical" })).editableHtml;
    assert.match(paren, /Metin <span class="thesis-cite"[^>]*>\(Yılmaz, 2026\)<\/span>\./);
    const note = main(compile(`<h1>G</h1>${stored}`, { citationMode: "footnote" })).editableHtml;
    assert.match(note, /Metin\.<sup class="academic-footnote thesis-cite"/);
    // Two citations of one sentence: "(A) (B)." / ".¹²".
    const two = `<p>Metin${citationHtml("src_y", { key: "k1" })}${citationHtml("src_a", { key: "k2" })}.</p>`;
    assert.match(main(compile(`<h1>G</h1>${two}`, { citationMode: "parenthetical" })).editableHtml, /Metin <span[^>]*>\(Yılmaz, 2026\)<\/span> <span[^>]*>\(Aksoy &amp; Demir, 2024\)<\/span>\./);
    assert.match(main(compile(`<h1>G</h1>${two}`, { citationMode: "footnote" })).editableHtml, /Metin\.<sup[^>]*src_y[^>]*>1<\/sup><sup[^>]*src_a/);
    assert.equal(storedCitationHtml(main(compile(`<h1>G</h1>${two}`, { citationMode: "footnote" })).editableHtml).includes(two.slice(3, -4)), true, "footnote form stores back to the same position");
  });

  it("parenthetical: the full stop always ends up right after the closing parenthesis", () => {
    const one = [{ id: "f", kind: "book", authors: "Falanca, Ali", year: "2026", title: "Eser", publication: "Yayınevi" }];
    const out = (html) => main(compile(`<h1>G</h1>${html}`, { sources: one, citationMode: "parenthetical" })).editableHtml
      .replace(/<span class="thesis-cite"[^>]*>([^<]*)<\/span>/g, "$1").replace(/^.*?<\/h1>/, "");
    const c = cite("f", "42");
    const want = "falanca yerde bulunur (Falanca, 2026, s. 42).";
    assert.equal(out(`<p>falanca yerde bulunur${c}.</p>`), `<p>${want}</p>`);
    assert.equal(out(`<p>falanca yerde bulunur.${c}</p>`), `<p>${want}</p>`, "a stop typed before the citation moves after it");
    assert.equal(out(`<p>falanca yerde bulunur. ${c}</p>`), `<p>${want}</p>`, "also with a space between");
    assert.equal(out(`<p><b>falanca yerde bulunur.</b>${c}</p>`), `<p><b>falanca yerde bulunur</b> (Falanca, 2026, s. 42).</p>`, "a stop inside formatting leaves it");
    assert.equal(out(`<p>Sonra devam eder${c}. İkinci cümle.</p>`), "<p>Sonra devam eder (Falanca, 2026, s. 42). İkinci cümle.</p>");
  });

  it("a thesis source names only its own degree in the bibliography", () => {
    const thesis = (thesisType) => [{ id: "t", kind: "thesis", thesisType, authors: "Kaya, Ece", year: "2024", title: "Tez başlığı", publication: "Manisa Celal Bayar Üniversitesi" }];
    const entry = (thesisType) => entries(compile(body(cite("t")), { sources: thesis(thesisType) }))[0];
    assert.match(entry("master"), /<i>Tez başlığı<\/i> \[Yayımlanmamış yüksek lisans tezi\]\. Manisa Celal Bayar Üniversitesi\./);
    assert.match(entry("phd"), /<i>Tez başlığı<\/i> \[Yayımlanmamış doktora tezi\]\. Manisa Celal Bayar Üniversitesi\./);
    for (const type of ["master", "phd", undefined]) assert.doesNotMatch(entry(type), /lisans\/doktora/);
    assert.match(entry(undefined), /\[Yayımlanmamış tez\]/, "an old record without a degree gets the neutral description, never both");
    assert.equal(normalizeSource({ kind: "thesis", thesisType: "phd" }).thesisType, "phd", "the degree is kept in the pool");
  });

  it("each kind keeps only its own fields; url and doi stay optional at the end (no doi for a web page)", () => {
    assert.deepEqual(sourceFieldsFor("book").filter((key) => !["kind", "entryOverride"].includes(key)), ["authors", "year", "title", "url", "doi", "publication"]);
    assert.deepEqual(sourceFieldsFor("article").slice(-4), ["publication", "volume", "issue", "pages"]);
    assert.deepEqual(sourceFieldsFor("thesis").slice(-2), ["thesisType", "publication"]);
    assert.ok(!sourceFieldsFor("web").includes("doi") && sourceFieldsFor("web").includes("url"));
    // A form switched from article to book submits leftovers; they are not stored.
    const book = normalizeSource({ id: "s", kind: "book", authors: "A", title: "T", publication: "Yayınevi", volume: "12", issue: "3", pages: "15-30", thesisType: "phd" });
    assert.deepEqual(book, { id: "s", kind: "book", authors: "A", title: "T", publication: "Yayınevi" });
    const web = normalizeSource({ id: "w", kind: "web", title: "Sayfa", publication: "Wikipedia", doi: "10.1/x", url: "https://tr.wikipedia.org" });
    assert.deepEqual(web, { id: "w", kind: "web", title: "Sayfa", url: "https://tr.wikipedia.org", publication: "Wikipedia" });
    assert.equal(normalizeSource({ kind: "article", volume: "4", entryOverride: "elle" }).entryOverride, "elle", "a hand-written entry survives a kind change");
  });

  it("a pasted citation without a key gets a deterministic one", () => {
    const pasted = '<p>a<span class="thesis-cite" data-cite-id="src_y">(Eski)</span></p>';
    assert.equal(storedCitationHtml(pasted), storedCitationHtml(pasted));
  });

  it("switching mode needs no rewrite of the note: one stored form renders three ways", () => {
    const content = body(cite("src_y", "45"));
    const labels = ["parenthetical", "footnote", "numeric"].map((citationMode) => main(compile(content, { citationMode })).editableHtml);
    assert.match(labels[0], />\(Yılmaz, 2026, s\. 45\)</);
    assert.match(labels[1], /academic-footnote/);
    assert.match(labels[2], />\(1, s\. 45\)</);
  });

  it("deleting a source can take its citations out of the text", () => {
    const html = body(cite("src_y"), cite("src_a"));
    const cleaned = removeSourceCitations(html, "src_y");
    assert.ok(!cleaned.includes("src_y") && cleaned.includes("src_a"));
  });

  it("a citation to a missing source is visible, not silently dropped", () => {
    const context = citationContext(mcbuMaster, { sources: [] }, [cite("gone")]);
    assert.match(renderCitationHtml(cite("gone"), context), /is-missing[^>]*>\(kaynak bulunamadı\)</);
  });

  it("mode defaults come from the template's citation style; the user's choice wins", () => {
    assert.equal(templateCitationMode({ bibliography: { citationStyle: "Vancouver" } }), "numeric");
    assert.equal(templateCitationMode({ bibliography: { citationStyle: "author-year" } }), "parenthetical");
    assert.equal(templateCitationMode({ bibliography: { citationStyle: "Chicago notes" } }), "footnote");
    assert.equal(citationMode({ bibliography: { citationStyle: "author-year" } }, { citationMode: "footnote" }), "footnote");
  });

  it("no pool and no citations: the legacy bibliography lines render as before", () => {
    const model = compileThesisDocument(mcbuMaster, { values: {}, sectionContent: {} }, "Tez", body(), ["Kaya, B. (2021). Eser."]);
    assert.match(bibliography(model).html, /<ul class="thesis-bibliography"><li[^>]*>Kaya, B\. \(2021\)\. Eser\.<\/li><\/ul>/);
  });
});
