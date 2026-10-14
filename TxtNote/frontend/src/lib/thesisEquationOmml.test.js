import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { akuFbeMaster } from "../../../../engine/src/templates/aku-fbe.js";

const values = { STUDENT_NAME: "Ada YILMAZ", ADVISOR_TITLE: "Prof. Dr.", ADVISOR_NAME: "Can KAYA", DEPARTMENT_NAME: "Biyoloji", YEAR: "2026", DEFENSE_YEAR: "2026", DEFENSE_MONTH: "Ocak", KEYWORDS: "a, b, c, d" };

async function equationParagraph(latex, template = akuFbeMaster) {
  const html = `<h1>Örnek</h1><span class="math-formula math-formula--block" data-display="block" data-latex="${latex}" data-eq-numbered="true"></span>`;
  const model = compileThesisDocument(template, { values }, "OMML testi", html);
  const bytes = new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer());
  const files = unzipSync(bytes);
  const xml = strFromU8(files["word/document.xml"]);
  const paragraphs = [...xml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)].map((match) => match[0]);
  const paragraph = paragraphs.find((value) => value.includes("<m:oMath>"));
  assert.ok(paragraph, "packed DOCX contains an equation paragraph");
  return { bytes, files, paragraph };
}

describe("thesis DOCX native equation export", () => {
  it("round-trips the official AKÜ FBE E=m∙c² example as sized Cambria Math OMML and retains its centered number tabs", async () => {
    // The guide's p. 9 §2.10 example is E=m∙c²; the caret encodes its visible superscript as OMML.
    const { bytes, files, paragraph } = await equationParagraph("E=m∙c^2");
    assert.equal(Buffer.from(bytes.subarray(0, 2)).toString(), "PK", "export is a packed DOCX archive");
    assert.ok(files["word/document.xml"]);
    assert.match(paragraph, /<m:oMath>[\s\S]*<m:sSup>[\s\S]*<m:t>2<\/m:t>[\s\S]*<\/m:sSup>[\s\S]*<\/m:oMath>/);
    assert.match(paragraph, /<m:t>∙<\/m:t>/, "the source's multiplication dot is preserved");
    assert.match(paragraph, /<m:r><w:rPr><w:rFonts[^>]*w:ascii="Cambria Math"[^>]*\/><w:sz w:val="24"\/><w:szCs w:val="24"\/><\/w:rPr><m:t>/);
    assert.match(paragraph, /<w:tab w:val="center"/);
    assert.match(paragraph, /<w:tab w:val="right"/);
    assert.match(paragraph, /<w:tab\/>[\s\S]*<m:oMath>[\s\S]*<w:tab\/>[\s\S]*\(\d+\.\d+\)/, "formula stays between the centered and right-aligned equation-number tabs");
    assert.doesNotMatch(paragraph, /E=mc²/, "the formula is represented by OMML rather than a duplicate plain-text fallback");
  });

  it("exports the deterministic fixture equation as native OMML, and marks unsupported commands visibly", async () => {
    // Matches the existing AKÜ master fixture equation (E = mc^2).
    const { paragraph } = await equationParagraph("E = mc^2");
    assert.match(paragraph, /<m:oMath>[\s\S]*<m:sSup>[\s\S]*<m:t>2<\/m:t>[\s\S]*<\/m:sSup>[\s\S]*<\/m:oMath>/);
    assert.match(paragraph, /w:ascii="Cambria Math"/);
    assert.match(paragraph, /w:sz w:val="24"/);

    const unsupported = await equationParagraph("x+\\mystery{y}");
    assert.match(unsupported.paragraph, /\[unsupported: \\mystery\]/);
    assert.match(unsupported.paragraph, /<m:t>y<\/m:t>/, "the unrecognized command's argument remains visible");

    const unsupportedEnvironment = await equationParagraph("\\begin{align}x&=y\\end{align}");
    assert.match(unsupportedEnvironment.paragraph, /\[unsupported LaTeX: \\begin\{align\}x&amp;=y\\end\{align\}\]/);
  });

  it("strict thesis mode marks known flattened constructs instead of emitting semantically changed OMML", async () => {
    const unsupported = [
      ["\\begin{matrix}a&b\\\\c&d\\end{matrix}", "[unsupported LaTeX: \\begin{matrix}"],
      ["\\begin{aligned}x=y\\end{aligned}", "[unsupported LaTeX: \\begin{aligned}"],
      ["\\begin{cases}x\\end{cases}", "[unsupported LaTeX: \\begin{cases}"],
      ["\\binom{n}{k}", "[unsupported: \\binom]"],
      ["\\hat{x}", "[unsupported: \\hat]"],
      ["\\overline{x}", "[unsupported: \\overline]"],
      ["\\text{kg}", "[unsupported: \\text]"],
      ["\\mathbf{x}", "[unsupported: \\mathbf]"],
      ["\\mathrm{d}", "[unsupported: \\mathrm]"],
      ["\\operatorname{rank}", "[unsupported: \\operatorname]"],
    ];
    for (const [latex, marker] of unsupported) {
      const { paragraph } = await equationParagraph(latex);
      assert.ok(paragraph.includes(marker), `${latex} must visibly identify unsupported syntax`);
    }
  });

  it("takes OMML font and size from the template instead of embedding AKÜ typography in the engine", async () => {
    const template = structuredClone(akuFbeMaster);
    template.equations.style = { ...template.equations.style, fontFamily: "Example Math Font", fontSizePt: 13 };
    const { paragraph } = await equationParagraph("x^2", template);
    assert.match(paragraph, /w:ascii="Example Math Font"/);
    assert.match(paragraph, /w:sz w:val="26"/);
    assert.doesNotMatch(paragraph, /Cambria Math/);
  });
});
