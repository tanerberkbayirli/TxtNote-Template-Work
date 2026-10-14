import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.argv[2]}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(id=>{
 const out=[];
 for(const st of document.querySelectorAll('style')){const t=st.textContent;let i=-1;while((i=t.indexOf(id,i+1))>=0&&out.length<6){const s=t.lastIndexOf('}',i)+1;out.push(t.slice(s,t.indexOf('}',i)+1).slice(0,600));}}
 return out;
},process.argv[3]);
console.log(r.join('\n---\n'));
await browser.close();
