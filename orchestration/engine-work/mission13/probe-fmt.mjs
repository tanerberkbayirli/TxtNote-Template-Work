// 13-B probe: where do source underline/highlight/color run properties live (direct run vs style) and do they reach the export?
import {readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from '../../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';
const id=process.argv[2]||'SRC10', tag=process.argv[3]||'u';
const c=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases.find(x=>x.id===id);
const x=strFromU8(unzipSync(readFileSync(c.input.path))['word/document.xml']);
const m=[...x.matchAll(new RegExp(`<w:r\b[^>]*>(?:(?!</w:r>).)*?<w:${tag}\b[^>]*>(?:(?!</w:r>).)*?</w:r>`,'gs'))];
console.log(id,tag,m.length);m.slice(0,4).forEach(r=>console.log(r[0].slice(0,300)));
