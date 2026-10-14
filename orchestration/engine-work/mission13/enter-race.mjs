// 13-C finding probe: text typed right after Enter lands in which paragraph? usage: node enter-race.mjs <fixture> [origin]
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const fx=process.argv[2]||'s1',origin=process.argv[3]||'http://127.0.0.1:5175',T='[aria-label="Belge sayfaları"]';
let failed=0;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(origin+'/tests/thesis-batchb.html');
await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',v),readFileSync(`TxtNote/frontend/tests/generated/${fx}.fixture.json`,'utf8'));await page.reload();
await page.waitForSelector(T+' .thesis-body p');await page.waitForFunction(t=>document.querySelector(t)?.dataset.thesisPaginationReady==='true',T);
for(const [label,gap,delay] of [['no gap, 0ms keys',0,0],['no gap, 30ms keys',0,30],['100ms gap',100,0],['400ms gap',400,0]]){
 await page.evaluate(T=>{document.querySelectorAll('[data-m13]').forEach(e=>e.removeAttribute('data-m13'));const ps=[...document.querySelectorAll(T+' .thesis-body p')].filter(p=>p.textContent.trim().length>80&&!p.closest('table,li'));ps[Math.floor(ps.length/2)].setAttribute('data-m13','A');},T);
 const A=page.locator('[data-m13="A"]').first();await A.scrollIntoViewIfNeeded();await A.click();await page.keyboard.press('Home');
 await page.keyboard.press('Enter');if(gap)await page.waitForTimeout(gap);await page.keyboard.type('Zz13',{delay});await page.waitForTimeout(800);
 const r=await page.evaluate(()=>{const ps=[...document.querySelectorAll('.thesis-body p')];const i=ps.findIndex(p=>p.textContent.includes('Zz13'));const t=ps[i]?.textContent||'';const k=t.indexOf('Zz13');return {idx:i,pos:k,len:t.length,around:t.slice(Math.max(0,k-15),k+20),prevTail:ps[i-1]?.textContent.slice(-15),nextHead:ps[i+1]?.textContent.slice(0,15)}});
 console.log(fx,label,JSON.stringify(r));
 // Regression: typed text must be at the START of the new (second) paragraph.
 if(r.pos!==0||r.prevTail?.includes('Zz13')){failed++;console.log('FAIL',label);}
 for(let i=0;i<12;i++)await page.keyboard.press('Control+z');await page.waitForTimeout(500);
}
await browser.close();
if(failed){console.log('enter-race FAIL x'+failed);process.exit(1);}console.log('enter-race PASS');
