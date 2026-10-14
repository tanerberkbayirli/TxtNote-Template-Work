import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  looksLikeLatex,
  mathBlockHtml,
  mathMarkerAt,
  mathOpenAt,
  splitMathSegments,
} from "./mathFormula.js";

describe("looksLikeLatex", () => {
  it("accepts commands, superscripts and simple equations", () => {
    assert.equal(looksLikeLatex("\\frac{1}{2}"), true);
    assert.equal(looksLikeLatex("x^2"), true);
    assert.equal(looksLikeLatex("E=mc^2"), true);
  });

  it("rejects ordinary currency-like text", () => {
    assert.equal(looksLikeLatex("100"), false);
    assert.equal(looksLikeLatex("hello"), false);
  });
});

describe("splitMathSegments", () => {
  it("keeps plain text as a single run", () => {
    assert.deepEqual(splitMathSegments("sadece yazı"), [{ type: "text", text: "sadece yazı" }]);
  });

  it("extracts ##math## display math", () => {
    const parts = splitMathSegments("önce ##math##E=mc^2##math## sonra");
    assert.deepEqual(parts, [
      { type: "text", text: "önce " },
      { type: "math", latex: "E=mc^2", display: true },
      { type: "text", text: " sonra" },
    ]);
  });

  it("extracts the gaussian formula from a note", () => {
    const latex =
      "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x - \\mu}{\\sigma}\\right)^2}";
    const parts = splitMathSegments(`##math##\n${latex}\n##math##`);
    assert.equal(parts.length, 1);
    assert.equal(parts[0].type, "math");
    assert.equal(parts[0].display, true);
    assert.equal(parts[0].latex, latex);
  });

  it("still accepts pasted $$ display math", () => {
    const parts = splitMathSegments("önce $$E=mc^2$$ sonra");
    assert.deepEqual(parts, [
      { type: "text", text: "önce " },
      { type: "math", latex: "E=mc^2", display: true },
      { type: "text", text: " sonra" },
    ]);
  });

  it("does not treat a lone $100 as math", () => {
    const parts = splitMathSegments("fiyat $100 oldu");
    assert.deepEqual(parts, [{ type: "text", text: "fiyat $100 oldu" }]);
  });

  it("converts inline $x^2$ when it looks like latex", () => {
    const parts = splitMathSegments("alan $x^2$");
    assert.deepEqual(parts, [
      { type: "text", text: "alan " },
      { type: "math", latex: "x^2", display: false },
    ]);
  });

  it("extracts \\[ \\] display math", () => {
    const parts = splitMathSegments("önce \\[E=mc^2\\] sonra");
    assert.deepEqual(parts, [
      { type: "text", text: "önce " },
      { type: "math", latex: "E=mc^2", display: true },
      { type: "text", text: " sonra" },
    ]);
  });

  it("extracts \\( \\) inline math when it looks like latex", () => {
    const parts = splitMathSegments("alan \\(x^2\\)");
    assert.deepEqual(parts, [
      { type: "text", text: "alan " },
      { type: "math", latex: "x^2", display: false },
    ]);
  });

  it("keeps begin/end delimiters for align", () => {
    const src = "\\begin{align} x &= 1 \\\\ y &= 2 \\end{align}";
    const parts = splitMathSegments(`önce ${src} sonra`);
    assert.equal(parts[1].type, "math");
    assert.equal(parts[1].display, true);
    assert.equal(parts[1].latex, src);
  });

  it("extracts nested matrix inside align as one block", () => {
    const src =
      "\\begin{align} A &= \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\end{align}";
    const parts = splitMathSegments(src);
    assert.equal(parts.length, 1);
    assert.equal(parts[0].type, "math");
    assert.equal(parts[0].latex, src);
  });

  it("extracts a standalone pmatrix as display math", () => {
    const src = "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}";
    const parts = splitMathSegments(src);
    assert.equal(parts[0].type, "math");
    assert.equal(parts[0].display, true);
    assert.equal(parts[0].latex, src);
  });

  it("extracts \\ce chemistry as inline math", () => {
    const parts = splitMathSegments("su \\ce{H2O} içerir");
    assert.deepEqual(parts, [
      { type: "text", text: "su " },
      { type: "math", latex: "\\ce{H2O}", display: false },
      { type: "text", text: " içerir" },
    ]);
  });

  it("extracts multiline $$ display math", () => {
    const parts = splitMathSegments("$$\\frac{1}{2}$$");
    assert.equal(parts[0].type, "math");
    assert.equal(parts[0].latex, "\\frac{1}{2}");
    assert.equal(parts[0].display, true);
  });

  it("does not treat an escaped dollar as math", () => {
    const parts = splitMathSegments("fiyat \\$100");
    assert.deepEqual(parts, [{ type: "text", text: "fiyat \\$100" }]);
  });

  it("splits two $$ formulas with text between them", () => {
    const parts = splitMathSegments("$$a$$ ve $$b$$");
    assert.equal(parts.map((p) => p.type).join(","), "math,text,math");
    assert.equal(parts[0].latex, "a");
    assert.equal(parts[2].latex, "b");
  });
});

