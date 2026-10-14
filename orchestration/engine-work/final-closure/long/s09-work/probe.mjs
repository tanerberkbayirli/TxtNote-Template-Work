// usage: node probe.mjs <SRC id> <script.js> <out.json>  — loads the fixture once, evaluates script in the ready page.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const [id,scriptFile,out]=process.argv.slice(2);
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
 const page=await context.newPage();
 await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
 await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
 const res=await page.evaluate(readFileSync(scriptFile,'utf8'));
 writeFileSync(out,JSON.stringify(res,null,1));console.log('SAVED',out);
}finally{await browser.close();}
