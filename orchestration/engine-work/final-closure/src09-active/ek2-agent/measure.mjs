import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5175';
const out=process.env.LONG_MEASURE_OUT||'orchestration/engine-work/final-closure/long';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const report={id,status:'FAIL',pageErrors:[]};
try {
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
  const page=await context.newPage();if(process.env.TXT_OFF)await page.addInitScript(v=>{globalThis.__TXT_OFF=v},process.env.TXT_OFF);page.on('pageerror',error=>report.pageErrors.push(error.message));
  const started=performance.now();
  await page.goto(`${base}/tests/thesis-long.html?id=${process.env.LONG_FIXTURE_ID || id}`);
  await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
  const ready=()=>page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
  await page.evaluate(()=>document.fonts.ready);await ready();
  report.loadMs=Math.round(performance.now()-started);
  const pages=await page.evaluate(readFileSync('orchestration/engine-work/final-closure/long/extract-words.js','utf8'));
  if(!pages)throw new Error('Ready long-document extraction did not return pages');
  writeFileSync(`${out}/${id}.pages.json`,JSON.stringify(pages));
  report.pages=pages.length;
  const diagnostics=await page.evaluate(()=>[...document.querySelectorAll('.thesis-body table')].map(t=>{
    const cell=t.querySelector('td,th'),p=cell?.querySelector('p'),s=p&&getComputedStyle(p),r=t.getBoundingClientRect();
    return {id:t.dataset.txtNodeId,text:t.textContent.slice(0,180),width:r.width,height:r.height,rows:t.rows.length,
      rowHeights:[...t.rows].map(r=>r.getBoundingClientRect().height),allRows:[...t.rows].map(r=>({id:r.dataset.txtNodeId,text:r.textContent.slice(0,120),rects:[...r.getClientRects()].map(x=>({top:x.top,bottom:x.bottom,height:x.height})),breakInside:getComputedStyle(r).breakInside})),lists:[...t.querySelectorAll('li')].slice(0,4).map(li=>{const p=li.querySelector('p'),s=getComputedStyle(li),ps=p&&getComputedStyle(p);return{html:li.outerHTML.slice(0,300),height:li.getBoundingClientRect().height,line:s.lineHeight,margin:s.margin,padding:s.padding,child:p&&{height:p.getBoundingClientRect().height,line:ps.lineHeight,margin:ps.margin}}}),cell:cell&&{padding:getComputedStyle(cell).padding,width:cell.getBoundingClientRect().width},p:s&&{font:s.font,line:s.lineHeight,margin:s.margin}};
  }));
  writeFileSync(`${out}/${id}.tables.json`,JSON.stringify(diagnostics,null,2));
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


