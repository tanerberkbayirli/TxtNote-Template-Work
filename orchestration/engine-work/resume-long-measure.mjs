import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5175';
const out='orchestration/engine-work/mission08/resume-long';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const report={id,status:'FAIL',pageErrors:[]};
try {
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
  const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push(error.message));
  const started=performance.now();
  await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
  await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
  const ready=()=>page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
  await page.evaluate(()=>document.fonts.ready);await ready();
  report.loadMs=Math.round(performance.now()-started);
  const pages=await page.evaluate(readFileSync('orchestration/engine-work/mission07/extract.js','utf8'));
  if(!pages)throw new Error('Ready long-document extraction did not return pages');
  writeFileSync(`${out}/${id}.pages.json`,JSON.stringify(pages));
  report.pages=pages.length;
  // Real keyboard input into the fixture's editable main story; no user document is opened.
  const paragraph=page.locator('.thesis-body [contenteditable="true"] p, .thesis-body [contenteditable="true"]').first();
  if(await paragraph.count()) {
    await paragraph.click();await page.keyboard.press('End');
    const beforeContent=await page.evaluate(()=>window.thesisTest.getDoc().content);
    const typed=performance.now();await page.keyboard.insertText('x');
    report.keyboardCallMs=Math.round(performance.now()-typed);
    await page.waitForFunction(before=>window.thesisTest.getDoc().content!==before,beforeContent);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await ready();report.editAndSettleMs=Math.round(performance.now()-typed);
    await page.keyboard.press('Control+z');await ready();
  } else report.editMeasurement='NOT_MEASURED: editable paragraph not located';
  report.status=report.pageErrors.length?'FAIL':'MEASURED';
} catch(error) {report.error=error.message;}
finally {await browser.close();writeFileSync(`${out}/${id}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
if(report.status==='FAIL')process.exitCode=1;
