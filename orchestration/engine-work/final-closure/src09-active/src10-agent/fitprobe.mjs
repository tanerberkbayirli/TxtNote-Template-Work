import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const needle=process.argv[2];
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate((needle)=>{const pp=[...document.querySelectorAll('.thesis-page-flow p')].find(x=>x.textContent.includes(needle));
 const ctx=document.createElement('canvas').getContext('2d');ctx.fontKerning='none';
 const spans=[...pp.querySelectorAll('span[data-thesis-word-fit]')];
 const out=[];
 // per line: natural width = sum of measured text with each node's font
 const lines={};
 const w=document.createTreeWalker(pp,4);let n;
 while(n=w.nextNode()){const st=getComputedStyle(n.parentElement);const sz=parseFloat(st.fontSize);ctx.font=`${st.fontStyle} ${st.fontWeight} 1000px ${st.fontFamily}`;
  const ln=n.parentElement.dataset.thesisWordFit??'x';const wd=ctx.measureText(n.data).width*sz/1000;(lines[ln]||(lines[ln]=[])).push({w:wd,t:n.data,font:st.fontFamily+' '+st.fontWeight+' '+st.fontSize});}
 const cs=getComputedStyle(pp);
 return {width:cs.width,indent:cs.textIndent,lines:Object.fromEntries(Object.entries(lines).map(([k,v])=>[k,{nat:v.reduce((a,x)=>a+x.w,0),parts:v.map(x=>[x.w,x.t.slice(0,25),x.font])}]))};},needle);
console.log(JSON.stringify(r,null,1));await b.close();
