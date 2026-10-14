import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const cases=JSON.parse(readFileSync('orchestration/engine-work/final-closure/math-resume/cases.json','utf8'));
const b=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
const p=await b.newPage({viewport:{width:1400,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=NARY_RESUME');
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
const rows=await p.evaluate(()=>{
 const math=[...document.querySelectorAll('.thesis-page-flow [data-native-object="equation"] math')];
 const zoom=document.querySelector('.thesis-page-flow').getBoundingClientRect().width/document.querySelector('.thesis-page-flow').offsetWidth;
 const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x/zoom,y:r.y/zoom,w:r.width/zoom,h:r.height/zoom};};
 return math.map(m=>{const op=m.querySelector('mo'),limits=op.parentElement,sub=limits.tagName==='munderover'||limits.tagName==='msubsup'||limits.tagName==='munder'?limits.children[1]:null,sup=limits.tagName==='munderover'||limits.tagName==='msubsup'?limits.children[2]:limits.tagName==='mover'?limits.children[1]:null;return{tag:limits.tagName,text:m.textContent,op:rect(op),sub:sub&&rect(sub),sup:sup&&rect(sup),heightPt:m.closest('p').offsetHeight*.75};});
});
assert.equal(rows.length,cases.length);assert.deepEqual(errors,[]);
for(let i=0;i<rows.length;i++){
 const row=rows[i],c=cases[i];assert.equal(c.tag==='mo'?row.text:c.tag,c.tag==='mo'?`${c.op}LUx`:row.tag,c.id);
 assert.ok(row.text.includes('L'),c.id);assert.ok(row.text.includes('U'),c.id);
 assert.equal(Boolean(row.sub),c.sub,c.id);assert.equal(Boolean(row.sup),c.sup,c.id);
 if(c.tag==='munderover'){
  assert.ok(row.sub.y>row.op.y,`${c.id} lower limit below operator`);
  assert.ok(row.sup.y<row.op.y,`${c.id} upper limit above operator`);
  assert.ok(Math.abs(row.sub.x+row.sub.w/2-row.op.x-row.op.w/2)<1,`${c.id} lower limit centered`);
 }else if(c.tag==='msubsup')assert.ok(row.sub.x>=row.op.x+row.op.w-.5,`${c.id} lower limit at side`);
}
writeFileSync('orchestration/engine-work/final-closure/math-resume/browser.json',JSON.stringify({status:'PASS',errors,rows:rows.map((r,i)=>({id:cases[i].id,...r}))},null,2));
console.log(JSON.stringify({status:'PASS',cases:rows.length,heights:rows.map((r,i)=>[cases[i].id,r.heightPt])}));
}finally{await b.close();}
