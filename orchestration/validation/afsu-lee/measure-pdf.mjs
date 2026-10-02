import fs from 'node:fs';
import * as pdfjsLib from 'file:///C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
const d=new Uint8Array(fs.readFileSync(process.argv[2])); const pdf=await pdfjsLib.getDocument({data:d,disableFontFace:true,useSystemFonts:true}).promise;
console.log('pages',pdf.numPages);
for(let n=1;n<=Math.min(pdf.numPages,4);n++){
 const p=await pdf.getPage(n), tc=await p.getTextContent(); console.log('\nPAGE',n,p.view);
 for(const i of tc.items){if(!i.str?.trim())continue; let [a,b,c,e,x,y]=i.transform; console.log(JSON.stringify({t:i.str,size:Math.hypot(c,e),x:x*25.4/72,y:(p.view[3]-y)*25.4/72,font:i.fontName}));}
}
