import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate(()=>{const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());const k=595.32/sheets[0].width;const out=[];
 const t=[...document.querySelectorAll('.thesis-page-flow table')].find(x=>x.textContent.includes('Split Ratio: 90-10')&&x.rows.length>100);
 for(const tr of t.rows){for(const rc of tr.getClientRects()){const cy=(rc.top+rc.bottom)/2;const si=sheets.findIndex(s=>cy>=s.top&&cy<s.bottom);out.push([tr.rowIndex,si+1,Math.round((rc.top-sheets[si].top)*k*10)/10,Math.round(rc.height*k*10)/10,tr.textContent.slice(0,25)]);}}
 return out;});
writeFileSync(process.argv[2],JSON.stringify(r));await b.close();
