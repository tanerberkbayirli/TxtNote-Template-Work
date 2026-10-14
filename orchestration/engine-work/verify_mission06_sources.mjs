import assert from 'node:assert/strict';import {readFileSync,writeFileSync}from'node:fs';import{unzipSync,strFromU8}from'../../TxtNote/frontend/node_modules/fflate/esm/index.mjs';import{DOMParser}from'../../TxtNote/frontend/node_modules/@xmldom/xmldom/lib/index.js';import{compileThesisDocument}from'../../engine/src/engine.js';import{buildThesisDocx}from'../../engine/src/export.js';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';const results=[];
for(const id of ['SRC01','SRC04','SRC05','EDGE_STRUCTURE']){
 const f=JSON.parse(readFileSync(`orchestration/engine-work/mission06/${id}-geometry.fixture.json`));const m=compileThesisDocument(f.__template,f.researchData.thesis,f.title,f.content);
 const bytes=new Uint8Array(await(await buildThesisDocx(m)).arrayBuffer()),z=unzipSync(bytes),dom=new DOMParser().parseFromString(strFromU8(z['word/document.xml']),'application/xml');const sect=Array.from(dom.getElementsByTagNameNS(W,'sectPr'));assert.equal(sect.length,m.sections.length);
 let checks=0;
 for(let i=0;i<sect.length;i++){
  const native=f.researchData.thesis.document.sections[i].properties.page,p=m.sections[i].rules.page;
  for(const key of ['widthMm','heightMm']){assert.ok(Math.abs(p[key]-native[key])<.001);const attr=key==='widthMm'?'w':'h',n=Number(sect[i].getElementsByTagNameNS(W,'pgSz')[0].getAttribute('w:'+attr));assert.ok(Math.abs(n*25.4/1440-native[key])<.03);checks+=2;}
  for(const [a,key]of[['top','topMm'],['bottom','bottomMm'],['left','leftMm'],['right','rightMm']]){assert.ok(Math.abs((p.docxMargins || p.margins)[key]-native.margins[key])<.001);assert.ok(Math.abs(Number(sect[i].getElementsByTagNameNS(W,'pgMar')[0].getAttribute('w:'+a))*25.4/1440-native.margins[key])<.03);checks+=2;}
  assert.equal(p.orientation,native.orientation);checks++;
  const num=sect[i].getElementsByTagNameNS(W,'pgNumType')[0];if(native.numbering?.restart){assert.equal(Number(num.getAttribute('w:start')),native.numbering.startAt);checks++;}
  for(const k of ['header','footer']){assert.equal(p[k].content,f.researchData.thesis.document.sections[i].properties.rules.page[k].content);assert.equal(p[k].firstContent,f.researchData.thesis.document.sections[i].properties.rules.page[k].firstContent);assert.equal(p[k].evenContent,f.researchData.thesis.document.sections[i].properties.rules.page[k].evenContent);checks+=3;}
 }
 writeFileSync(`orchestration/engine-work/mission06/${id}-geometry-export.docx`,bytes);results.push({id,sections:sect.length,checks,status:'PASS'});
}
writeFileSync('orchestration/engine-work/mission06/source-geometry-verification.json',JSON.stringify({status:'PASS',results},null,2));console.log(results);

