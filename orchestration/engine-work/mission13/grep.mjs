import {readFileSync} from 'node:fs';
import {DOMParser} from '../../../TxtNote/frontend/node_modules/@xmldom/xmldom/lib/index.js';
import {unzipSync, strFromU8} from '../../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const [f,re]=process.argv.slice(2);
Array.from(new DOMParser().parseFromString(strFromU8(unzipSync(readFileSync(f))['word/document.xml']),'text/xml').getElementsByTagNameNS(W,'p')).forEach((p,i)=>{const t=Array.from(p.getElementsByTagNameNS(W,'t')).map(t=>t.textContent).join('');if(new RegExp(re,'i').test(t))console.log(i,JSON.stringify(t.slice(Number(process.env.O||0),Number(process.env.O||0)+Number(process.env.L||140))))});
