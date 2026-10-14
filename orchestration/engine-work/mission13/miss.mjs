import {readFileSync} from 'node:fs';
import {DOMParser} from '../../../TxtNote/frontend/node_modules/@xmldom/xmldom/lib/index.js';
import {unzipSync, strFromU8} from '../../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const tx=b=>Array.from(new DOMParser().parseFromString(strFromU8(unzipSync(b)['word/document.xml']),'text/xml').getElementsByTagNameNS(W,'p')).map(p=>Array.from(p.getElementsByTagNameNS(W,'t')).map(t=>t.textContent).join('').replace(/\s+/g,' ').trim()).filter(Boolean);
const [id,src]=process.argv.slice(2);const a=tx(readFileSync(src)),b=tx(readFileSync(`${process.env.OUT||`orchestration/engine-work/mission13/${id}.out.docx`}`));
const bs=new Set(b);let n=0;a.forEach((s,i)=>{if(!bs.has(s)&&n++<12){const j=b.findIndex(x=>x.toLowerCase().startsWith(s.toLowerCase().slice(0,25)));console.log('SRC:',s.slice(0,160));console.log('OUT:',j>=0?b[j].slice(0,160):'(none)');}});
