import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unzipSync, strFromU8 } from "fflate";
import { mcbuMaster, mcbuPhd } from "../../../../engine/src/templates/mcbu.js";
import { mcbuTipUzmanlik } from "../../../../engine/src/templates/mcbu-tip.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";

const base = { YEAR: "2026", STUDENT_NAME: "Ad SOYAD", DEPARTMENT_NAME: "Eğitim Bilimleri", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "Ali VELİ", KEYWORDS: "a, b, c, d, e" };
const texts = (nodes) => nodes.flatMap((node) => node.type === "group" ? texts(node.blocks) : node.type === "text" ? [node.text] : []);
const coverText = (template, program) => {
  const model = compileThesisDocument(template, { values: { ...base, PROGRAM_NAME: program } }, "Başlık", "<h1>Bölüm</h1>", []);
  return texts(model.sections.find((item) => item.id === "inner-cover").layout).join("|");
};

describe("MCBÜ fix 3: found-in-testing bugs", () => {
  it("templates still validate", () => {
    assert.deepEqual(validateThesisTemplate(mcbuMaster), []);
    assert.deepEqual(validateThesisTemplate(mcbuPhd), []);
    assert.deepEqual(validateThesisTemplate(mcbuTipUzmanlik), []);
  });

  it("program name that already ends in 'Programı' does not get a second PROGRAMI", () => {
    assert.match(coverText(mcbuMaster, "Fizik"), /Fizik PROGRAMI/);
    const long = coverText(mcbuMaster, "Yazılım Programı");
    assert.match(long, /Yazılım Programı\|/);
    assert.doesNotMatch(long, /PROGRAMI PROGRAMI/);
    assert.doesNotMatch(coverText(mcbuMaster, "Yazılım Program"), /PROGRAM PROGRAMI/);
  });

  it("Tıp reference list is numbered in order and never double-numbered", () => {
    const html = (items) => compileThesisDocument(mcbuTipUzmanlik, { values: {} }, "T", "<h1>Giriş</h1>", items).sections.find((s) => s.type === "bibliography").html;
    const out = html(["Kaya B. Kitap. 2020.", "2. Yılmaz A. Makale. 2021."]);
    assert.match(out, /<li[^>]*>1\. Kaya B\./);
    assert.match(out, /<li[^>]*>2\. Yılmaz A\./);
    assert.doesNotMatch(out, /2\. 2\./);
    // Other templates stay unnumbered.
    assert.doesNotMatch(compileThesisDocument(mcbuMaster, { values: {} }, "T", "<h1>G</h1>", ["Kaya B. Kitap."]).sections.find((s) => s.type === "bibliography").html, /<li[^>]*>1\. /);
  });

  it("Doktora: an excluded heading with a different size gets its own Word style, not the shared one", async () => {
    const model = compileThesisDocument(mcbuPhd, { values: { ...base, PROGRAM_NAME: "Fizik" }, enabledSections: undefined }, "T", "<h1>G</h1><p>x</p>", ["Kaya B. Kitap."]);
    const zip = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const styles = strFromU8(zip["word/styles.xml"]);
    const sizes = [...styles.matchAll(/<w:style [^>]*w:styleId="(ThesisHeading1Excluded\w*)"[\s\S]*?<\/w:style>/g)].map((m) => [m[1], (m[0].match(/<w:sz w:val="(\d+)"/) || [])[1]]);
    // Each style id carries exactly one size, and a 12 pt heading is never rendered through a 14 pt style.
    const bySize = new Map();
    for (const [id, size] of sizes) { assert.ok(!bySize.has(id), `duplicate style ${id}`); bySize.set(id, size); }
    assert.equal(bySize.get("ThesisHeading1Excluded"), "24");
  });
});
