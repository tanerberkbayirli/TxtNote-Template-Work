import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';
const ids=process.argv.slice(2);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});await ctx.grantPermissions(['local-fonts'],{origin:base});
const page=await ctx.newPage();
if(process.env.TXT_OFF)await page.addInitScript(v=>{globalThis.__TXT_OFF=v},process.env.TXT_OFF);
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||'SRC09'}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate((ids)=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.height]});
 const k=841.92/sheets[0][1];const pageOf=y=>sheets.findIndex(([t,h])=>y>=t&&y<t+h+20)+1;
 return ids.map(id=>{const e=document.querySelector(`[data-txt-node-id="docx-${id}"]`);if(!e)return {id,missing:1};const r=e.getBoundingClientRect();const pg=pageOf(r.top+scrollY);const s=getComputedStyle(e);return {id,page:pg,top:+((r.top+scrollY-sheets[pg-1][0])*k).toFixed(1),pb:s.paddingBottom,mb:s.marginBottom}})},ids);
console.log(r.map(x=>JSON.stringify(x)).join('\n'));await browser.close();
