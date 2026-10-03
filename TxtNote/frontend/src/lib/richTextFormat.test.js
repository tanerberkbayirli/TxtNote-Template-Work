import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_FORMAT, formatClassName, mergeFormatClassName, parsePartialFormat } from "../config/format.js";

describe("persistent rich-text formatting classes", () => {
  it("round-trips highlight swatches alongside size, color and emphasis", () => {
    const classes = formatClassName({ ...DEFAULT_FORMAT, size: "pt14", color: "blue", highlight: "yellow", bold: true });
    assert.equal(parsePartialFormat(classes).highlight, "yellow");
    assert.equal(parsePartialFormat(classes).color, "blue");
    assert.equal(parsePartialFormat(classes).size, "pt14");
    assert.equal(parsePartialFormat(classes).bold, true);
  });

  it("clears only the previous highlight when the user chooses none", () => {
    const classes = mergeFormatClassName("fmt-size-heading fmt-color-red fmt-highlight-green fmt-bold", { highlight: "none" });
    assert.match(classes, /fmt-size-heading/);
    assert.match(classes, /fmt-color-red/);
    assert.match(classes, /fmt-bold/);
    assert.doesNotMatch(classes, /fmt-highlight-/);
  });
});

import {
  coerceSizeId,
  colorClass,
  customFormatRules,
  normalizeHex,
  normalizePt,
  setSpanFormatTokens,
  sizeClass,
  spanFormatTokens,
  validCustomFormatAttr,
} from "../config/format.js";
import { runStyle } from "./academicExport.js";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { unzipSync, strFromU8 } from "fflate";

/** Minimal element double: no DOM is available in node tests. */
function fakeSpan(attrs = {}, classes = []) {
  const el = {
    nodeType: 1,
    tagName: "SPAN",
    className: classes.join(" "),
    classList: { contains: (name) => classes.includes(name), [Symbol.iterator]: () => classes[Symbol.iterator]() },
    parentElement: null,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    hasAttribute: (name) => name in attrs,
    setAttribute: (name, value) => { attrs[name] = String(value); },
    removeAttribute: (name) => { delete attrs[name]; },
    get outerHTML() { return `<span ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(" ")}></span>`; },
  };
  return el;
}

