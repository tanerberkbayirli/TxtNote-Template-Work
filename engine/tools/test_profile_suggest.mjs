import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { suggestProfile } from "./profile-suggest.mjs";
import { generate } from "./spec2template.mjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../specs/${name}`, import.meta.url), "utf8"));
const extracted = read("adu-sagbil.extracted.json");
const truth = read("adu-sagbil.generation.json");

test("the suggested profile of the ADÜ source equals the reviewed one in every role the template is built from", () => {
  const { profile, missing } = suggestProfile(extracted, { identity: truth.identity });
  assert.deepEqual(missing, []);
  for (const key of ["bodyStyle", "bodyParagraph", "bodySection", "bodySourcePage", "headingParagraphs", "chapterParagraphs", "tableCaption", "figureCaption", "bibliographyParagraph", "tableProbe", "fixedPages"]) {
    assert.deepEqual(profile[key], truth[key], key);
  }
  assert.deepEqual(profile.sections.map((s) => s.id), truth.sections.map((s) => s.id), "same sections in the same order");
  for (const reviewed of truth.sections) {
    const suggested = profile.sections.find((s) => s.id === reviewed.id);
    // Known differences: sample paragraphs (fixture text only) and the CV title style (the reviewed profile did not measure it).
    const strip = ({ paragraphs, titleParagraph, ...rest }) => rest;
    assert.deepEqual(strip(suggested), strip(reviewed), reviewed.id);
    if (reviewed.id !== "cv") assert.equal(suggested.titleParagraph, reviewed.titleParagraph, `${reviewed.id} titleParagraph`);
  }
});

test("the template and the checks generated from the suggested profile equal those of the reviewed profile", () => {
  const { profile } = suggestProfile(extracted, { identity: truth.identity });
  const reviewed = generate(extracted, truth);
  const suggested = generate(extracted, profile);
  assert.ok(isDeepStrictEqual(suggested.checks, reviewed.checks), "all Tier 1 checks identical");
  // Two known differences: the review date, and the CV page title spacing (measured from the source paragraph; see the tool header).
  const normalize = (template) => {
    const copy = structuredClone(template);
    copy.source.verifiedAt = "";
    copy.sections.find((s) => s.id === "cv").overrides.headings[1].spaceAfterPt = 0;
    return copy;
  };
  assert.ok(isDeepStrictEqual(normalize(suggested.template), normalize(reviewed.template)));
});

test("a role the tool cannot find is reported as missing and never guessed", () => {
  const noRender = structuredClone(extracted);
  noRender.wordRender.pages = [];
  const result = suggestProfile(noRender, { identity: truth.identity });
  assert.ok(result.missing.some((m) => /bodySourcePage/.test(m)));
  assert.deepEqual(result.profile.fixedPages, [], "no rendered page, no fixed page");

  const noCaptions = structuredClone(extracted);
  for (const p of noCaptions.paragraphs) if (/^\s*(Tablo|Şekil)\s*\d/.test(p.text)) p.text = "";
  const captions = suggestProfile(noCaptions, { identity: truth.identity });
  assert.ok(captions.missing.includes("tableCaption") && captions.missing.includes("figureCaption"));
  assert.equal(captions.profile.tableCaption, undefined);
  assert.equal(captions.profile.tableProbe, undefined);
});

