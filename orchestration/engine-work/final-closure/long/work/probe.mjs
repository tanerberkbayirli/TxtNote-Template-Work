import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09',script=readFileSync(process.argv[3],'utf8'),outFile=process.argv[4];
const base='http://127.0.0.1:5175';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
 const page=await context.newPage();page.on('pageerror',e=>console.log('pageerror',e.message));
 await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
 await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
 const r=await page.evaluate(script);
 const s=JSON.stringify(r,null,1);if(outFile)writeFileSync(outFile,s);else console.log(s);
}finally{await browser.close();}