describe("mathOpenAt", () => {
  it("matches ##math## at the caret", () => {
    const text = "bak ##math##";
    const hit = mathOpenAt(text, text.length);
    assert.equal(hit.start, 4);
    assert.equal(hit.end, text.length);
  });

  it("ignores a half-typed opener", () => {
    assert.equal(mathOpenAt("##mat", 5), null);
  });

  it("matches $$ at the caret", () => {
    const text = "bak $$";
    const hit = mathOpenAt(text, text.length);
    assert.equal(hit.start, 4);
    assert.equal(hit.end, text.length);
  });

  it("does not treat a closed $$ pair as an opener", () => {
    const text = "$$E=mc^2$$";
    assert.equal(mathOpenAt(text, text.length), null);
  });
});

describe("mathMarkerAt", () => {
  it("closes ##math## at the caret", () => {
    const text = "bak ##math##a^2+b^2=c^2##math##";
    const hit = mathMarkerAt(text, text.length);
    assert.equal(hit.latex, "a^2+b^2=c^2");
    assert.equal(hit.display, true);
    assert.equal(hit.start, 4);
    assert.equal(hit.end, text.length);
  });

  it("does not close a half-finished ##math## pair", () => {
    const text = "##math##henüz bitmedi";
    assert.equal(mathMarkerAt(text, text.length), null);
  });

  it("ignores an empty ##math## pair", () => {
    assert.equal(mathMarkerAt("##math####math##", 16), null);
  });

  it("closes $$ at the caret", () => {
    const text = "bak $$a^2+b^2=c^2$$";
    const hit = mathMarkerAt(text, text.length);
    assert.equal(hit.latex, "a^2+b^2=c^2");
    assert.equal(hit.display, true);
    assert.equal(hit.start, 4);
    assert.equal(hit.end, text.length);
  });

  it("closes a begin/end environment at the caret", () => {
    const text = "\\begin{equation} E=mc^2 \\end{equation}";
    const hit = mathMarkerAt(text, text.length);
    assert.equal(hit.display, true);
    assert.match(hit.latex, /\\begin\{equation\}/);
  });
});

describe("mathBlockHtml", () => {
  it("escapes quotes in the latex attribute", () => {
    const html = mathBlockHtml('f("x")', true);
    assert.match(html, /data-latex="f\(&quot;x&quot;\)"/);
    assert.match(html, /<span class="math-formula math-formula--block"/);
    assert.match(html, /data-display="block"/);
  });
});

describe("katex coverage", () => {
  it("renders environments, macros, chemistry and display math", async () => {
    const katex = (await import("katex")).default;
    await import("katex/contrib/mhchem");
    const macros = {
      "\\N": "\\mathbb{N}",
      "\\R": "\\mathbb{R}",
      "\\abs": "\\left|#1\\right|",
    };
    const display = { throwOnError: true, displayMode: true, macros };
    const inline = { throwOnError: true, displayMode: false, macros };

    katex.renderToString("E=mc^2", display);
    katex.renderToString("\\frac{1}{2}", inline);
    katex.renderToString("\\begin{align} x &= 1 \\\\ y &= 2 \\end{align}", display);
    katex.renderToString("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", display);
    katex.renderToString("\\begin{cases} 1 & x>0 \\\\ 0 & x\\le 0 \\end{cases}", display);
    katex.renderToString("\\begin{gather} a+b=c \\\\ d+e=f \\end{gather}", display);
    katex.renderToString("\\begin{CD} A @>>> B \\\\ @VVV @AAA \\\\ C @= D \\end{CD}", display);
    katex.renderToString("\\ce{H2O + CO2 -> H2CO3}", inline);
    katex.renderToString("x \\in \\R", inline);
    katex.renderToString("\\abs{x}", inline);
    katex.renderToString("\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}", display);
    katex.renderToString("\\int_{a}^{b} f(x)\\,dx = F(b)-F(a)", display);
    katex.renderToString("\\sqrt{a^2+b^2}", inline);
    katex.renderToString("\\begin{array}{cc} 1 & 2 \\\\ 3 & 4 \\end{array}", display);
  });
});
