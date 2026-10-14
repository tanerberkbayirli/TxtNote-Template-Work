import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {importThesisDocx} from '../../../../engine/src/importDocx.js';
import {contentNodesToHtml,installContentDocument} from '../../../../engine/src/contentModel.js';
import {compileThesisDocument} from '../../../../engine/src/engine.js';
import {buildThesisDocx} from '../../../../engine/src/export.js';
import generic from '../../../../engine/src/templates/generic.js';
const require=createRequire(new URL('../../../../TxtNote/frontend/package.json',import.meta.url));
const {unzipSync,strFromU8}=require('fflate'),{DOMParser}=require('@xmldom/xmldom');
const entry=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases.find(c=>c.id==='SRC09');
const bytes=readFileSync(entry.input.path),source=unzipSync(bytes),doc=await importThesisDocx(bytes);
const note=installContentDocument({title:'SRC09',content:'',researchData:{thesis:{templateId:generic.id}}},doc);
const result=new Uint8Array(await(await buildThesisDocx(compileThesisDocument(generic,note.researchData.thesis,'SRC09',note.content),{})).arrayBuffer());
const files=unzipSync(result);
const cachedText=bytes=>{
 const root=new DOMParser().parseFromString(strFromU8(bytes),'application/xml');
 return Array.from(root.getElementsByTagName('*')).filter(n=>['t','v'].includes(n.localName)).map(n=>n.textContent);
};
const charts=[];
for(let i=1;i<=6;i++){
 const part=`word/charts/chart${i}.xml`,output=Object.keys(files).find(p=>p.endsWith('/source/'+part));
 assert.ok(output,part);assert.deepEqual(cachedText(files[output]),cachedText(source[part]),part);
 charts.push({source:part,exported:output,cachedTextsUnchanged:true});
}
const reopened=await importThesisDocx(result),nodes=[];
const walk=n=>{nodes.push(n);(n.children||[]).forEach(walk)};
reopened.sections.forEach(s=>s.nodes.forEach(walk));
const horizontal=nodes.filter(n=>n.type==='drawing'&&n.children?.some(c=>c.tag==='svg')&&/Konulara|Yayın Yerine/.test(contentNodesToHtml([n])));
assert.equal(horizontal.length,2);
writeFileSync('orchestration/engine-work/final-closure/src09-active/SRC09-charts-roundtrip.docx',result);
writeFileSync('orchestration/engine-work/final-closure/src09-active/chart-roundtrip.json',JSON.stringify({status:'PASS',charts,cachedDataUnchanged:true,reimportHorizontalCharts:horizontal.length},null,2));
console.log('Actual SRC09: all 6 chart caches unchanged after DOCX export; horizontal previews survive reimport.');
