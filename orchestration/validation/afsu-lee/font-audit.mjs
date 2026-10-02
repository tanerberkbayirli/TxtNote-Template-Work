import fs from 'node:fs';
import * as pdfjsLib from 'file:///C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])) }).promise;
const fontCounts = new Map();
const sample = [];
for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
  const page = await pdf.getPage(pageNo);
  const content = await page.getTextContent();
  for (const item of content.items) {
    if (!item.str?.trim()) continue;
    const fontName = content.styles[item.fontName]?.fontFamily || item.fontName;
    const key = `${fontName} ${item.height.toFixed(2)}pt`;
    fontCounts.set(key, (fontCounts.get(key) || 0) + 1);
    if (/E\s*=\s*mc|Tablo 2\.1|Şekil 2\.1|Katılımcıların demografik|Açıklama dipnotu|Gilster|Karasar/.test(item.str)) sample.push({ page: pageNo, text: item.str, fontName, fontSizePt: +item.height.toFixed(2) });
  }
}
console.log(JSON.stringify({ pages: pdf.numPages, fonts: Object.fromEntries([...fontCounts].sort((a, b) => b[1] - a[1])), sample }, null, 2));
