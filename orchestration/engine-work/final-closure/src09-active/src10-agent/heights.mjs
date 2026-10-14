import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow p')].map(pp=>[pp.dataset.txtNodeId,Math.round(pp.getBoundingClientRect().height*10)/10,JSON.stringify(pp.textContent.slice(0,30))]));
writeFileSync(process.argv[2],JSON.stringify(r));await b.close();
