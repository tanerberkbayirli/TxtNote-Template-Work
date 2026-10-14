// 10-C acceptance: real science-thesis sources -> import -> editor HTML -> DOCX; native OMML must stay editable and complete.
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { importThesisDocx } from "../../../engine/src/importDocx.js";
import { installContentDocument } from "../../../engine/src/contentModel.js";
import { buildNotePayload, noteFromPayload } from "../../../TxtNote/frontend/src/features/sync/payload.js";
import { compileThesisDocument } from "../../../engine/src/engine.js";
import { buildThesisDocx } from "../../../engine/src/export.js";
import generic from "../../../engine/src/templates/generic.js";
const require = createRequire(new URL("../../../TxtNote/frontend/package.json", import.meta.url));
const { unzipSync, strFromU8 } = require("fflate");
const { DOMParser } = require("@xmldom/xmldom");
const M = "http://schemas.openxmlformats.org/officeDocument/2006/math", W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["EDGE_STRUCTURE", "SRC01", "SRC09", "SRC10"];
const summarize = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const all = (name) => Array.from(doc.getElementsByTagNameNS(M, name));
  const maths = all("oMath");
  const paraOf = (n) => { while (n && !(n.namespaceURI === W && n.localName === "p")) n = n.parentNode; return n; };
  const wText = (p) => Array.from(p?.getElementsByTagNameNS(W, "t") || []).filter((t) => { let n = t.parentNode; while (n && n !== p) { if (n.namespaceURI === M) return false; n = n.parentNode; } return true; }).map((t) => t.textContent).join("");
  return {
    oMath: maths.length, oMathPara: all("oMathPara").length, matrix: all("m").length, nary: all("nary").length, acc: all("acc").length, frac: all("f").length,
    mathText: maths.map((m) => Array.from(m.getElementsByTagNameNS(M, "t")).map((t) => t.textContent).join("")),
    numbers: maths.map((m) => (wText(paraOf(m)).match(/\(\s*[\d.]+[a-z]?\s*\)/i) || [""])[0]),
    cambria: maths.filter((m) => /Cambria Math/.test(m.toString())).length,
  };
};
const corpus = JSON.parse(await fs.readFile("orchestration/engine-work/mission01/corpus.json", "utf8"));
const out = [];
for (const id of ids) {
  const rec = JSON.parse(await fs.readFile(`orchestration/engine-work/mission01/references/${id}/record.json`, "utf8"));
  const path = corpus.sources.find((s) => s.id === id)?.path || rec.source;
  const bytes = new Uint8Array(await fs.readFile(path));
  const source = summarize(strFromU8(unzipSync(bytes)["word/document.xml"]));
  const t0 = Date.now();
  const imported = await importThesisDocx(bytes);
  // Same path as the app: install the imported document, save/reopen the note payload, compile, export.
  const note = installContentDocument({ title: id, researchData: { thesis: { templateId: generic.id } } }, imported);
  const restored = noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({ noteId: id, note, deviceId: "resume-10c", updatedAt: 0 }))));
  const blob = await buildThesisDocx(compileThesisDocument(generic, restored.researchData.thesis, restored.title, restored.content), {});
  const outBytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(`orchestration/engine-work/mission08/resume-equations/${id}.docx`, outBytes);
  const exported = summarize(strFromU8(unzipSync(outBytes)["word/document.xml"]));
  const reopened = await importThesisDocx(outBytes);
  const eqCount = (nodes) => nodes.reduce((n, x) => n + (x.type === "equation" ? 1 : 0) + eqCount(x.children || []), 0);
  const native = JSON.parse(await fs.readFile(`orchestration/engine-work/mission01/references/${id}/native-index.json`, "utf8")).counts;
  const checks = {
    countMatchesNativeIndex: exported.oMath === native.equation && source.oMath === native.equation,
    structures: exported.matrix >= source.matrix && exported.nary >= source.nary && exported.acc >= source.acc && exported.frac >= source.frac,
    mathTextSameOrder: JSON.stringify(exported.mathText) === JSON.stringify(source.mathText),
    displayKept: exported.oMathPara === source.oMathPara,
    numbersKept: JSON.stringify(exported.numbers) === JSON.stringify(source.numbers),
    fontsKept: exported.cambria >= source.cambria,
    reopenedEditable: eqCount(reopened.sections.flatMap((s) => s.nodes)) === native.equation,
  };
  out.push({ id, native: { equation: native.equation, matrix: native.matrix, nary: native.integralOrNary, acc: native.vectorAccent }, source: { ...source, mathText: undefined }, exported: { ...exported, mathText: undefined }, checks, pass: Object.values(checks).every(Boolean), ms: Date.now() - t0 });
}
await fs.writeFile("orchestration/engine-work/mission08/resume-equations/report.json", JSON.stringify(out, null, 2));
for (const r of out) console.log(r.id, r.pass ? "PASS" : "FAIL", JSON.stringify(r.checks), "src", JSON.stringify({ ...r.source, numbers: undefined }), "out", JSON.stringify({ ...r.exported, numbers: undefined }));
