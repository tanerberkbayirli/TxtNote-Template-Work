import { writeFileSync } from "node:fs";
const base = "file:///C:/Users/CASPER/Desktop/TxtNote-Template-Work/TxtNote/frontend/src/";
const { docxImportFixture } = await import(base + "lib/fixtures/docxImportFixture.js");
const generic = (await import(base + "thesis/templates/generic.js")).default;
const { compileThesisDocument } = await import(base + "thesis/engine.js");
const { buildThesisDocx } = await import(base + "thesis/export.js");
const { importThesisDocx } = await import(base + "thesis/importDocx.js");
const { contentNodesToHtml } = await import(base + "thesis/contentModel.js");
const tc = (t, pr = "") => `<w:tc><w:tcPr>${pr}</w:tcPr><w:p><w:r><w:t>${t}</w:t></w:r></w:p></w:tc>`;
const tr = (c, pr = "") => `<w:tr><w:trPr>${pr}</w:trPr>${c}</w:tr>`;
const body = `<w:tbl><w:tblPr/><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="3000"/><w:gridCol w:w="4000"/></w:tblGrid>`
 + tr(tc("A", '<w:gridSpan w:val="2"/>') + tc("B"), "<w:tblHeader/>")
 + tr(tc("C", '<w:vMerge w:val="restart"/>') + tc("D") + tc("E"), "<w:cantSplit/>")
 + tr(tc("", "<w:vMerge/>") + tc("F") + tc("G"))
 + `</w:tbl><w:p><w:r><w:t>Sonra</w:t></w:r></w:p>`;
const imported = await importThesisDocx(docxImportFixture({ body }));
let html = contentNodesToHtml(imported.sections[0].nodes, { stampIds: false });
html = html.replace(">F<", ">F-duzenlendi<"); // edit step
const blob = await buildThesisDocx(compileThesisDocument(generic, {}, "T", html), {});
writeFileSync("roundtrip.docx", Buffer.from(await blob.arrayBuffer()));
console.log("ok");
