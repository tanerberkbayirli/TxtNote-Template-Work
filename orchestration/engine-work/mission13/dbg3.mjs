import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const origin='http://127.0.0.1:5191',T='[aria-label="Belge sayfaları"]',fx=process.argv[2];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000}});const page=await context.newPage();
page.on('pageerror',e=>console.log('PAGEERR',e.message));
await page.goto(origin+'/tests/thesis-batchb.html');
await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',v),readFileSync(`TxtNote/frontend/tests/generated/${fx}.fixture.json`,'utf8'));await page.reload();
await page.waitForSelector(T+' .thesis-body p');await page.waitForFunction(t=>document.querySelector(t)?.dataset.thesisPaginationReady==='true',T);
for(const variant of ['End+Enter','End+type+Enter','End+type+wait+Enter','End+Enter-after-click-only']){
await page.evaluate(T=>{document.querySelectorAll('[data-m13]').forEach(e=>e.removeAttribute('data-m13'));const ps=[...document.querySelectorAll(T+' .thesis-body p')].filter(p=>p.textContent.trim().length>80&&!p.closest('table,li'));ps[Math.floor(ps.length/2)].setAttribute('data-m13','A')},T);
const A=page.locator('[data-m13="A"]').first();await A.scrollIntoViewIfNeeded();await A.click();await page.keyboard.press('End');
const count=()=>page.evaluate(T=>document.querySelectorAll(T+' .thesis-body p').length,T);
const c0=await count();
if(variant.includes('type'))await page.keyboard.type('QQ');
if(variant.includes('wait'))await page.waitForTimeout(900);
await page.keyboard.press('Enter');await page.waitForTimeout(900);const c1=await count();
console.log(fx,variant,'p count',c0,'->',c1);
for(let i=0;i<5;i++)await page.keyboard.press('Control+z');await page.waitForTimeout(500);
}
await browser.close();
