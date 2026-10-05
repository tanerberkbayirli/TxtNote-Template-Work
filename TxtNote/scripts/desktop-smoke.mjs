// Real NSIS payload + production WebView2 CSP. Never use a Vite fixture here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {sha256} from './release-verification.mjs';
import {task10aChecks} from '../frontend/tests/task10a-checks.mjs';
import {assertConsistent,briefState,footnoteState,settle as settleFootnotes,task10a1Checks} from '../frontend/tests/task10a1-checks.mjs';
import {fillMcbuThesis,sheetLabels,task10bChecks} from '../frontend/tests/task10b-checks.mjs';
import {task10b1Checks} from '../frontend/tests/task10b1-checks.mjs';
import {task10b2Checks} from '../frontend/tests/task10b2-checks.mjs';
import {blankPageChecks} from '../frontend/tests/blank-page-checks.mjs';
import {layoutEditorChecks} from '../frontend/tests/layout-editor-checks.mjs';
import {layoutExportChecks} from '../frontend/tests/layout-export-checks.mjs';
import {embeddedPdfFonts} from '../frontend/tests/pdf-font-compliance.mjs';
const require=createRequire(import.meta.url);
let chromium;
for(const module of [process.env.PLAYWRIGHT_MODULE,'playwright',path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try {({chromium}=require(module));break;} catch {}
}
if(!chromium) throw Error('Install playwright or set PLAYWRIGHT_MODULE');
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'output/desktop-parity');
fs.mkdirSync(output,{recursive:true});
const executable=path.resolve(process.argv[2]||path.join(root,'.cargo-target-build/release/txtnote.exe'));
const identity=JSON.parse(fs.readFileSync(path.join(root,'frontend/dist/build-identity.json'),'utf8'));
assert.equal(process.env.TXTNOTE_BUILD_ID||identity.buildId,identity.buildId);
const report={status:'failed',buildId:identity.buildId,executableSha256:sha256(fs.readFileSync(executable)),steps:[],cspViolations:[],securityLogs:[],pageErrors:[]};
const pass=message=>{report.steps.push(message);console.log(`PASS ${message}`);};
const near=(a,b,label,tolerance=1)=>assert.ok(Math.abs(a-b)<tolerance,`${label}: ${a} vs ${b}`);
let desktop,browser,webBrowser,server,page,failurePage;
const debugPort=Number(process.env.TXTNOTE_SMOKE_PORT||9235);
const profile=path.join(output,'webview-smoke');
async function launchDesktop() {
  const occupied=await fetch(`http://127.0.0.1:${debugPort}/json/version`).then(r=>r.ok).catch(()=>false);
  if(occupied) throw Error(`Smoke debug port ${debugPort} already belongs to another process`);
  desktop=spawn(executable,[],{cwd:path.dirname(executable),windowsHide:true,env:{...process.env,WEBVIEW2_USER_DATA_FOLDER:profile,WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:`--remote-debugging-port=${debugPort}`}});
  desktop.on('error',error=>report.pageErrors.push(error.message));
  for(let i=0;i<120;i++) {
    try {const r=await fetch(`http://127.0.0.1:${debugPort}/json/version`);if(r.ok) break;} catch {}
    if(desktop.exitCode!==null) throw Error(`Desktop exited (${desktop.exitCode})`);
    await new Promise(r=>setTimeout(r,250));
  }
  browser=await chromium.connectOverCDP(`http://127.0.0.1:${debugPort}`);
  page=browser.contexts()[0].pages()[0];
  failurePage=page;
  assert.ok(page,'Packaged WebView page missing');
  await observe(page,true);
  await page.reload();
  const entry=fs.readFileSync(path.join(root,'frontend/dist/index.html'),'utf8').match(/<script[^>]*src="([^"]+)"/)?.[1];
  const loaded=await page.locator('script[src]').evaluateAll(es=>es.map(e=>new URL(e.src).pathname));
  assert.ok(entry&&loaded.includes(entry),'Packaged runtime loaded a stale frontend entry asset');
  await unlock(page);
  return page;
}
async function closeDesktop() {
  if(!desktop||desktop.exitCode!==null) return;
  // Close only the exact PID we spawned, after save/reopen checks. WM_CLOSE lets
  // Tauri finish normally; never terminate unrelated open TxtNote processes.
  const pid=desktop.pid;
  const code=`$p=Get-Process -Id ${pid} -ErrorAction Stop; if ($p.Path -ne '${executable.replaceAll("'","''")}') { throw 'Unexpected smoke process path' }; if (-not $p.CloseMainWindow()) { throw 'Could not gracefully close smoke application' }; if (-not $p.WaitForExit(15000)) { throw 'Smoke application did not exit' }`;
  const result=spawnSync('powershell.exe',['-NoProfile','-Command',code],{windowsHide:true,encoding:'utf8'});
  if(result.error||result.status!==0) throw Error(`Smoke application did not close: ${result.error?.message||result.stderr||result.stdout}`);
  if(result.status!==0) throw Error(`Graceful desktop close failed: ${result.stderr}`);
  await browser?.close();browser=null;
}
async function observe(p,isDesktop) {
  p.on('pageerror',e=>report.pageErrors.push(e.message));
  p.on('console',m=>{if(/content security policy|violat.*(?:style|script).*directive|refused to (?:apply|load)/i.test(m.text())) report.securityLogs.push(m.text());});
  const session=await p.context().newCDPSession(p);
  await session.send('Log.enable');
  session.on('Log.entryAdded',({entry})=>{if(entry.source==='security'||/content security policy/i.test(entry.text)) report.securityLogs.push(entry.text);});
  await p.exposeBinding('recordSmokeViolation',(_,violation)=>report.cspViolations.push({desktop:isDesktop,...violation}));
  await p.addInitScript(()=>{
    document.addEventListener('securitypolicyviolation',e=>window.recordSmokeViolation({directive:e.effectiveDirective,blockedURI:e.blockedURI,sourceFile:e.sourceFile,lineNumber:e.lineNumber}));
    // Suppress only the OS print dialog; exercise the actual srcdoc generator.
    window.print=()=>{window.__smokePrintCalled=true;};
  });
}
async function unlock(p) {
  await p.waitForFunction(()=>document.querySelector('[aria-label="Yeni İçerik Ekle"]')||document.body.innerText.includes('Bu cihazdaki cüzdanla devam et'),null,{timeout:30000});
  const resume=p.getByRole('button',{name:'Bu cihazdaki cüzdanla devam et',exact:true});
  if(await resume.count()) await resume.click();
  await p.getByRole('button',{name:'Yeni İçerik Ekle',exact:true}).waitFor({timeout:30000});
}
async function createThesis(p,title,{university='demo-university-a',degree}={}) {
  failurePage=p;
  const setup=p.locator('#create-workspace-name');
  if(await setup.isVisible()) {
    await setup.fill('Desktop parity smoke');
    await setup.press('Enter');
  }
  await p.getByRole('button',{name:'Yeni İçerik Ekle',exact:true}).click();
  await p.getByRole('button',{name:'Tüm şablonları keşfet',exact:true}).click();
  await p.getByLabel('Üniversite',{exact:true}).selectOption(university);
  if(degree) await p.getByLabel('Tez türü',{exact:true}).selectOption(degree);
  await p.getByRole('button',{name:'Tez oluştur',exact:true}).click();
  await main(p).waitFor();
  await p.getByRole('button',{name:'Tez bilgileri',exact:true}).click();
  await p.getByPlaceholder('Tez başlığını yazın').fill(title);
  await p.getByRole('button',{name:'Tez bilgilerini kapat',exact:true}).click();
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
}
const main=p=>p.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');
const paper=p=>p.locator('.thesis-paper[data-thesis-section="main"]');
const metrics=p=>paper(p).evaluate(el=>{
  const s=getComputedStyle(el),t=getComputedStyle(el.querySelector('[contenteditable="true"]'));
  return {width:parseFloat(s.width),minHeight:parseFloat(s.minHeight),height:parseFloat(s.height),padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft].map(parseFloat),margin:[s.marginTop,s.marginRight,s.marginBottom,s.marginLeft].map(parseFloat),background:s.backgroundColor,sheet:getComputedStyle(el.parentElement.querySelector('.thesis-sheet')).backgroundColor,layout:el.dataset.thesisLayout,position:s.position,font:t.fontFamily,size:parseFloat(t.fontSize),line:parseFloat(t.lineHeight)};
});
async function checkGeometry(p) {
  // An empty editable group is now a slot, not an A4 sheet. Check that it is
  // usable, then measure the actual sheet created by content.
  if(await paper(p).getAttribute('data-thesis-empty-flow')==='true') {
    assert.equal(await paper(p).getAttribute('data-thesis-page-count'),'0');
    await main(p).click();
    assert.equal(await main(p).evaluate(e=>document.activeElement===e),true);
    await main(p).fill('A4 geometry probe');
    await p.waitForFunction(()=>document.querySelector('.thesis-paper[data-thesis-section="main"]').dataset.thesisPageCount==='1');
    await frames(p);
  }
  const m=await metrics(p);near(m.width,210*96/25.4,'A4 width');near(m.minHeight,297*96/25.4,'A4 height');
  [25,25,25,30].forEach((mm,i)=>near(m.padding[i],mm*96/25.4,'A4 padding'));
  // Task 7: white A4 sheets sit behind a transparent, natively paginated flow.
  assert.equal(m.layout,'paged');assert.equal(m.sheet,'rgb(255, 255, 255)');assert.equal(m.background,'rgba(0, 0, 0, 0)');assert.equal(m.position,'relative');assert.match(m.font,/Times New Roman/);near(m.size,16,'font size');near(m.line,24,'line height');
  assert.equal(await p.locator('style[data-thesis-styles]').evaluate(e=>!!e.sheet),true);
  assert.equal(await p.locator('.thesis-layout-text[style],.thesis-layout-spacer[style]').count(),0);
  const cover=await p.locator('.thesis-layout-text,.thesis-layout-spacer').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {kind:e.className,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,align:s.textAlign,line:s.lineHeight,before:s.marginTop,after:s.marginBottom,transform:s.textTransform,...(e.classList.contains('thesis-layout-spacer')?{height:s.height}:{})};}));
  return {geometry:m,cover};
}
async function focusBlank(p) {
  await paper(p).scrollIntoViewIfNeeded();
  await paper(p).click({position:{x:300,y:320}});
  assert.equal(await p.getByRole('button',{name:'Görsel',exact:true}).isEnabled(),true);
  assert.equal(await main(p).evaluate(e=>document.activeElement===e),true);
}
async function selectAll(p){await main(p).click();await p.keyboard.press('Control+a');}
async function focusEnd(p){await main(p).click();await p.keyboard.press('Control+End');}
async function imageChecks(p) {
  for(const [width,height] of [[200,100],[4000,3000]]) {
    const data=await p.evaluate(([w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#075985';x.fillRect(0,0,w,h);return c.toDataURL('image/png').split(',')[1];},[width,height]);
    await focusEnd(p);
    const chooser=p.waitForEvent('filechooser');await p.getByRole('button',{name:'Görsel',exact:true}).click();
    await (await chooser).setFiles({name:`smoke-${width}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')});
    await p.waitForFunction(n=>document.querySelectorAll('[data-thesis-flow-section="main"] img').length===n,width===200?1:2);
  }
  const image=main(p).locator('img').first();await image.click();
  await p.getByLabel('Görsel genişliği (px)').fill('160');await p.getByRole('button',{name:'Uygula',exact:true}).click();
  assert.equal(await image.getAttribute('width'),'160');
  const zoom=[];
  for(const level of [50,75,100,125,150]) {
    await p.getByLabel('Yakınlaştır',{exact:true}).selectOption(String(level));await image.scrollIntoViewIfNeeded();await image.click();
    const ib=await image.boundingBox(),cb=await p.locator('.academic-image-controls').boundingBox();
    for(const k of ['x','y','width','height']) near(ib[k],cb[k],`overlay ${level} ${k}`,2);
    near(ib.width,160*level/100,`image zoom ${level}`,2);zoom.push({level,image:ib,overlay:cb});
  }
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('75');await image.scrollIntoViewIfNeeded();await image.click();
  const handle=p.getByRole('button',{name:'Görseli boyutlandır sağ alt',exact:true});await handle.scrollIntoViewIfNeeded();
  const h=await handle.boundingBox();await p.mouse.move(h.x+h.width/2,h.y+h.height/2);await p.mouse.down();await p.mouse.move(h.x+h.width/2+30,h.y+h.height/2,{steps:5});await p.mouse.up();
  assert.equal(await image.getAttribute('width'),'200');
  await p.keyboard.press('Escape');await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
  assert.equal(await main(p).locator('img').last().evaluate(e=>e.complete&&e.naturalWidth===1200),true);
  return zoom;
}
async function formatChecks(p) {
  await main(p).fill('Desktop parity kayıt testi');await selectAll(p);
  await p.getByRole('button',{name:'Kalın',exact:true}).click();await p.getByRole('button',{name:'İtalik',exact:true}).click();
  assert.match(await main(p).innerHTML(),/fmt-bold|<strong|<b>/);assert.match(await main(p).innerHTML(),/fmt-italic|<em|<i>/);
  for(const level of [1,2,3,0]){await p.getByLabel('Paragraf biçimi').selectOption(String(level));if(level) assert.equal(await main(p).locator(`h${level}`).count(),1);}
  await focusEnd(p);await p.keyboard.press('Enter');await p.keyboard.type('Liste testi');
  await p.getByRole('button',{name:'Madde işaretli liste',exact:true}).click();assert.equal(await main(p).locator('ul').count(),1);
  await p.getByRole('button',{name:'Numaralı liste',exact:true}).click();assert.equal(await main(p).locator('ol').count(),1);
  await p.getByRole('button',{name:'Madde işaretli liste',exact:true}).click();assert.equal(await main(p).locator('ul').count(),1);
  assert.equal(await main(p).locator('li').innerText(),'Liste testi');
  await p.keyboard.type(' korunur');assert.match(await main(p).locator('li').innerText(),/Liste testi korunur/);
  await p.getByRole('button',{name:'Numaralı liste',exact:true}).click();assert.equal(await main(p).locator('ol').count(),1);
  await focusEnd(p);await p.keyboard.press('Enter');await p.keyboard.press('Enter');await p.getByRole('button',{name:'Tablo',exact:true}).click();
  assert.equal(await main(p).locator('td,th').count(),4);await main(p).locator('td').first().click();await p.keyboard.type('Hücre smoke');
  await focusEnd(p);await p.getByRole('button',{name:'Atıf',exact:true}).click();await p.getByLabel('Atıf / dipnot metni').fill('Desktop kaynağı 2026');await p.getByRole('button',{name:'Ekle',exact:true}).click();
  assert.match(await main(p).innerHTML(),/Desktop kaynağı 2026/);
  await p.getByRole('button',{name:'Kaynakça',exact:true}).click();await p.getByRole('button',{name:'+ Kaynak ekle',exact:true}).click();
  await p.getByLabel('Kaynakça maddesi 1').fill('Yazar (2026). Parity smoke kaynağı.');await p.getByRole('button',{name:'Tez bilgilerini kapat',exact:true}).click();
  assert.match(await p.locator('[data-thesis-flow-section="bibliography"]').innerText(),/Parity smoke kaynağı/);
}
async function printCheck(p) {
  await p.getByRole('button',{name:'Yazdır',exact:true}).click();
  await p.waitForFunction(()=>{const f=document.querySelector('iframe[srcdoc]');return !!f?.contentDocument?.querySelector('style')?.sheet;});
  const result=await p.locator('iframe[srcdoc]').evaluate(f=>{const d=f.contentDocument,s=d.querySelector('style'),paper=d.querySelector('.thesis-paper[data-thesis-section="main"]');return {sheetActive:!!s.sheet,nonceMatches:s.nonce===document.getElementById('txtnote-trusted-style').nonce,minHeight:getComputedStyle(paper).minHeight,printCalled:!!f.contentWindow.__smokePrintCalled};});
  assert.ok(result.sheetActive&&result.nonceMatches&&result.printCalled);near(parseFloat(result.minHeight),297*96/25.4,'print A4');
  await p.locator('iframe[srcdoc]').evaluate(f=>f.remove());return result;
}
// Task 7 pagination probes. Page indices are client rects divided by the display zoom,
// i.e. the unscaled A4 layout; every word of the smoke text is unique.
const smokePara=i=>`S${i}: `+Array.from({length:70},(_,k)=>`${['tez','metin','sayfa','akış'][k%4]}${i}.${k}`).join(' ')+'.';
const paging=(p,action,arg)=>p.evaluate(([action,arg])=>{
  const STRIDE=297*96/25.4+28,art=document.querySelector('.thesis-paper[data-thesis-section="main"]'),ed=art.querySelector('[contenteditable="true"]');
  const zoom=art.getBoundingClientRect().width/art.offsetWidth,pageOfY=y=>Math.floor((y-art.getBoundingClientRect().top)/zoom/STRIDE)+1;
  const texts=()=>{const w=document.createTreeWalker(ed,NodeFilter.SHOW_TEXT),l=[];for(let n=w.nextNode();n;n=w.nextNode()) l.push(n);return l;};
  const charRect=(n,i)=>{const r=document.createRange();r.setStart(n,i);r.setEnd(n,Math.min(n.length,i+1));return r.getClientRects()[0]||r.getBoundingClientRect();};
  const find=needle=>{for(const n of texts()){const i=n.data.indexOf(needle);if(i>=0) return {n,i};}return null;};
  const lineStart=(n,top)=>{let lo=0,hi=n.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(charRect(n,mid).bottom<=top+1) lo=mid+1;else hi=mid;}return lo;};
  const lines=()=>texts().flatMap(n=>{const r=document.createRange();r.selectNodeContents(n);return [...r.getClientRects()].filter(x=>x.height>0&&/\S/.test(n.data)).map(x=>({n,top:x.top,page:pageOfY((x.top+x.bottom)/2)}));});
  if(action==='state') {
    const fp=[];let seen=0;
    for(const n of texts()) for(let i=0;i<n.length;i+=1,seen+=1) {if(seen%61||!n.data[i].trim()) continue;const r=charRect(n,i);fp.push(pageOfY((r.top+r.bottom)/2));}
    const last=lines().filter(l=>l.page===1).sort((a,b)=>b.top-a.top)[0];
    return {count:Number(art.dataset.thesisPageCount),total:Number(document.querySelector('[data-thesis-total-pages]').dataset.thesisTotalPages),
      groups:[...document.querySelectorAll('.thesis-paper')].map(a=>[a.dataset.thesisSection,a.dataset.thesisLayout,Number(a.dataset.thesisPageCount)]),
      sheets:document.querySelectorAll('.thesis-sheet').length,labels:[...document.querySelectorAll('.thesis-sheet')].map(s=>s.querySelector('.thesis-page-number')?.textContent||''),
      fp:fp.join(','),lastOfPage1:last?last.n.data.slice(lineStart(last.n,last.top),lineStart(last.n,last.top)+24):''};
  }
  if(action==='pageOf') {const hit=find(arg);if(!hit) return -1;const r=charRect(hit.n,hit.i);return pageOfY((r.top+r.bottom)/2);}
  if(action==='caretMidPage1') {
    const onFirst=lines().filter(l=>l.page===1).sort((a,b)=>a.top-b.top),line=onFirst[Math.floor(onFirst.length/2)];
    const at=lineStart(line.n,line.top);ed.focus({preventScroll:true});document.getSelection().collapse(line.n,at);return line.n.data.slice(at,at+24);
  }
  if(action==='caret') {
    const r=document.getSelection().getRangeAt(0),after=document.createRange();after.setStart(r.startContainer,r.startOffset);after.setEnd(ed,ed.childNodes.length);
    return {active:document.activeElement===ed,collapsed:r.collapsed,after:after.toString().slice(0,24)};
  }
  if(action==='selectInserted') {
    const a=find('Smoke reflow '),b=find(arg),r=document.createRange();r.setStart(a.n,a.i);r.setEnd(b.n,b.i);
    document.getSelection().removeAllRanges();document.getSelection().addRange(r);return r.toString().length;
  }
},[action,arg]);
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
async function paginationChecks(p) {
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
  await main(p).click();
  for(let i=1;i<=34;i+=1) {if(i>1) await p.keyboard.press('Enter');await p.keyboard.insertText(smokePara(i));}
  await p.waitForFunction(()=>Number(document.querySelector('.thesis-paper[data-thesis-section="main"]').dataset.thesisPageCount)>=3);await frames(p);
  const before=await paging(p,'state');
  assert.ok(before.count>=3,`3+ A4 pages: ${before.count}`);assert.equal(before.sheets,before.total);
  assert.deepEqual(before.groups.map(([id,layout])=>[id,layout]),[['cover','paged'],['abstract','paged'],['toc','paged'],['main','paged'],['bibliography','paged']]);
  assert.equal(before.groups[0][2],1);
  assert.deepEqual(before.labels,['','i','ii',...Array.from({length:before.count},(_,i)=>String(i+1)),String(before.count+1)]);
  pass(`packaged pagination: ${before.count} main A4 pages, sections on their own pages, cover unnumbered, roman front matter, arabic main restarting at 1`);
  const anchor=await paging(p,'caretMidPage1');
  // Several lines of text inside one line box. Deleting a selection across <br> line
  // breaks makes Chromium add a style span (pre-existing, unrelated to pagination).
  await p.keyboard.type('Smoke reflow ');await p.keyboard.insertText('eklenen metin '.repeat(30));
  await frames(p);
  const caret=await paging(p,'caret');assert.equal(caret.active,true);assert.equal(caret.collapsed,true);assert.equal(caret.after,anchor);
  assert.equal(await paging(p,'pageOf',before.lastOfPage1),2,'last line of page 1 reflowed onto page 2');
  const grown=await paging(p,'state');assert.notEqual(grown.fp,before.fp);assert.equal(grown.sheets,grown.total);
  assert.ok((await paging(p,'selectInserted',anchor))>400);await p.keyboard.press('Backspace');await frames(p);
  const restored=await paging(p,'state');
  assert.equal(restored.fp,before.fp);assert.equal(restored.count,before.count);assert.equal(await paging(p,'pageOf',before.lastOfPage1),1);
  pass('packaged live reflow: typing mid page 1 pushes text to page 2 with caret/focus kept; deleting flows it back to identical breaks');
  for(const level of ['50','75','100','125','150']) {
    await p.getByLabel('Yakınlaştır',{exact:true}).selectOption(level);await frames(p);
    const zoomed=await paging(p,'state');assert.equal(zoomed.count,before.count,`pages at ${level}%`);assert.equal(zoomed.total,before.total);assert.equal(zoomed.fp,before.fp,`breaks at ${level}%`);
  }
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('75');await frames(p);
  await p.screenshot({path:path.join(output,'desktop-pagination.png')});
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
  pass('packaged zoom 50/75/100/125/150 keeps page count and page breaks');
  return before;
}
// Task 9: PDF/Word export from the packaged app at a non-100% zoom. The PDF must have the
// editor's sheets and labels; the DOCX must carry real A4/section/numbering structure.
async function exportChecks(p,extensions=false) {
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('75');await frames(p);
  const editor=await paging(p,'state');
  const saved={};
  for(const [button,extension] of [['PDF','.pdf'],['Word','.docx']]) {
    await p.getByRole('button',{name:button,exact:true}).click();
    const message=await p.waitForFunction(ext=>[...document.querySelectorAll('[role="status"]')].map(e=>e.textContent||'').find(t=>t.startsWith('Kaydedildi: ')&&t.endsWith(ext)),extension,{timeout:30000});
    saved[extension]=(await message.jsonValue()).slice('Kaydedildi: '.length);
  }
  const frontend=path.join(root,'frontend/node_modules');
  const {getDocument}=await import(new URL(`file:///${path.join(frontend,'pdfjs-dist/legacy/build/pdf.mjs').replaceAll('\\','/')}`).href);
  const {unzipSync,strFromU8}=require(path.join(frontend,'fflate'));
  const task=getDocument({data:new Uint8Array(fs.readFileSync(saved['.pdf'])),useSystemFonts:true,disableFontFace:true});
  const pdf=await task.promise;
  assert.equal(pdf.numPages,editor.total,'PDF pages = editor sheets');
  for(let i=1;i<=pdf.numPages;i+=1) {
    const page=await pdf.getPage(i);
    near(page.view[2],595.28,`PDF page ${i} width`);near(page.view[3],841.89,`PDF page ${i} height`);
    const label=editor.labels[i-1],items=(await page.getTextContent()).items.map(item=>item.str.trim());
    if(label) assert.ok(items.includes(label),`PDF page ${i} number ${label}`);
  }
  await task.destroy();
  const xml=strFromU8(unzipSync(new Uint8Array(fs.readFileSync(saved['.docx'])))['word/document.xml']);
  assert.match(xml,/<w:pgSz w:w="1190[56]" w:h="1683[78]"/);assert.match(xml,/<w:pgMar /);
  assert.match(xml,/<w:pgNumType w:start="1" w:fmt="lowerRoman"\/>/);assert.match(xml,/<w:pgNumType w:start="1" w:fmt="decimal"\/>/);
  assert.match(xml,/w:type w:val="nextPage"/);assert.match(xml,/w:pStyle w:val="Heading1"/);
  if(extensions) {
    const files=unzipSync(new Uint8Array(fs.readFileSync(saved['.docx'])));
    assert.match(xml,/w:pStyle w:val="Heading4"/);assert.match(strFromU8(files['word/styles.xml']),/w:styleId="Heading4"[\s\S]*?w:outlineLvl w:val="3"/);
    assert.match(xml,/<w:br\/>/);assert.match(xml,/w:firstLine="567"/);assert.match(xml,/<w:tbl>/);assert.match(xml,/<w:tab\/>/);
    assert.ok(files['word/footnotes.xml']);assert.ok(Object.keys(files).some(n=>n.startsWith('word/media/')));
    assert.match(xml,/Şekil 1\.1\. Şekil caption metni/);assert.match(xml,/Tablo 1\.1\. Tablo caption metni/);
    pass('packaged DOCX: real paragraph indent/spacing, inner break, Heading4 outline, generated indexes, captions, Word table/image and true footnote');
  }
  for(const file of Object.values(saved)) fs.rmSync(file,{force:true});
  pass(`packaged export at 75%: PDF ${pdf.numPages} A4 pages = editor sheets with the same labels; DOCX A4, sections, roman→arabic restarts, heading styles`);
  await p.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
  return {pages:pdf.numPages,labels:editor.labels};
}
const snapshot=p=>main(p).evaluate(e=>({text:e.innerText,images:[...e.querySelectorAll('img')].map(i=>({src:i.src,width:i.getAttribute('width'),height:i.getAttribute('height')})),table:e.querySelector('table')?.textContent}));
async function openTitle(p,title){await p.getByRole('button',{name:title,exact:true}).first().click();await main(p).waitFor();}
// Explicit Task 8 scope: reuse the packaged harness, excluding the two known bug paths.
async function specialPageChecks() {
  report.scope='special-pages';
  await launchDesktop();
  const title=`Special pages smoke ${identity.buildId}`;
  await createThesis(page,title);
  report.desktop=await checkGeometry(page);
  await focusBlank(page);
  pass('demo A data-driven cover, A4 geometry and editable body focus');
  await page.getByRole('button',{name:'Tez bilgileri',exact:true}).click();
  await page.getByLabel('Tez şablonu',{exact:true}).selectOption('demo-university-b-master-tr-v1');
  const cover=page.locator('[data-thesis-special-page="outerCover"]');
  const approval=page.locator('[data-thesis-special-page="approval"]');
  const ethics=page.locator('[data-thesis-special-page="ethicsDeclaration"]');
  await approval.waitFor({state:'attached'});
  await page.getByLabel('Öğrenci *',{exact:true}).fill('Ster');
  await page.waitForFunction(()=>document.querySelector('[data-thesis-special-page="outerCover"] [data-thesis-field="STUDENT_NAME"]')?.textContent==='Ster');
  await page.getByLabel('Öğrenci *',{exact:true}).fill('Ahmet Yılmaz');
  await page.getByLabel('Jüri üyesi 1 (Başkan)',{exact:true}).fill('Prof. Dr. Demo');
  await page.getByLabel('Savunma tarihi',{exact:true}).fill('2026-09-26');
  await page.getByRole('button',{name:'Tez bilgilerini kapat',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-thesis-special-page="outerCover"] [data-thesis-field="STUDENT_NAME"]')?.textContent==='Ahmet Yılmaz');
  assert.match(await approval.innerText(),/TEZ ONAY SAYFASI[\s\S]*Ahmet Yılmaz[\s\S]*Prof\. Dr\. Demo[\s\S]*26\.09\.2026/);
  assert.match(await ethics.innerText(),/ETİK BEYAN[\s\S]*beyan ederim[\s\S]*Ahmet Yılmaz/);
  assert.equal(await page.locator('[data-thesis-special-page] [contenteditable="true"]').count(),0);
  assert.equal(await page.locator('[data-thesis-special-page] [style]').count(),0);
  const state=await paging(page,'state');
  assert.deepEqual(state.groups.map(g=>g[0]),['cover','approval','ethics','abstract','toc','main','bibliography']);
  assert.deepEqual(state.groups.slice(0,3).map(g=>g[2]),[1,1,1]);
  assert.deepEqual(state.labels,['','','ii','iii','iv','1','2']);
  near(await approval.evaluate(e=>parseFloat(getComputedStyle(e.closest('.thesis-paper')).paddingTop)),35*96/25.4,'approval top margin');
  assert.match(await approval.locator('[data-thesis-field="STUDENT_NAME"]').evaluate(e=>getComputedStyle(e).fontFamily),/Arial/);
  pass('live metadata, generic approval/declaration, read-only layout, margins, order and Roman/Arabic restarts');
  await approval.scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,'desktop-special-pages.png')});
  await main(page).fill(Array.from({length:24},(_,i)=>smokePara(i)).join('\n'));
  await page.waitForFunction(()=>Number(document.querySelector('.thesis-paper[data-thesis-section="main"]').dataset.thesisPageCount)>=2);
  await frames(page);
  const grown=await paging(page,'state');
  assert.equal(grown.sheets,grown.total);
  assert.deepEqual(grown.labels.slice(5,5+grown.count),Array.from({length:grown.count},(_,i)=>String(i+1)));
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('75');await frames(page);
  assert.equal((await paging(page,'state')).count,grown.count);
  // Replace via input, without exercising the excluded multiline Backspace path.
  await main(page).fill('Görev 8 kalıcı ana metin');
  await page.waitForFunction(()=>Number(document.querySelector('.thesis-paper[data-thesis-section="main"]').dataset.thesisPageCount)===1);
  await page.getByLabel('Özet metni',{exact:true}).fill('Görev 8 kalıcı özet');
  pass('editable sections, forward/backward reflow and zoom preserve page model');
  const saved=await snapshot(page);
  await page.waitForTimeout(2000);
  await page.reload();await unlock(page);await openTitle(page,title);
  assert.deepEqual(await snapshot(page),saved);
  assert.equal(await page.getByLabel('Özet metni',{exact:true}).innerText(),'Görev 8 kalıcı özet');
  assert.match(await cover.innerText(),/Ahmet Yılmaz/);
  assert.match(await approval.innerText(),/Prof\. Dr\. Demo/);
  assert.deepEqual((await paging(page,'state')).labels,state.labels);
  pass('reload preserves body, section content and metadata; pages recompute correctly');
}
async function currentReleaseChecks() {
  report.scope='current-release';
  await launchDesktop();
  const title=`Installer release ${identity.buildId}-${Date.now()}`;
  await createThesis(page,title,{university:'mcbu',degree:'master'});
  assert.equal(await page.locator('.thesis-titlebar').count(),0);
  for(const name of ['Dosya','Giriş','Ekle','Düzen','Başvurular','Görünüm']) {
    await page.getByRole('tab',{name,exact:true}).click();
    const shortcuts=page.getByRole('group',{name:'Belge panelleri',exact:true});
    assert.equal(await shortcuts.getByRole('button',{name:'Tez bilgileri',exact:true}).isEnabled(),true);
    assert.equal(await shortcuts.getByRole('button',{name:'Sayfa düzeni',exact:true}).isEnabled(),true);
  }
  pass('current official template, six ribbon tabs and persistent panel shortcuts; removed title bar');
  await page.getByRole('tab',{name:'Giriş',exact:true}).click();
  const text='Installer kayıt ve export doğrulaması';
  await main(page).fill(text);await main(page).press('End');await main(page).press('Shift+Home');
  await page.getByRole('button',{name:'Kalın',exact:true}).click();
  assert.ok(await main(page).evaluate(node=>[...node.querySelectorAll('span,strong,b')].some(el=>Number(getComputedStyle(el).fontWeight)>=700)));
  await page.getByRole('button',{name:'Sola hizala',exact:true}).click();
  for(const level of ['75','100','125']) await page.getByLabel('Yakınlaştır',{exact:true}).selectOption(level);
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
  await frames(page);
  near((await metrics(page)).width,210*96/25.4,'packaged A4 width');
  pass('packaged editing, bold, paragraph alignment, zoom and A4 canvas');
  await page.getByRole('tab',{name:'Dosya',exact:true}).click();
  const saved={};
  for(const [button,extension] of [['PDF','.pdf'],['Word','.docx']]) {
    await page.getByRole('button',{name:button,exact:true}).click();
    const result=await page.waitForFunction(ext=>[...document.querySelectorAll('[role="status"]')].map(e=>e.textContent||'').find(t=>t.startsWith('Kaydedildi: ')&&t.endsWith(ext)),extension,{timeout:60000});
    saved[extension]=(await result.jsonValue()).slice('Kaydedildi: '.length);
  }
  const frontend=path.join(root,'frontend/node_modules');
  const {unzipSync,strFromU8}=require(path.join(frontend,'fflate'));
  const files=unzipSync(new Uint8Array(fs.readFileSync(saved['.docx'])));
  const xml=strFromU8(files['word/document.xml']);
  assert.match(xml,/Installer kayıt ve export doğrulaması/);
  assert.match(strFromU8(files['word/settings.xml']),/<w:updateFields w:val="false"\s*\/>/);
  assert.doesNotMatch(xml,/w:dirty="true"/);
  assert.match(xml,/TOC \\h/);
  const {getDocument}=await import(new URL(`file:///${path.join(frontend,'pdfjs-dist/legacy/build/pdf.mjs').replaceAll('\\','/')}`).href);
  const task=getDocument({data:new Uint8Array(fs.readFileSync(saved['.pdf'])),disableFontFace:true});
  const pdf=await task.promise;let found=false;
  for(let i=1;i<=pdf.numPages;i++) {
    const sheet=await pdf.getPage(i);near(sheet.view[2],595.28,'PDF A4 width');near(sheet.view[3],841.89,'PDF A4 height');
    found ||= (await sheet.getTextContent()).items.some(item=>item.str.includes('Installer kayıt'));
  }
  assert.ok(found,'real packaged PDF preserves entered text');
  report.export={pages:pdf.numPages,fieldsUpdateOnOpen:false};await task.destroy();
  pass('real packaged PDF and DOCX exports retain text, A4 and live TOC without automatic opening updates');
  await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,title);
  assert.match(await main(page).innerText(),/Installer kayıt ve export doğrulaması/);
  await page.waitForTimeout(2000);await closeDesktop();await launchDesktop();await openTitle(page,title);
  assert.match(await main(page).innerText(),/Installer kayıt ve export doğrulaması/);
  assert.ok(await main(page).evaluate(node=>[...node.querySelectorAll('span,strong,b')].some(el=>Number(getComputedStyle(el).fontWeight)>=700)));
  pass('SQLite autosave, reload and full application restart preserve text and formatting');
  await page.screenshot({path:path.join(output,'installer-current-release.png')});
  for(const file of Object.values(saved)) fs.rmSync(file,{force:true});
}
try {
  if(!process.env.TXTNOTE_SMOKE_SCOPE||process.env.TXTNOTE_SMOKE_SCOPE==='current-release') {
    await currentReleaseChecks();
  } else if(process.env.TXTNOTE_SMOKE_SCOPE==='special-pages') {
    await specialPageChecks();
  } else {
  // Production web preview serves the exact frontend dist which Tauri embeds.
  server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'frontend/dist','.'+decodeURIComponent(url.pathname));
    if(file!==path.join(root,'frontend/dist')&&!file.startsWith(path.join(root,'frontend/dist')+path.sep)){res.writeHead(403).end();return;}
    const target=fs.existsSync(file)&&fs.statSync(file).isFile()?file:path.join(root,'frontend/dist/index.html');
    const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
    res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  webBrowser=await chromium.launch({channel:'msedge',headless:true});
  const web=await webBrowser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.25});await observe(web,false);
  await web.addInitScript(()=>sessionStorage.setItem('txtnote.auth.bypass',JSON.stringify({authenticated:true,bypass:true,method:'bypass'})));
  await web.goto(`http://127.0.0.1:${server.address().port}/`);await unlock(web);
  const title=`Desktop parity smoke ${identity.buildId}-${Date.now()}`;
  await createThesis(web,title);report.web=await checkGeometry(web);await focusBlank(web);pass('production web A4 and blank-paper focus');
  await launchDesktop();await createThesis(page,title);report.desktop=await checkGeometry(page);
  for(const k of ['width','minHeight','size','line']) near(report.web.geometry[k],report.desktop.geometry[k],`web/desktop ${k}`);
  for(const k of ['background','sheet','layout','position','font']) assert.equal(report.web.geometry[k],report.desktop.geometry[k]);
  report.web.geometry.padding.forEach((v,i)=>near(v,report.desktop.geometry.padding[i],'web/desktop padding'));
  assert.equal(report.desktop.cover.length,report.web.cover.length);
  report.web.cover.forEach((w,i)=>Object.entries(w).forEach(([k,value])=>{
    const actual=report.desktop.cover[i][k];
    if(['size','line','before','after','height'].includes(k)&&Number.isFinite(parseFloat(value))) near(parseFloat(actual),parseFloat(value),`cover ${i} ${k}`,0.1);
    else assert.equal(actual,value,`cover ${i} ${k}`);
  }));pass('packaged A4 geometry, typography, cover and stylesheet parity');
  await focusBlank(page);pass('real white A4 blank-area click activates existing editor and toolbar');
  await formatChecks(page);pass('bold, italic, H1/H2/H3, lists, editable table, citation and bibliography');
  report.zoom=await imageChecks(page);pass('small/large file picker images, selection, resize, five zoom levels');
  report.print=await printCheck(page);pass('actual print/srcdoc stylesheet active under production CSP');
  const saved=await snapshot(page);report.savedImages=saved.images.map(i=>({sha256:sha256(i.src),width:i.width,height:i.height}));
  await page.waitForTimeout(2000);
  await page.getByRole('button',{name:'Yeni İçerik Ekle',exact:true}).click();await page.getByRole('button',{name:'Tüm şablonları keşfet',exact:true}).click();
  await openTitle(page,title);assert.deepEqual(await snapshot(page),saved);pass('switch document and reopen preserves image and dimensions');
  await page.reload();await unlock(page);await openTitle(page,title);assert.deepEqual(await snapshot(page),saved);pass('reload preserves formatting, table, image data and dimensions');
  await page.screenshot({path:path.join(output,'desktop-a4.png')});
  await main(page).locator('img').first().scrollIntoViewIfNeeded();await main(page).locator('img').first().click();
  await page.screenshot({path:path.join(output,'desktop-image-a4.png')});await page.keyboard.press('Escape');
  await paper(web).scrollIntoViewIfNeeded();await web.screenshot({path:path.join(output,'web-a4.png')});
  await page.waitForTimeout(1500);await closeDesktop();await launchDesktop();await openTitle(page,title);
  assert.deepEqual(await snapshot(page),saved);pass('full application exit/restart preserves images, size and content');
  // Task 7: real pagination in the packaged WebView2 on a fresh text thesis, then a full restart.
  const pagedTitle=`${title} sayfalama`;
  // The add menu closes on window blur/resize/scroll; let the restarted window settle first.
  await page.waitForTimeout(2000);
  await createThesis(page,pagedTitle);report.pagination=await paginationChecks(page);report.export=await exportChecks(page);
  await page.waitForTimeout(2000);await closeDesktop();await launchDesktop();await openTitle(page,pagedTitle);
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await frames(page);
  const reopened=await paging(page,'state');
  for(const k of ['count','total','labels','fp','groups']) assert.deepEqual(reopened[k],report.pagination[k],`after restart: ${k}`);
  pass('application exit/restart recomputes the same pages, breaks and numbering from the saved content');
  const extensionTitle=`${title} task10a`;
  // As above, let the restarted window and zoom/scroll settle before opening
  // the add menu: window blur/resize/scroll deliberately dismisses that menu.
  await page.waitForTimeout(2000);
  await createThesis(page,extensionTitle);
  report.extensions=await task10aChecks(page,pass);
  report.extensionExport=await exportChecks(page,true);
  const extensionSnapshot=await snapshot(page);
  await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,extensionTitle);
  await page.waitForFunction(()=>Number(document.querySelector('[data-thesis-generated="tables"] .thesis-index-page')?.textContent)>1);
  assert.deepEqual(await snapshot(page),extensionSnapshot);
  assert.deepEqual(await page.locator('[data-index-target]').evaluateAll(es=>es.map(e=>[e.dataset.indexTarget,e.querySelector('.thesis-index-page').textContent])),report.extensions.final);
  pass('packaged save/reload preserves paragraphs, caption source and all three regenerated indexes');
  // Task 10A.1: page-bottom footnotes on a representative thesis in the packaged WebView2.
  const footnoteTitle=`${title} task10a1`;
  await page.waitForTimeout(2000);
  await createThesis(page,footnoteTitle);
  const exportViaApp=async()=>{
    const saved={};
    for(const [button,extension] of [['PDF','.pdf'],['Word','.docx']]) {
      await page.getByRole('button',{name:button,exact:true}).click();
      const message=await page.waitForFunction(ext=>[...document.querySelectorAll('[role="status"]')].map(e=>e.textContent||'').find(t=>t.startsWith('Kaydedildi: ')&&t.endsWith(ext)),extension,{timeout:30000});
      saved[extension]=(await message.jsonValue()).slice('Kaydedildi: '.length);
    }
    return {pdf:saved['.pdf'],docx:saved['.docx']};
  };
  report.footnotes=await task10a1Checks(page,pass,exportViaApp);
  for(const file of Object.values(report.footnotes.files)) fs.rmSync(file,{force:true});
  const footnoteText=await snapshot(page);
  await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,footnoteTitle);
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await settleFootnotes(page);
  assert.deepEqual(await snapshot(page),footnoteText);
  const reopenedNotes=await footnoteState(page);assertConsistent(reopenedNotes,'packaged reload');
  assert.equal(briefState(reopenedNotes),report.footnotes.layout);
  pass('packaged save/reload: same source text and footnotes, note placement recomputed identically from the saved content');
  // Task 10B: the official MCBÜ template, created from the real thesis creator (Doktora).
  const mcbuTitle=`Çevrimiçi Öğrenme Ortamlarında Dijital Okuryazarlık ${identity.buildId}-${Date.now()}`;
  await page.waitForTimeout(2000);
  await createThesis(page,mcbuTitle,{university:'mcbu',degree:'phd'});
  await fillMcbuThesis(page,{degree:'phd',selectTemplate:false,title:mcbuTitle});
  report.mcbu=await task10bChecks(page,pass,exportViaApp,{degree:'phd',title:mcbuTitle});
  for(const file of Object.values(report.mcbu.files)) fs.rmSync(file,{force:true});
  const mcbuText=await page.locator('.thesis-page-stack').allInnerTexts();
  await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,mcbuTitle);
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await settleFootnotes(page);
  assert.deepEqual(await sheetLabels(page),report.mcbu.labels);
  assert.deepEqual(await page.locator('.thesis-page-stack').allInnerTexts(),mcbuText);
  pass('packaged MCBÜ save/reload: metadata, section texts, indexes and page labels recomputed identically');
  // Task 10B.1: MCBÜ polish on a master's thesis (Word line pitch, captions, co-advisor, derived total pages).
  const polishTitle=`MCBÜ Yüksek Lisans ${identity.buildId}-${Date.now()}`;
  await page.waitForTimeout(2000);
  await createThesis(page,polishTitle,{university:'mcbu',degree:'master'});
  await fillMcbuThesis(page,{degree:'master',selectTemplate:false,title:polishTitle});
  report.mcbuPolish=await task10b1Checks(page,pass,exportViaApp);
  for(const file of Object.values(report.mcbuPolish.files)) fs.rmSync(file,{force:true});
  report.mcbuFinal=await task10b2Checks(page,pass,async(prefix)=>{
    const files=await exportViaApp();
    const evidence=path.join(root,'output/task10b2');fs.mkdirSync(evidence,{recursive:true});
    for(const [extension,file] of Object.entries(files)) {
      const copy=path.join(evidence,`packaged-${prefix}.${extension}`);
      fs.copyFileSync(file,copy);files[extension]=copy;fs.rmSync(file,{force:true});
    }
    return files;
  });
  const polishText=await page.locator('.thesis-page-stack').allInnerTexts();const polishLabels=await sheetLabels(page);
  await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,polishTitle);
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await settleFootnotes(page);
  assert.deepEqual(await sheetLabels(page),polishLabels);
  assert.deepEqual(await page.locator('.thesis-page-stack').allInnerTexts(),polishText);
  assert.ok(polishText.join('\n').includes(`2026, ${polishLabels.length} sayfa`),'reopened Özet shows the recomputed total');
  pass(`packaged MCBÜ master save/reload: same text and ${polishLabels.length} pages, total page count recomputed (not stored)`);
  report.blankPages=await blankPageChecks(page,pass,async(kind)=>{
    const files=await exportViaApp();
    const evidence=path.join(root,'output/blank-pages');fs.mkdirSync(evidence,{recursive:true});
    for(const [extension,file] of Object.entries(files)) {
      const copy=path.join(evidence,`packaged-${kind}.${extension}`);
      fs.copyFileSync(file,copy);files[extension]=copy;fs.rmSync(file,{force:true});
    }
    return files;
  });
  const layoutTitle=`Sayfa düzeni ${identity.buildId}-${Date.now()}`;
  await page.waitForTimeout(2000);
  await createThesis(page,layoutTitle,{university:'mcbu',degree:'master'});
  await fillMcbuThesis(page,{degree:'master',selectTemplate:false,title:layoutTitle});
  report.pageLayout=await layoutEditorChecks(page,pass,{reload:async()=>{
    await page.waitForTimeout(2000);await page.reload();await unlock(page);await openTitle(page,layoutTitle);
  }});
  const layoutFiles=await exportViaApp();
  const layoutEvidence=path.join(root,'output/page-layout');fs.mkdirSync(layoutEvidence,{recursive:true});
  for(const [extension,file] of Object.entries(layoutFiles)) {
    const copy=path.join(layoutEvidence,`packaged-layout.${extension}`);
    fs.copyFileSync(file,copy);layoutFiles[extension]=copy;fs.rmSync(file,{force:true});
  }
  report.pageLayout.files=layoutFiles;
  report.pageLayout.semantic=await layoutExportChecks(page,layoutFiles,{toleranceMm:.25,pageCount:await page.locator('.thesis-sheet').count(),elements:[
    {id:report.pageLayout.id,type:'text',text:'Canonical editable text',xMm:40.25,yMm:42,widthMm:140,fontFamily:'Times New Roman',fontSizePt:12},
    {selector:'[data-layout-type="image"]',type:'image',...report.pageLayout.imageGeometry},
  ]});
  const wordPdf=path.join(layoutEvidence,'packaged-word.pdf'),wordReport=path.join(layoutEvidence,'packaged-word.json'),fidelityReport=path.join(layoutEvidence,'packaged-fidelity.json');
  for(const [command,args] of [
    ['powershell.exe',['-NoProfile','-STA','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts/verify-layout-word.ps1'),'-DocumentPath',layoutFiles.docx,'-PdfPath',wordPdf,'-ReportPath',wordReport]],
    [process.execPath,[path.join(root,'scripts/verify-layout-fidelity.mjs'),layoutFiles.pdf,wordPdf,wordReport,fidelityReport]],
  ]) {
    const result=spawnSync(command,args,{cwd:root,windowsHide:true,encoding:'utf8'});
    if(result.error||result.status!==0)throw Error(`Packaged Word fidelity failed: ${result.error?.message||result.stdout||result.stderr}`);
  }
  report.pageLayout.word=JSON.parse(fs.readFileSync(wordReport,'utf8').replace(/^\uFEFF/,''));
  const fidelity=JSON.parse(fs.readFileSync(fidelityReport,'utf8'));
  report.pageLayout.visual={status:fidelity.status,differences:fidelity.differences};
  pass('packaged PDF/DOCX semantic round-trip and real Word-render geometry/page-count fidelity');
  await page.locator(`[data-layout-id="${report.pageLayout.id}"]`).click();
  await page.getByLabel('Yazı tipi',{exact:true}).fill('Arial');
  const arialFiles=await exportViaApp();
  report.pageLayout.arialFonts=embeddedPdfFonts(fs.readFileSync(arialFiles.pdf || arialFiles['.pdf']));
  assert.ok(report.pageLayout.arialFonts.some(font=>font.family==='Arial'&&font.postscript==='ArialMT'));
  assert.ok(report.pageLayout.arialFonts.some(font=>font.family==='Times New Roman'));
  for(const file of Object.values(arialFiles))fs.rmSync(file,{force:true});
  await page.getByLabel('Yazı tipi',{exact:true}).fill('Times New Roman');
  pass('native Windows font command embeds actual Arial alongside Times New Roman in packaged PDF');
  await page.screenshot({path:path.join(layoutEvidence,'packaged-editor.png')});
  await page.waitForTimeout(2000);await closeDesktop();await launchDesktop();await openTitle(page,layoutTitle);
  const persisted=page.locator(`[data-layout-id="${report.pageLayout.id}"]`);
  assert.equal(await persisted.innerText(),'Canonical editable text');
  const bounds=await persisted.evaluate(node=>{const r=node.getBoundingClientRect(),p=node.closest('.thesis-paper').getBoundingClientRect();return {xMm:(r.left-p.left)*210/p.width,yMm:(r.top-p.top)*210/p.width,widthMm:r.width*210/p.width};});
  for(const key of ['xMm','yMm','widthMm']) near(bounds[key],report.pageLayout.saved[key],`layout restart ${key}`,0.02);
  pass('canonical page geometry, text and styles persist through SQLite and full application restart');
  }
  const blocked=await page.locator('style').evaluateAll(es=>es.filter(e=>!e.sheet).length);assert.equal(blocked,0);
  assert.deepEqual(report.cspViolations,[]);assert.deepEqual(report.securityLogs,[]);assert.deepEqual(report.pageErrors,[]);pass('zero CSP violations, blocked stylesheets, security messages or page errors');
  report.status='passed';
} catch(error) {
  report.error=error.stack;console.error(error);
  const failed=page||failurePage;
  if(failed) {await failed.screenshot({path:path.join(output,'smoke-failure.png')}).catch(()=>{});fs.writeFileSync(path.join(output,'smoke-failure-dom.txt'),await failed.locator('body').innerText().catch(()=>''));}
  process.exitCode=1;
} finally {
  fs.writeFileSync(path.join(output,'smoke.json'),JSON.stringify(report,null,2)+'\n');
  await closeDesktop().catch(error=>{console.error(error.message);process.exitCode=1;});
  await webBrowser?.close();await new Promise(r=>server?server.close(r):r());
}
