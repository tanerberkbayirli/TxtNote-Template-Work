import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const needle=process.argv[2];
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate((needle)=>{const ps=[...document.querySelectorAll('.thesis-page-flow p')].filter(x=>x.textContent.includes(needle));
 return ps.map(pp=>{const cs=getComputedStyle(pp);return {id:pp.dataset.txtNodeId,width:cs.width,pl:cs.paddingLeft,pr:cs.paddingRight,indent:cs.textIndent,font:cs.font,
  spans:[...pp.querySelectorAll('span[data-thesis-word-fit]')].map(s=>[s.dataset.thesisWordFit,s.style.wordSpacing,s.textContent.slice(0,200)])}});},needle);
console.log(JSON.stringify(r,null,1));
await b.close();
