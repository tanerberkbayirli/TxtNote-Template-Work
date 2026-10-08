import fs from 'node:fs';
import * as pdfjsLib from 'file:///C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs';

const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])) }).promise;
for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
  const page = await pdf.getPage(pageNo);
  const text = (await page.getTextContent()).items.map((item) => item.str.trim()).filter(Boolean);
  const words = text.join(' ');
  console.log(`${String(pageNo).padStart(2, '0')} | ${text.slice(0, 8).join(' / ')} | ${text.slice(-1)[0] || ''}`);
  if (/ÖZET|ABSTRACT|KAYNAKLAR|GİRİŞ|KABUL VE ONAY|ETİĞE UYGUNLUK/.test(words)) console.log(`   ${words.slice(0, 240)}`);
}
