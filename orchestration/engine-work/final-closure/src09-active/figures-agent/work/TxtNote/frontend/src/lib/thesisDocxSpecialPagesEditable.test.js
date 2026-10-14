import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";
import { resolveThesisTemplate } from "../thesis/registry.js";

const spec = (name) => JSON.parse(readFileSync(new URL(`../../../../orchestration/specs/${name}`, import.meta.url), "utf8"));
const firstPages = async (name, title) => {
  const d = spec(name);
  const thesis = { ...d.researchData.thesis, values: { ...d.researchData.thesis.values, THESIS_TITLE: title } };
  const { template } = await resolveThesisTemplate({ templateId: thesis.templateId });
  const model = compileThesisDocument(template, thesis, title, d.content, []);
  const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()))["word/document.xml"]);
  const body = xml.slice(xml.indexOf("<w:body>"));
  return body.slice(0, body.indexOf("<w:sectPr", body.indexOf("<w:sectPr") + 10));
};

describe("DOCX special pages stay editable Word text", () => {
  it("preserves source cover gaps with measured room and reserves Word rounding room only at the page edge", async () => {
    const fixture = spec("aku-felsefe-lisans.fixture.json");
    const thesis = fixture.researchData.thesis;
    const { template } = await resolveThesisTemplate({ templateId: thesis.templateId });
    const model = compileThesisDocument(template, thesis, fixture.title, fixture.content, []);
    const cover = model.sections.find(section => section.specialPage && section.layout?.some(node => node.type === "spacer"));
    const page = cover.rules.page;
    const capacity = page.heightMm - page.margins.topMm - page.margins.bottomMm;
    const read = async contentMm => {
      const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, { elasticContentMm: contentMm === undefined ? {} : { [cover.id]: contentMm } })).arrayBuffer()))["word/document.xml"]);
      const section = xml.slice(xml.indexOf("<w:body>"), xml.indexOf("</w:sectPr>"));
      return [...section.matchAll(/w:line="(\d+)" w:lineRule="exact"/g)].map(match => Number(match[1]));
    };
    const authored = await read();
    assert.deepEqual(await read(capacity - 30), authored, "a fitting cover keeps every authored gap");
    const edge = await read(capacity);
    assert.equal(authored.reduce((sum,value)=>sum+value,0) - edge.reduce((sum,value)=>sum+value,0), Math.round(1.5 * 1440 / 25.4), "only the existing Word line-rounding allowance is reserved at a measured full page");
  });
  it("projects a measured impossible fixed-height frame to the same editable content area without clipping", async () => {
    const fixture = spec("aku-fbe.fixture.master.json");
    const { template } = await resolveThesisTemplate({ templateId: fixture.researchData.thesis.templateId });
    const model = compileThesisDocument(template, fixture.researchData.thesis, "T", fixture.content, []);
    const cover = model.sections.find(section => Number.isFinite(section.rules.page.docxContentFrame?.heightMm));
    const original = structuredClone(cover.rules.page);
    const read = async options => strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, options)).arrayBuffer()))["word/document.xml"]);
    const source = await read({});
    const overflow = await read({ specialPagePositions: { [`${cover.id}:~flow`]: { overflow: true } } });
    const section = xml => xml.slice(xml.indexOf("<w:body>"), xml.indexOf("</w:sectPr>"));
    assert.match(section(source), /<wps:txbx>/, "fitting source frame stays a Word text box");
    assert.doesNotMatch(section(overflow), /<wps:txbx>/, "long content remains in splittable Word paragraphs");
    const margin = Math.round(original.margins.topMm * 1440 / 25.4);
    assert.ok(section(overflow).includes(`w:top="${margin}"`), "original frame y is preserved as the continuation-page content top");
    assert.match(section(overflow), /YÜKSEK LİSANS TEZİ/);
    assert.match(section(overflow), /Danışman/);
    assert.deepEqual(cover.rules.page, original, "export never mutates the source page");
  });
  it("exports measured downward anchor shifts without mutating the saved layout", async () => {
    const fixture = spec("adu-ziraat-lisans.fixture.json");
    const thesis = fixture.researchData.thesis;
    const { template } = await resolveThesisTemplate({ templateId: thesis.templateId });
    const model = compileThesisDocument(template, thesis, "T", fixture.content, []);
    const cover = model.sections.find((section) => section.layout?.some((node) => node.layoutMode === "absolute" && node.type === "text"));
    const anchor = cover.layout.find((node) => node.layoutMode === "absolute" && node.type === "text");
    const original = structuredClone(anchor);
    const specialPagePositions = { [`${cover.id}:${anchor.path}`]: { shiftMm: 5, heightMm: 20 } };
    const xml = strFromU8(unzipSync(new Uint8Array(await (await buildThesisDocx(model, { specialPagePositions })).arrayBuffer()))["word/document.xml"]);
    assert.ok(xml.includes(`<wp:posOffset>${Math.round((anchor.yMm + 5) * 36000)}</wp:posOffset>`));
    assert.ok(xml.includes('cy="720000"'), "measured textbox height remains editable without clipping");
    assert.deepEqual(anchor, original);
  });
  for (const name of ["aku-sagbil.fixture.master.json", "aku-sbe.fixture.json", "adu-ziraat-lisans.fixture.json"]) {
    it(`${name}: cover texts are plain w:t runs (positioned ones in real wps text boxes), no VML/fields/content controls/exact-height rows`, async () => {
      const title = "Uzun başlık sözcükleri ".repeat(11).trim().slice(0, 250);
      const xml = await firstPages(name, title);
      assert.ok(xml.toLocaleLowerCase("tr").includes(title.slice(0, 30).toLocaleLowerCase("tr")), "title is a real text run");
      assert.doesNotMatch(xml, /<w:pict|<w:fldChar|<w:sdt>/);
      assert.doesNotMatch(xml, /<w:trHeight[^>]*w:hRule="exact"/);
    });
  }
});
