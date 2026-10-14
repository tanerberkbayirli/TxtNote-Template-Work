import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mcbuMaster } from "../../../../engine/src/templates/mcbu.js";
import { buildThesisCss, compileThesisDocument } from "../../../../engine/src/engine.js";
import { validateThesisTemplate } from "../../../../engine/src/validation.js";
import { resolveSpecialPage, specialPageBoxCss } from "../../../../engine/src/specialPages.js";

const values = { YEAR: "2026", STUDENT_NAME: "Ad SOYAD", DEPARTMENT_NAME: "Eğitim Bilimleri", ADVISOR_TITLE: "Doç. Dr.", ADVISOR_NAME: "Ali VELİ", KEYWORDS: "a, b, c, d, e" };
const compile = () => compileThesisDocument(mcbuMaster, { values }, "Başlık", "<h1>Bölüm</h1><h2>A</h2><h3>B</h3><h4>C</h4>", []);
const section = (model, id) => model.sections.find((item) => item.id === id);
const TW = 25.4 / 1440;
const near = (actual, expected, tolerance = 0.01) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} vs ${expected}`);
const flat = (nodes) => nodes.flatMap((node) => node.type === "group" ? flat(node.blocks) : [node]);

describe("MCBÜ LEE fix 2: official example XML decisions", () => {
  it("template validates", () => assert.deepEqual(validateThesisTemplate(mcbuMaster), []));

  it("C3/C4: cover lines G[1]–G[31] indent 567 tw, gaps are the example's empty paragraphs, no leading blank", () => {
    const layout = section(compile(), "inner-cover").layout;
    assert.equal(layout[0].type, "group", "no leading blank line for the red label G[0]");
    const inner = layout[0].blocks;
    const texts = flat(layout).filter((node) => node.type === "text");
    assert.equal(texts.at(-1).text, "Manisa–2026");
    assert.ok(texts.slice(0, -1).every((node) => Math.abs(node.style.leftIndentMm - 567 * TW) < 1e-6), "T.C. … advisor");
    assert.ok(!(texts.at(-1).style.leftIndentMm > 0), "city line G[40] has no indent");
    assert.ok(inner.find((node) => node.type === "image").leftIndentMm > 9.99, "logo is centred in the same indented box");
    const pt = (node) => Math.round(node.heightMm * 72 / 25.4 * 100) / 100;
    assert.deepEqual(flat(layout).filter((node) => node.type === "spacer").map(pt), [16.1, 13.8, 96.6, 80.5, 69, 110.4]);
  });

  it("C2: ÖZET and ABSTRACT bodies as the two example paragraphs show", () => {
    const model = compile();
    const tr = section(model, "abstract").rules.body;
    assert.deepEqual([tr.lineHeight, tr.align, tr.spaceAfterPt], [1.5, "justify", 10]);
    near(tr.firstLineIndentMm, 12.5); near(tr.leftIndentMm, 0);
    const en = section(model, "abstract-en").rules.body;
    assert.deepEqual([en.lineHeight, en.align, en.spaceAfterPt, en.leftIndentMm], [1.5, "justify", 0, 0]);
    near(en.firstLineIndentMm, 709 * TW);
  });

  it("C1/C6: TOC chapter rows are the example's centred two-line rows, sub-entries indented by typed spaces", () => {
    const toc = section(compile(), "toc").generatedIndex.levelStyles;
    assert.deepEqual([toc[1].align, toc[1].includePageNumber, toc[1].lineHeight], ["center", false, 1.5]);
    assert.deepEqual([toc[2].leftIndentMm, toc[2].lineHeight], [0, 1.5]);
    near(toc[3].leftIndentMm, 7.41, 0.01); near(toc[4].leftIndentMm, 17.99, 0.01);
    assert.deepEqual([toc.unnumbered.lineHeight, toc.unnumbered.includePageNumber, toc.unnumbered.align], [1, true, "left"]);
    const model = compile();
    assert.equal(model.headings[0].label, "BİRİNCİ BÖLÜM");
    assert.equal(model.headings[0].labelLine, true);
    assert.deepEqual(model.headings.slice(1).map((heading) => heading.label), ["1.1.", "1.1.1.", "1.1.1.1."]);
  });

  it("engine: a TOC level row may carry its own lineHeight (editor/PDF CSS), without double Word-baseline offsets", () => {
    const css = buildThesisCss(compile());
    const row = css.split("\n").find((line) => line.includes('li[data-index-level="3"]') && line.includes('data-thesis-flow-section="toc"'));
    assert.match(row, /line-height:1\.725;/);
    assert.match(row, /top:calc\(-1 \* var\(--thesis-wb-[^)]*\) \+ var\(--thesis-wb-/);
  });

  it("engine: an image inside an indented group is centred in the indented box", () => {
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMr8AAAAASUVORK5CYII=";
    const [group] = resolveSpecialPage([{ type: "group", style: { leftIndentMm: 10 }, blocks: [{ type: "image", source: png, widthMm: 20, heightMm: 20 }] }]).blocks;
    const image = group.blocks[0];
    assert.deepEqual([image.leftIndentMm, image.rightIndentMm], [10, 0]);
    assert.match(specialPageBoxCss(image, group), /position:relative;left:5mm;/);
    const plain = resolveSpecialPage([{ type: "image", source: png, widthMm: 20, heightMm: 20 }]);
    assert.doesNotMatch(specialPageBoxCss(plain.blocks[0], null), /position:relative/);
  });
});
