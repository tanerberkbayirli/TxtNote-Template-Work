import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAcademicPdf } from "../frontend/src/lib/academicPdf.js";
import { buildAcademicDocx, buildPrintDocument } from "../frontend/src/lib/academicExport.js";
import { academicExportQaDoc } from "../frontend/src/lib/academicQaDocument.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "output", "academic-qa");
await fs.mkdir(outDir, { recursive: true });

const doc = academicExportQaDoc();
const pdf = await buildAcademicPdf(doc);
const docx = await buildAcademicDocx(doc);

await fs.writeFile(path.join(outDir, "article.pdf"), Buffer.from(await pdf.arrayBuffer()));
await fs.writeFile(path.join(outDir, "article.docx"), Buffer.from(await docx.arrayBuffer()));
await fs.writeFile(path.join(outDir, "article.html"), buildPrintDocument(doc), "utf8");

console.log(`Wrote ${outDir}/article.pdf, article.docx, article.html`);