describe("custom size and colour attributes", () => {
  it("normalises sizes to 0.5 pt within 1-400 and colours to lowercase #rrggbb", () => {
    assert.equal(normalizePt("13.3"), 13.5);
    assert.equal(normalizePt("pt13,5"), 13.5);
    assert.equal(normalizePt(0), 1);
    assert.equal(normalizePt(900), 400);
    assert.equal(normalizePt("abc"), null);
    assert.equal(normalizeHex("#ABC"), "#aabbcc");
    assert.equal(normalizeHex("red"), null);
    assert.equal(coerceSizeId(13.5), "pt13.5");
    assert.equal(coerceSizeId("body"), "body");
    assert.equal(sizeClass("pt12"), "fmt-pt-12");
    assert.equal(sizeClass("pt13.5"), "@pt:13.5");
    assert.equal(colorClass("#C0FFEE"), "@color:#c0ffee");
  });

  it("keeps preset classes and round-trips custom values through the token pipeline", () => {
    const merged = mergeFormatClassName("fmt-pt-12 fmt-color-red fmt-bold", { size: "pt13.5", color: "#336699", highlight: "#ffee00" });
    assert.doesNotMatch(merged, /fmt-pt-|fmt-color-/);
    const parsed = parsePartialFormat(merged);
    assert.deepEqual([parsed.size, parsed.sizePt, parsed.color, parsed.highlight, parsed.bold], ["pt13.5", 13.5, "#336699", "#ffee00", true]);
    const back = mergeFormatClassName(merged, { size: "pt14", color: "blue", highlight: "none" });
    assert.match(back, /fmt-pt-14/);
    assert.doesNotMatch(back, /@/);
    assert.equal(parsePartialFormat("fmt-pt-12").sizePt, 12);
  });

  it("writes data-fmt-* attributes and reads them back; validation rejects anything else", () => {
    const span = fakeSpan();
    setSpanFormatTokens(span, "fmt-bold @pt:13.5 @color:#336699 @bg:#ffee00");
    assert.equal(span.className, "fmt-bold");
    assert.equal(span.getAttribute("data-fmt-pt"), "13.5");
    assert.equal(span.getAttribute("data-fmt-color"), "#336699");
    assert.equal(span.getAttribute("data-fmt-bg"), "#ffee00");
    assert.match(spanFormatTokens(span), /@pt:13\.5/);
    setSpanFormatTokens(span, "fmt-bold");
    assert.equal(span.hasAttribute("data-fmt-pt"), false);
    assert.equal(validCustomFormatAttr("data-fmt-pt", "13.3"), null);
    assert.equal(validCustomFormatAttr("data-fmt-pt", "500"), "400");
    assert.equal(validCustomFormatAttr("data-fmt-color", "red;background:url(x)"), null);
    assert.equal(validCustomFormatAttr("data-fmt-bg", "#12345"), null);
  });

  it("emits attribute-selector rules only for valid values", () => {
    const rules = customFormatRules('<span data-fmt-pt="13.5" data-fmt-color="#AABBCC"></span><span data-fmt-bg="#ffee00"></span><span data-fmt-color="javascript:x"></span>', ".t");
    assert.deepEqual(rules.sort(), [
      '.t [data-fmt-bg="#ffee00"]{background-color:#ffee00}',
      '.t [data-fmt-color="#aabbcc"]{color:#aabbcc}',
      '.t [data-fmt-pt="13.5"]{font-size:13.5pt}',
    ]);
  });

  it("DOCX run carries half-point size, colour hex and shading for custom values", async () => {
    const style = runStyle(fakeSpan({ "data-fmt-pt": "13.5", "data-fmt-color": "#336699", "data-fmt-bg": "#ffee00" }));
    assert.equal(style.size, 27);
    assert.equal(style.color, "336699");
    assert.equal(style.shadingFill, "FFEE00");
    const named = runStyle(fakeSpan({}, ["fmt-color-red", "fmt-pt-14"]));
    assert.equal(named.color, "BE123C");
    assert.equal(named.size, 28);
    const { shadingFill, ...run } = style;
    const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ ...run, text: "x", shading: { fill: shadingFill, type: "clear" } })] })] }] });
    const xml = strFromU8(unzipSync(new Uint8Array(await Packer.toBuffer(doc)))["word/document.xml"]);
    assert.match(xml, /<w:sz w:val="27"\/>/);
    assert.match(xml, /<w:color w:val="336699"\/>/);
    assert.match(xml, /<w:shd [^>]*w:fill="FFEE00"/);
  });

  it("clearing formatting removes custom attributes and preset classes together", () => {
    const span1 = fakeSpan({ "data-fmt-pt": "13.5", "data-fmt-color": "#336699" }, ["fmt-bold"]);
    setSpanFormatTokens(span1, "");
    assert(!span1.hasAttribute("data-fmt-pt"));
    assert(!span1.hasAttribute("data-fmt-color"));
    assert(!span1.className);

    const span2 = fakeSpan({ "data-fmt-bg": "#ffee00" }, ["fmt-italic", "fmt-highlight-yellow"]);
    setSpanFormatTokens(span2, "");
    assert(!span2.hasAttribute("data-fmt-bg"));
    assert.equal(span2.className, "");
  });

  it("links are preserved when clearing formatting", () => {
    const link = { tagName: "A", className: "academic-link", href: "http://example.com", getAttribute: () => null, hasAttribute: () => false, removeAttribute: () => {}, outerHTML: '<a class="academic-link">text</a>' };
    const span = fakeSpan({ "data-fmt-pt": "13.5" }, ["fmt-bold", "academic-link"]);
    setSpanFormatTokens(span, "academic-link");
    assert(!span.hasAttribute("data-fmt-pt"));
    assert(!span.className.includes("fmt-bold"));
    assert(span.className.includes("academic-link"));
  });

  it("alignment classes are preserved when clearing formatting", () => {
    const span = fakeSpan({ "data-fmt-color": "#336699" }, ["fmt-align-center", "fmt-bold"]);
    setSpanFormatTokens(span, "fmt-align-center");
    assert(!span.hasAttribute("data-fmt-color"));
    assert(!span.className.includes("fmt-bold"));
    assert(span.className.includes("fmt-align-center"));
  });
});
