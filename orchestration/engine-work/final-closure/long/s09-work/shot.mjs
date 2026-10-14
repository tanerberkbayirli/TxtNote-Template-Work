// usage: node shot.mjs <SRC id> <outprefix> <sheet#...>  — screenshots editor sheets (1-based)
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const [id,prefix,...sheets]=process.argv.slice(2);
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const context=await browser.newContext({viewport:{width:1400,height:1000},deviceScaleFactor:1});
 await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
 const page=await context.newPage();
 await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
 await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
 for(const s of sheets){const loc=page.locator('.thesis-sheet').nth(+s-1);await loc.scrollIntoViewIfNeeded();await page.waitForTimeout(400);await loc.screenshot({path:`${prefix}${s}.png`});console.log('shot',s);}
}finally{await browser.close();}
