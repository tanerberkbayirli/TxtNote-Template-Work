import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { markerAt, parseTextMarkup, sentenceBreakAt } from "./textMarkup.js";

describe("markerAt", () => {
  it("closes **bold** at the caret", () => {
    const text = "selam **kalın**";
    const hit = markerAt(text, text.length);
    assert.equal(hit.inner, "kalın");
    assert.deepEqual(hit.patch, { bold: true });
  });

  it("closes *italic* at the caret", () => {
    const text = "selam *eğik*";
    const hit = markerAt(text, text.length);
    assert.equal(hit.inner, "eğik");
    assert.deepEqual(hit.patch, { italic: true });
  });

  it("closes _italic_ at the caret", () => {
    const text = "selam _eğik_";
    const hit = markerAt(text, text.length);
    assert.equal(hit.inner, "eğik");
    assert.deepEqual(hit.patch, { italic: true });
  });

  it("closes ~~strike~~ at the caret", () => {
    const text = "selam ~~sil~~";
    const hit = markerAt(text, text.length);
    assert.equal(hit.inner, "sil");
    assert.deepEqual(hit.patch, { strike: true });
  });

  it("does not treat **bold** as italic", () => {
    const text = "**kalın**";
    const hit = markerAt(text, text.length);
    assert.deepEqual(hit.patch, { bold: true });
  });
});

describe("parseTextMarkup", () => {
  it("turns wrapping markers into format spans", () => {
    const html = parseTextMarkup("**kalın** *italik* ~~çizili~~");
    assert.match(html, /fmt-bold/);
    assert.match(html, /fmt-italic/);
    assert.match(html, /fmt-strike/);
  });

  it("turns two spaces into a sentence break", () => {
    assert.equal(sentenceBreakAt("Merhaba  ", 9)?.text, "Merhaba. ");
  });

  it("does not turn markup characters into raw HTML", () => {
    const html = parseTextMarkup("<script>alert(1)</script>");
    assert.equal(html.includes("<script>"), false);
    assert.match(html, /&lt;script&gt;/);
  });

  it("ignores a sentence break at the start of a line", () => {
    assert.equal(sentenceBreakAt("  merhaba", 2), null);
  });

  it("turns ##math## into a formula wrapper before other markup", () => {
    const html = parseTextMarkup("**kalın** ##math##E=mc^2##math##");
    assert.match(html, /fmt-bold/);
    assert.match(html, /math-formula--block/);
    assert.match(html, /data-latex="E=mc\^2"/);
    assert.match(html, /\u200B$/);
  });

  it("leaves a lone $100 as ordinary text", () => {
    const html = parseTextMarkup("fiyat $100");
    assert.equal(html.includes("math-formula"), false);
    assert.match(html, /fiyat \$100/);
  });

  it("turns $$ and \\begin{align} into formula wrappers", () => {
    const dollars = parseTextMarkup("önce $$E=mc^2$$ sonra");
    assert.match(dollars, /math-formula--block/);
    assert.match(dollars, /data-latex="E=mc\^2"/);

    const align = parseTextMarkup("\\begin{align} x &= 1 \\\\ y &= 2 \\end{align}");
    assert.match(align, /math-formula--block/);
    assert.match(align, /\\begin\{align\}/);
  });

  it("turns a ##code## snippet into a code block", () => {
    const html = parseTextMarkup("##code##\nconst x = 1;\n##code##");
    assert.match(html, /class="code-block"/);
    assert.match(html, /data-language="auto"/);
    assert.match(html, /data-code="const x = 1;"/);
  });

  it("keeps academic code as a plain listing", () => {
    const html = parseTextMarkup("##code##\nconst x = 1;\n##code##", { plainCode: true });
    assert.match(html, /class="academic-code"/);
    assert.match(html, /const x = 1;/);
    assert.equal(html.includes("code-block"), false);
  });
});
