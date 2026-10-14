import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import generic from "../thesis/templates/generic.js";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx } from "../thesis/export.js";

const headingTexts = (xml) => (xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || []).flatMap((paragraph) => {
  const style = /<w:pStyle w:val="ThesisHeading([1-6])Index"/.exec(paragraph);
  return style ? [[style[1], [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((t) => t[1]).join("")]] : [];
});

describe("DOCX heading numbers (07-D)", () => {
  it("writes the editor's heading labels as Word text so Word shows the same numbers", async () => {
    const html = "<h1>Giriş</h1><p>a</p><h2>Amaç</h2><p>b</p><h2>Kapsam</h2><h3>Alt</h3><h1>Yöntem</h1><h2>Veri</h2>";
    const model = compileThesisDocument(generic, {}, "Tez", html);
    const files = unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
    const texts = headingTexts(strFromU8(files["word/document.xml"]));
    const expected = ["1 Giriş", "1.1 Amaç", "1.2 Kapsam", "1.2.1 Alt", "2 Yöntem", "2.1 Veri"];
    const headings = texts.filter(([, value]) => !/	/.test(value));
    for (const text of expected) assert.ok(headings.some(([, value]) => value === text), `${text} missing in ${JSON.stringify(texts)}`);
  });
});
