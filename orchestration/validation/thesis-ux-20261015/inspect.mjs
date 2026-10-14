import {createRequire} from 'node:module';
import {readFileSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(resolve('orchestration/tools/node_modules/playwright'));
const dir='orchestration/validation/thesis-ux-20261015';
mkdirSync(dir,{recursive:true});
const fixture=JSON.parse(readFileSync('orchestration/specs/mcbu-lee.fixture.master.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(value=>localStorage.setItem('txtnote-thesis-regression',value),JSON.stringify(fixture));
 const page=await context.newPage();
 page.on('pageerror',error=>console.log(error.message));
 await page.goto('http://127.0.0.1:5175/tests/thesis.html');
 await page.waitForSelector('[aria-label="Belge sayfaları"]',{timeout:60000});
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 await page.screenshot({path:`${dir}/after-outline.png`});
 await page.getByRole('button',{name:'Kaynaklar 4',exact:true}).click();
 await page.screenshot({path:`${dir}/after-sources.png`});
 console.log(await page.locator('.thesis-ribbon').innerText());
}finally{await browser.close();}
