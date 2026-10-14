import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const fixture=JSON.parse(readFileSync('orchestration/specs/engine-mission05-typography.fixture.json','utf8'));
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const p=await b.newPage({viewport:{width:1400,height:1000}});await p.addInitScript(v=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(v)),fixture);
await p.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');
const cases=await p.evaluate(()=>{
 const result={};for(const para of document.querySelectorAll('.thesis-body p')){
 const tag=para.textContent.match(/^J\d\d/)?.[0];if(!tag)continue;const lines=[],walker=document.createTreeWalker(para,4),range=document.createRange();
 while(walker.nextNode()){const n=walker.currentNode;for(let i=0;i<n.length;i++){
 range.setStart(n,i);range.setEnd(n,i+1);const rect=range.getClientRects()[0];if(!rect)continue;
 let line=lines.find(l=>Math.abs(l.top-rect.top)<2);if(!line){line={top:rect.top,text:''};lines.push(line);}line.text+=n.data[i];
 }}(result[tag]??=[]).push(...lines.sort((a,b)=>a.top-b.top).map(l=>l.text.replace(/\s+/g,' ').trim()).filter(Boolean));
 }return result;
});
const dir='orchestration/engine-work/mission05/final-typography/',report=JSON.parse(readFileSync(dir+readdirSync(dir).find(f=>/^check-.*\.json$/.test(f)),'utf8'));
const rows=[];for(const check of report.checks.filter(c=>c.kind==='line_breaks_match')){
 const tag=check.id.slice(0,3),actual=check.actual.measuredLines;assert.deepEqual(cases[tag],actual.pdf,tag+' editor/PDF');assert.deepEqual(cases[tag],actual.word,tag+' editor/Word');rows.push({tag,lines:cases[tag].length,status:'PASS'});
}
assert.equal(rows.length,8);writeFileSync('orchestration/engine-work/mission05/editor-pdf-lines.json',JSON.stringify({status:'PASS',browser:b.version(),cases:rows,lines:cases},null,2));console.log('PASS: all eight editor/PDF/Word line strings identical');
}finally{await b.close();}
