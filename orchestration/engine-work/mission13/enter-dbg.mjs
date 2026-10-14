// Debug: selection trace after Enter. usage: node enter-dbg.mjs <fixture> [origin]
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const fx=process.argv[2]||'s1',origin=process.argv[3]||'http://127.0.0.1:5175',T='[aria-label="Belge sayfaları"]';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(origin+'/tests/thesis-batchb.html');
await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',v),readFileSync(`TxtNote/frontend/tests/generated/${fx}.fixture.json`,'utf8'));await page.reload();
await page.waitForSelector(T+' .thesis-body p');await page.waitForFunction(t=>document.querySelector(t)?.dataset.thesisPaginationReady==='true',T);
await page.evaluate(T=>{const ps=[...document.querySelectorAll(T+' .thesis-body p')].filter(p=>p.textContent.trim().length>80&&!p.closest('table,li'));ps[Math.floor(ps.length/2)].setAttribute('data-m13','A');
 window.__log=[];const d=()=>{const s=getSelection();const n=s.anchorNode;const p=n&&(n.nodeType===1?n:n.parentElement)?.closest('p');return {off:s.anchorOffset,pid:p?.dataset.txtNodeId,ptxt:p?.textContent.slice(0,12),plen:p?.textContent.length,nt:n?.nodeType}};
 window.__d=d;document.addEventListener('selectionchange',()=>window.__log.push(['sel',Math.round(performance.now()),d()]));
 new MutationObserver(m=>window.__log.push(['mut',Math.round(performance.now()),m.length,m.slice(0,3).map(x=>x.type+':'+(x.attributeName||'')+':'+(x.target.nodeName))])).observe(document.querySelector(T),{subtree:true,childList:true,attributes:true,characterData:true});},T);
const A=page.locator('[data-m13="A"]').first();await A.scrollIntoViewIfNeeded();await A.click();await page.keyboard.press('Home');
await page.evaluate(()=>{window.__log.push(['BEFORE-ENTER',Math.round(performance.now()),window.__d()])});
await page.keyboard.press('Enter');await page.waitForTimeout(600);
console.log(JSON.stringify(await page.evaluate(()=>window.__log.slice(-40)),null,0).replace(/\],\[/g,'],\n['));
await browser.close();