test("headings are found by style name as well as by their number", () => {
  const style = (id, name) => ({ id, type: "paragraph", default: id === "Normal" ? "1" : undefined, properties: { children: [{ tag: "w:name", attributes: { "w:val": name } }] } });
  const para = (index, text, styleId) => ({ index, locator: `word/document.xml#/w:document[1]/w:body[1]/w:p[${index}]`, text, properties: { pPr: { children: styleId ? [{ tag: "w:pStyle", attributes: { "w:val": styleId } }] : [] } }, runProperties: [] });
  const long = "Bu paragraf gövde metnidir ve yüz karakterden uzun olması için bilerek uzun yazılmıştır; böylece gövde paragrafı olarak seçilir.";
  const doc = {
    target: "synthetic",
    styles: [style("Normal", "Normal"), style("Baslik1", "heading 1"), style("Baslik2", "heading 2"), style("Baslik3", "heading 3"), style("Baslik4", "heading 4")],
    paragraphs: [
      para(1, "ÖZET", "Normal"), para(2, "Özet metni burada yer alır ve yeterince uzundur ki bölüm içeriği sayılsın diye yazılmıştır.", "Normal"),
      para(3, "GİRİŞ", "Baslik1"), para(4, long, "Normal"),
      para(5, "Kuramsal çerçeve", "Baslik2"), para(6, "Üçüncü düzey", "Baslik3"), para(7, "Dördüncü düzey", "Baslik4"),
      para(8, "KAYNAKLAR", "Normal"), para(9, "Yazar, A. (2020). Kitap.", "Normal"),
    ],
    sections: [{ locator: "word/document.xml#/w:document[1]/w:body[1]/w:sectPr[1]" }],
    tables: [],
    wordRender: { pages: [{ lines: [{ text: "ÖZET" }] }, { lines: [{ text: "GİRİŞ" }, { text: long.slice(0, 60) }] }, { lines: [{ text: "KAYNAKLAR" }] }] },
  };
  const { profile, missing } = suggestProfile(doc, { identity: { id: "x" } });
  assert.deepEqual(profile.headingParagraphs, [3, 5, 6, 7]);
  assert.equal(profile.bodyParagraph, 4);
  assert.equal(profile.bodySourcePage, 2);
  assert.equal(profile.bibliographyParagraph, 9);
  assert.deepEqual(profile.sections.map((s) => s.id), ["cover", "abstract", "main", "bibliography"]);
  assert.ok(missing.includes("tableCaption"));
});

