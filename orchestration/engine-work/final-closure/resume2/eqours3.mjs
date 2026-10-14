import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=EQ_PROBE`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow .rich-text-body > p')].map(p=>[(p.textContent||'').slice(0,10),Math.round(p.offsetHeight*0.75*10)/10,p.querySelector('math,.katex,.math-formula')?.tagName]));
const order=JSON.parse(await (await import('node:fs')).promises.readFile('exp/eqprobe.order.json','utf8'));
let k=0;for(let i=1;i<r.length;i+=2){const o=order[k++];console.log(o[0].padEnd(10),o[1],'ours H=',r[i][1],'(extra over base text:', (r[i][1]-(o[1]==360?20.7:13.8)).toFixed(1),')',r[i][2]);}
await browser.close();
