import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { compileThesisDocument } from "../thesis/engine.js";
import { buildThesisDocx, buildThesisPdf } from "../thesis/export.js";
import { convertLength, mmToTwip, ptToTwip } from "../thesis/units.js";
import generic from "../thesis/templates/generic.js";

const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==";

function compiledLayoutModel() {
  const template = structuredClone(generic);
  template.page.margins = { topMm: 25, bottomMm: 25, leftMm: 30, rightMm: 35 };
  template.page.header = { heightMm: 8, distanceMm: 13, content: "Header fidelity", firstPage: "same" };
  template.page.footer = { heightMm: 8, distanceMm: 17, content: "Footer fidelity", firstPage: "same" };
  template.typography.lineSpacing = { mode: "word", singleLineEm: 1.15 };
  template.sections[0].blocks = [
    { type: "group", direction: "row", blocks: [
      { type: "text", value: "Flow cell" },
      { type: "text", value: "Template title" },
    ] },
    { type: "image", source: pixel, widthMm: 30, heightMm: 20, align: "left" },
    { type: "separator", thicknessPt: 1, widthPercent: 80, align: "left" },
  ];
  const layout = {
    version: 1,
    elements: {
      "cover:block:0.1": {
        layoutMode: "absolute", xMm: 40.25, yMm: 42, widthMm: 140, heightMm: 20,
        content: "Canonical editable text",
        style: {
          fontFamily: "Times New Roman", fontSizePt: 12, fontWeight: 700, italic: true,
          decoration: "underline", color: "#123456", lineHeight: 1.5, spaceAfterPt: 6,
          firstLineIndentMm: 3, leftIndentMm: 2, rightIndentMm: 1, align: "left",
        },
      },
      "cover:block:1": { layoutMode: "absolute", xMm: 25, yMm: 50, widthMm: 30, heightMm: 20 },
      "cover:block:2": { layoutMode: "absolute", xMm: 10, yMm: 90, widthMm: 50, heightMm: 0.5 },
    },
    additions: [], guides: [],
    page: { margins: { bottomMm: 25, leftMm: 30 }, header: { distanceMm: 13 }, footer: { distanceMm: 17 } },
    sections: {}, pages: {},
  };
  return compileThesisDocument(template, {
    values: { UNIVERSITY_NAME: "Test University", STUDENT_NAME: "Ada", YEAR: "2026" },
    layout,
  }, "Test Thesis", "<h1>Heading Alpha</h1><h4>Heading Delta</h4><p>Ordinary content survives layout filtering.</p><table><tr><th>Col A</th><th>Col B</th></tr><tr><td>One</td><td>Two</td></tr></table>");
}

const unzippedDocx = async (model) => unzipSync(new Uint8Array(await (await buildThesisDocx(model)).arrayBuffer()));
const xmlEntry = (files, key) => strFromU8(files[key]);
const occurrences = (source, value) => source.split(value).length - 1;

