import fs from 'node:fs';
import * as pdfjsLib from 'file:///C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
const pdf = await pdfjsLib.getDocument({data:new Uint8Array(fs.readFileSync(process.argv[2]))}).promise;
const wanted = /^(T\.C\.|AFYONKARİSAR SAĞLIK|LİSANSÜSTÜ EĞİTİM|EĞİTİM BİLİMLERİ ANABİLİM DALI|KABUL VE ONAY|TEZ SINAV JÜRİSİ|Jüri Başkanı|Jüri Üyesi|ÖZET|ABSTRACT|Anahtar Kelimeler:|Keywords:|GİRİŞ|[ivx]+|1)$/;
console.log(JSON.stringify({file:process.argv[2],pageCount:pdf.numPages}));
for (const n of [1,2,4,6,7,8,9,10,11,13]) {
  if (n>pdf.numPages) continue;
  const page=await pdf.getPage(n), text=await page.getTextContent();
  const matches=[];
  for(const item of text.items){
    const s=(item.str||'').trim(); if(!s) continue;
    if(wanted.test(s)|| (n===4 && /^(Prof\.|Doç\.|Dr\.|Ünvanı|Anabilim|Üniversite)/.test(s)) || (n===6 && s==='i') || (n===7 && s==='ii') || (n===13 && s==='1')) {
      matches.push({text:s,size:+item.height.toFixed(3),xMm:+(item.transform[4]*25.4/72).toFixed(3),baselineMm:+((page.view[3]-item.transform[5])*25.4/72).toFixed(3)});
    }
  }
  console.log(`page${n}`,JSON.stringify(matches));
}
