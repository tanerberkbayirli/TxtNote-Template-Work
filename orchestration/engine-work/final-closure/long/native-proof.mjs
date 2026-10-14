import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { importThesisDocx } from "../../../../engine/src/importDocx.js";
import { contentNodesToHtml } from "../../../../engine/src/contentModel.js";
import { compileThesisDocument } from "../../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../../engine/src/export.js";
import generic from "../../../../engine/src/templates/generic.js";
const require = createRequire(new URL("../../../../TxtNote/frontend/package.json", import.meta.url));
const { unzipSync, zipSync, strFromU8, strToU8 } = require("fflate");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const corpus = JSON.parse(await fs.readFile("orchestration/engine-work/mission01/corpus.json", "utf8"));
const path = corpus.sources.find((s) => s.id === "SRC09").path;
const files = unzipSync(await fs.readFile(path));
const doc = new DOMParser().parseFromString(strFromU8(files["word/document.xml"]), "application/xml");
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const all = Array.from(doc.getElementsByTagNameNS(W, "drawing"));
const serializer = new XMLSerializer(), selected = [], kinds = new Set();
for (const drawing of all) {
  const graphic = Array.from(drawing.getElementsByTagName("*")).find((n) => n.localName === "graphicData");
  const kind = (graphic?.getAttribute("uri") || "").split("/").at(-1);
  if (kind === "picture" || !kind || kinds.has(kind)) continue;
  kinds.add(kind); selected.push(drawing);
}
selected.push(...Array.from(doc.getElementsByTagNameNS(W,"pict")).slice(0,2));
const math = Array.from(doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/officeDocument/2006/math", "oMathPara"))[0] || Array.from(doc.getElementsByTagNameNS("http://schemas.openxmlformats.org/officeDocument/2006/math", "oMath"))[0];
const body = doc.getElementsByTagNameNS(W, "body")[0];
while (body.firstChild) body.removeChild(body.firstChild);
const p = doc.createElementNS(W, "w:p"), r = doc.createElementNS(W, "w:r"), t = doc.createElementNS(W, "w:t");
t.textContent = "Düzenlenebilir kaynak çizimleri"; r.appendChild(t); p.appendChild(r); body.appendChild(p);
for (const drawing of selected) { const row = doc.createElementNS(W, "w:p"); row.appendChild(drawing.cloneNode(true)); body.appendChild(row); }
if (math) { const row = doc.createElementNS(W, "w:p"); row.appendChild(math.cloneNode(true)); body.appendChild(row); }
body.appendChild(doc.createElementNS(W, "w:sectPr"));
files["word/document.xml"] = strToU8(serializer.serializeToString(doc));
const imported = await importThesisDocx(zipSync(files));
const html = contentNodesToHtml(imported.sections[0].nodes, { stampIds: false });
const blob = await buildThesisDocx(compileThesisDocument(generic, { document: imported }, "Kaynak çizim kanıtı", html));
const out = "orchestration/engine-work/final-closure/long/native-drawings.docx";
await fs.writeFile(out, new Uint8Array(await blob.arrayBuffer()));
await fs.writeFile("orchestration/engine-work/final-closure/long/native-drawings.json", JSON.stringify({ source: path, kinds: [...kinds], drawingCount: selected.length, equation: Boolean(math), previewNotices: imported.source.unsupported.filter((i) => /chart|smartart/.test(i.code)), output: out }, null, 2));
console.log(JSON.stringify({ kinds: [...kinds], drawingCount: selected.length, equation: Boolean(math), out }));