describe("positioned thesis layout export", () => {
  it("writes editable page-anchored text, image and line nodes with exact OOXML geometry and style", async () => {
    const model = compiledLayoutModel();
    const cover = model.sections.find((section) => section.id === "cover");
    assert.equal(cover.layout.find((node) => node.type === "group").blocks.find((node) => node.id === "cover:block:0.1").text, "Canonical editable text");
    assert.deepEqual(
      [cover.layout.find((node) => node.type === "group").blocks.find((node) => node.id === "cover:block:0.1").xMm, cover.layout.find((node) => node.type === "group").blocks.find((node) => node.id === "cover:block:0.1").yMm],
      [40.25, 42],
    );

    const files = await unzippedDocx(model);
    const documentXml = xmlEntry(files, "word/document.xml");
    const headerXml = xmlEntry(files, Object.keys(files).find((key) => /^word\/header\d+\.xml$/.test(key)));
    const footerXml = xmlEntry(files, Object.keys(files).find((key) => /^word\/footer\d+\.xml$/.test(key)));

    assert.match(documentXml, /<wps:cNvSpPr txBox="1"\s*\/>/, "text remains editable in a DrawingML text box");
    assert.match(documentXml, /w:ascii="Times New Roman"/);
    assert.match(documentXml, /w:sz w:val="24"/);
    assert.match(documentXml, /<w:b\s*\/>/);
    assert.match(documentXml, /<w:i\s*\/>/);
    assert.match(documentXml, /<w:u w:val="single"\s*\/>/);
    assert.match(documentXml, /<w:color w:val="123456"\s*\/>/);
    assert.match(documentXml, /<w:spacing[^>]*w:after="120"[^>]*w:line="360"[^>]*w:lineRule="auto"/);
    assert.match(documentXml, new RegExp(`w:firstLine="${mmToTwip(3)}"`));
    assert.match(documentXml, new RegExp(`w:left="${mmToTwip(2)}"`));
    assert.match(documentXml, new RegExp(`w:right="${mmToTwip(1)}"`));

    assert.match(documentXml, new RegExp(`<wp:positionH relativeFrom="page"><wp:posOffset>${Math.round(convertLength(40.25, "mm", "emu"))}</wp:posOffset>`));
    assert.match(documentXml, new RegExp(`<wp:positionV relativeFrom="page"><wp:posOffset>${Math.round(convertLength(42, "mm", "emu"))}</wp:posOffset>`));
    assert.match(documentXml, new RegExp(`<a:ext cx="${Math.round(convertLength(140, "mm", "emu"))}" cy="${Math.round(convertLength(20, "mm", "emu"))}"`));
    assert.match(documentXml, new RegExp(`<wp:positionH relativeFrom="page"><wp:posOffset>${Math.round(convertLength(25, "mm", "emu"))}</wp:posOffset>`));
    assert.match(documentXml, new RegExp(`<wp:positionV relativeFrom="page"><wp:posOffset>${Math.round(convertLength(50, "mm", "emu"))}</wp:posOffset>`));
    assert.ok(Object.keys(files).some((key) => /^word\/media\//.test(key)), "image bytes are embedded in DOCX");
    assert.ok(documentXml.includes(`<w:framePr`), "separator uses an absolutely positioned Word paragraph frame");
    assert.equal(occurrences(documentXml, "Canonical editable text"), 1, "layout HTML is not re-imported as flow text");
    assert.match(documentXml, /Heading1/);
    assert.match(documentXml, /Heading4/);
    assert.match(documentXml, /Ordinary content survives layout filtering/);
    assert.match(documentXml, /<w:tblW w:type="dxa" w:w="8220"\/>/, "ordinary HTML table keeps the available page content width");
    assert.ok(occurrences(documentXml, "<w:tc>") >= 4, "both ordinary table rows and cells survive layout filtering");
    assert.match(documentXml, /<w:tcBorders>/);

    const sectionProps = documentXml.match(/<w:pgSz[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"[\s\S]*?<w:pgMar[^>]*w:bottom="(\d+)"[^>]*w:left="(\d+)"[^>]*w:header="(\d+)"[^>]*w:footer="(\d+)"/);
    assert.ok(sectionProps, "A4 page size, margins and chrome distances are present");
    assert.deepEqual(sectionProps.slice(1).map(Number), [mmToTwip(210), mmToTwip(297), mmToTwip(25), mmToTwip(30), mmToTwip(13), mmToTwip(17)]);
    assert.equal(ptToTwip(6), 120);
  });

  it("keeps positioned text searchable at its page coordinates in the fallback PDF", async () => {
    const model = compiledLayoutModel();
    // Generic templates embed Tinos; Times New Roman is only exported as that
    // actual face for templates that explicitly require and load the system font.
    const positioned = model.sections.find((section) => section.id === "cover").layout
      .find((node) => node.type === "group").blocks.find((node) => node.id === "cover:block:0.1");
    positioned.style.fontFamily = "Tinos";
    const blob = await buildThesisPdf(model);
    const pdf = await getDocument({ data: new Uint8Array(await blob.arrayBuffer()), useSystemFonts: true }).promise;
    try {
      let found = null;
      for (let index = 1; index <= pdf.numPages && !found; index += 1) {
        const page = await pdf.getPage(index);
        const content = await page.getTextContent();
        found = content.items.find((item) => item.str.includes("Canonical editable text"));
      }
      assert.ok(found, "positioned text appears in exported PDF text");
      const measuredXmm = found.transform[4] * 25.4 / 72;
      assert.ok(Math.abs(measuredXmm - 45.25) <= 0.5, `x position ${measuredXmm} mm includes 2 mm left + 3 mm first-line indents`);
      assert.ok(Math.abs(Math.hypot(found.transform[0], found.transform[1]) - 12) < 0.25, "PDF keeps 12 pt text size");
    } finally {
      await pdf.cleanup?.();
    }
  });
});