// A source whose styles have custom names, whose heading numbers are added by Word (not in the text) and whose table of contents has no
// leaders: the levels come from the table of contents. Also an inner cover on page 3, an unclassified page 2 and a numbered rendered title.
test("a source with custom style names is read through its own table of contents; front pages are classified or reported", () => {
  const style = (id, name, def) => ({ id, type: "paragraph", default: def ? "1" : undefined, properties: { children: [{ tag: "w:name", attributes: { "w:val": name } }] } });
  const para = (index, text, styleId, locator) => ({ index, locator: locator ?? `word/document.xml#/w:document[1]/w:body[1]/w:p[${index}]`, text, properties: { pPr: { children: styleId ? [{ tag: "w:pStyle", attributes: { "w:val": styleId } }] : [] } }, runProperties: [] });
  const long = "Bu paragraf gövde metnidir ve yüz karakterden uzun olması için bilerek uzun yazılmıştır; böylece gövde paragrafı olarak seçilir ve sayfada bulunur.";
  const doc = {
    target: "synthetic-custom",
    styles: [style("N", "Normal", true), style("Ana", "t_anaBaslik_"), style("Alt", "t_baslik_1"), style("Genel", "t_genelBaşlık"), style("T1", "toc 1"), style("T2", "toc 2"), style("Cap", "Caption")],
    paragraphs: [
      para(1, "TEŞEKKÜR", "Genel"), para(2, "Teşekkür metni burada yer alır ve bir bölüm içeriği olacak kadar uzun yazılmıştır, böylece örnek metin sayılır.", "N"),
      para(3, "İÇİNDEKİLER", "Genel"),
      para(4, "1.GİRİŞ5", "T1"), para(5, "1.1.Problem Durumu6", "T2"), para(6, "2.YÖNTEM9", "T1"), para(7, "3.Kaynakça12", "T1"),
      para(8, "GİRİŞ", "Ana"), para(9, "Problem Durumu", "Alt"), para(10, long, "N"),
      para(11, "YÖNTEM", "Ana"), para(12, long, "N"),
      para(13, "Tablo 1. Örnek tablo", "Cap"),
      para(14, "Hücre", "N", "word/document.xml#/w:document[1]/w:body[1]/w:tbl[1]/w:tr[1]/w:tc[1]/w:p[1]"),
      para(15, "Şekil 1. Örnek şekil", "Cap"),
      para(16, "Kaynakça", "Ana"), para(17, "Yazar, A. (2020). Kitap. Yayınevi.", "N"),
    ],
    sections: [{ locator: "word/document.xml#/w:document[1]/w:body[1]/w:sectPr[1]" }],
    tables: [],
    wordRender: {
      pages: [
        { lines: [{ text: "T.C." }, { text: "ÜNİVERSİTE ADI ENSTİTÜSÜ" }, { text: "TEZ BAŞLIĞI BURAYA YAZILIR" }, { text: "Yüksek Lisans Tezi" }] },
        { lines: [{ text: "HUZURLU ÜNİVERSİTE, KALİTELİ EĞİTİM" }] },
        { lines: [{ text: "T.C." }, { text: "ÜNİVERSİTE ADI ENSTİTÜSÜ" }, { text: "TEZ BAŞLIĞI BURAYA YAZILIR" }, { text: "Yüksek Lisans Tezi" }] },
        { lines: [{ text: "ETİK KURALLARA UYGUNLUK BEYANI" }] },
        { lines: [{ text: "TEŞEKKÜR" }, { text: "Teşekkür metni burada yer alır ve" }] },
        { lines: [{ text: "İÇİNDEKİLER" }, { text: "1. GİRİŞ ........ 5" }, { text: "3. Kaynakça ........ 12" }] },
        { lines: [{ text: "1. GİRİŞ" }, { text: long.slice(0, 60) }, { text: "1.1 Problem Durumu" }] },
        { lines: [{ text: "6. KAYNAKÇA" }, { text: "Yazar, A. (2020). Kitap." }] },
      ],
    },
  };
  const { profile, missing, absent } = suggestProfile(doc, { identity: { id: "x" } });
  assert.deepEqual(missing, []);
  assert.deepEqual(profile.headingParagraphs, [8, 9], "levels 1 and 2 from the table of contents, not from the style names");
  assert.deepEqual(profile.chapterParagraphs, [8, 11]);
  assert.equal(profile.bibliographyParagraph, 17);
  assert.deepEqual(profile.fixedPages.map((f) => [f.id, f.sourcePage]), [["cover", 1], ["inner-cover", 3], ["ethics", 4]]);
  assert.ok(absent.some((a) => /front page 2 is not classified/.test(a)), "a page nobody recognises is reported, not dropped");
  assert.ok(absent.some((a) => /fixed page approval/.test(a)), "an optional page the template does not have is not an error");
  const order = profile.sections.map((s) => s.id);
  assert.ok(order.indexOf("main") < order.indexOf("bibliography"), "the numbered rendered title \"6. KAYNAKÇA\" places the bibliography after the body, not on the contents page");
  assert.equal(profile.sections.find((s) => s.id === "bibliography").titleParagraph, 16, "the contents entry \"3.Kaynakça12\" is not taken for the title");
});

test("a title that starts with a number is not a section title, and an unknown heading shape is not a heading", () => {
  const para = (index, text) => ({ index, locator: `word/document.xml#/w:document[1]/w:body[1]/w:p[${index}]`, text, properties: { pPr: { children: [] } }, runProperties: [] });
  const doc = {
    target: "synthetic-number", styles: [], tables: [], sections: [{ locator: "word/document.xml#/w:document[1]/w:body[1]/w:sectPr[1]" }],
    paragraphs: [para(1, "1. EK"), para(2, "EK"), para(3, "Bir cümle."), para(4, "2. Kullanım")],
    wordRender: { pages: [{ lines: [{ text: "EK" }] }] },
  };
  const { profile } = suggestProfile(doc, { identity: { id: "x" } });
  const appendices = profile.sections.find((s) => s.id === "appendices");
  assert.equal(appendices?.titleParagraph, 2, "\"1. EK\" is a numbered heading, \"EK\" is the title");
});
