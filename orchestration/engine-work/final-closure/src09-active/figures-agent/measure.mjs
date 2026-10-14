import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5222';
const out=process.env.LONG_MEASURE_OUT;mkdirSync(out,{recursive:true});
const patches=[];for(const f of (process.env.PATCHES||'').split(',').filter(Boolean))patches.push(...(await import(pathToFileURL(resolve(f)).href)).default);
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const report={id,status:'FAIL',pageErrors:[],patches:patches.length};
try {
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
  const byFile={};for(const p of patches)(byFile[p.file]??=[]).push(p);for(const [file,list] of Object.entries(byFile)){await context.route(u=>u.pathname===('/'+file),async route=>{const r=await route.fetch();let t=await r.text();for(const p of list){if(p.apply)t=p.apply(t);else if(!t.includes(p.find))console.error('PATCH MISS',file);else t=t.replace(p.find,()=>p.replace);}await route.fulfill({response:r,body:t});});}
  const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push(error.message));
  const started=performance.now();
  await page.goto(`${base}/tests/thesis-long.html?id=${process.env.LONG_FIXTURE_ID || id}`);
  await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
  const ready=()=>page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
  await page.evaluate(()=>document.fonts.ready);await ready();
  report.loadMs=Math.round(performance.now()-started);
  const extract=readFileSync('orchestration/engine-work/final-closure/long/extract-words.js','utf8');
  let pages=null,sig='';
  for(let k=0;k<8;k++){await page.waitForTimeout(3000);await ready();const cur=await page.evaluate(extract);const s2=cur?JSON.stringify(cur.map(p=>p.words.length)):'';if(cur&&s2===sig){pages=cur;break}sig=s2;report.settleRounds=k+1;}
  if(!pages)throw new Error('unstable extraction');
  writeFileSync(`${out}/${id}.pages.json`,JSON.stringify(pages));
  report.pages=pages.length;
  if(process.env.SHOT){await page.setViewportSize({width:1400,height:1500});for(const n of process.env.SHOT.split(',')){const box=await page.evaluate(n=>{const el=document.querySelectorAll('.thesis-sheet')[n-1];el.scrollIntoView({block:'center'});return null},+n);await page.waitForTimeout(800);const r=await page.evaluate(n=>{const b=document.querySelectorAll('.thesis-sheet')[n-1].getBoundingClientRect();return {x:b.left,y:b.top,width:b.width,height:b.height}},+n);await page.screenshot({path:`${out}/editor-${n}.png`,clip:r});}}
  report.status=report.pageErrors.length?'FAIL':'MEASURED';
} catch(error) {report.error=error.message;}
finally {await browser.close();writeFileSync(`${out}/${id}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
