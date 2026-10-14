import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const p=await b.newPage();await p.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await p.evaluate(()=>document.fonts.ready);
const rows=await p.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');c.fontKerning='none';const rows=[];
for(const font of ['Times New Roman','Arial','Calibri'])for(const [id,t,n] of [['url','https://example.invalid/research/'+'unbrokenToken'.repeat(12),94],['tail','oken'+'unbrokenToken'.repeat(12),89]]){
c.font=`1000px "${font}"`;const s=t.slice(0,n),chars=[...s].map(x=>c.measureText(x).width/100);
rows.push({font,id,n,natural:c.measureText(s).width/100,twips:chars.reduce((a,x)=>a+Math.round(x*20)/20,0),printer:chars.reduce((a,x)=>a+Math.round(x/.12)*.12,0),chars});}return rows;});
writeFileSync('orchestration/engine-work/mission05/canvas-probe.json',JSON.stringify(rows,null,2));console.log(rows.map(({chars,...r})=>r));}finally{await b.close();}

