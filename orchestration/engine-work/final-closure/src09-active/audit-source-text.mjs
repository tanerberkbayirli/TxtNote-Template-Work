import {readFileSync,writeFileSync} from 'node:fs';
import {readDocxPackage,escapeHtml} from '../../../../engine/src/docx/importPackage.js';
const entry=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8')).cases.find(c=>c.id==='SRC09');
const pkg=await readDocxPackage(readFileSync(entry.input.path));
const doc=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/SRC09_ACTIVE.fixture.json','utf8')).researchData.thesis.document;
const textNodes=new Map(),native=[];
const walk=n=>{
 if(n.type==='textRun')textNodes.set(n.properties.locator,n);
 if(n.attributes?.['data-docx-drawing'])native.push(n.properties.locator);
 (n.children||[]).forEach(walk);
};
doc.sections.forEach(s=>s.nodes.forEach(walk));
const counts={sourceRuns:0,directUnchanged:0,inPreservedNativeDrawing:0,missing:0,changed:0},problems=[];
for(const t of Array.from(pkg.xml(pkg.mainPart).getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main','t'))){
 const locator=pkg.location(t),node=textNodes.get(locator);counts.sourceRuns++;
 if(node){
  const value=(node.children||[]).map(n=>n.text||'').join('');
  if(value===escapeHtml(t.textContent||''))counts.directUnchanged++;
  else {counts.changed++;problems.push({locator,source:t.textContent,model:value});}
 }else if(native.some(p=>locator.startsWith(p+'/')))counts.inPreservedNativeDrawing++;
 else {counts.missing++;problems.push({locator,source:t.textContent});}
}
const result={status:problems.length?'INVESTIGATE':'PASS',scope:'All literal w:t runs in the main XML, including both alternative branches. Model/native-source preservation only; not a proof of visible layout, image OCR, fields, equations, notes or export.',counts,problems};
writeFileSync('orchestration/engine-work/final-closure/src09-active/source-text-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,counts,problems:problems.slice(0,5)}));
