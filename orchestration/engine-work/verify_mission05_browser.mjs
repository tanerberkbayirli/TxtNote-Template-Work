import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {embeddedPdfFonts} from '../../TxtNote/frontend/tests/pdf-font-compliance.mjs';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const out='orchestration/engine-work/mission05/',browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5176'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const fixture=JSON.parse(readFileSync('orchestration/specs/engine-mission05-typography.fixture.json','utf8'));
const seed=async value=>{await page.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(v)),value);await page.reload();await page.locator('.thesis-sheet').first().waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');};
try{
 await seed(fixture);await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
 const p=page.locator('[data-thesis-flow-section="J01"] .thesis-body p').first();
 const before=await p.textContent();await p.click();await page.keyboard.press('Home');await page.keyboard.insertText('Düzenleme05 ');
 await page.waitForFunction(()=>window.thesisTest.getDoc().content.includes('Düzenleme05'));
 await page.keyboard.press('Control+z');await page.waitForFunction(()=>!window.thesisTest.getDoc().content.includes('Düzenleme05'));
 assert.equal(await p.textContent(),before);
 await page.keyboard.press('Control+y');await page.waitForFunction(()=>window.thesisTest.getDoc().content.includes('Düzenleme05'));
 const source=await page.evaluate(()=>window.thesisTest.getDoc());assert.doesNotMatch(JSON.stringify(source),/data-thesis-word-fit/);
 await page.reload();await p.waitFor();assert.match(await p.textContent(),/Düzenleme05/);
 const presentation=await page.evaluate(async()=>{
  const {layoutWordJustification}=await import('/engine/wordLineLayout.js');
  const {thesisSourceHtml}=await import('/engine/sourceHtml.js');
  const root=document.querySelector('[aria-label="Belge sayfaları"]'),p=root.querySelector('[data-thesis-flow-section="J01"] .thesis-body p');
  const model={sections:[{id:'J01',rules:{}}]};const clean=thesisSourceHtml(p.innerHTML),count=p.querySelectorAll('[data-thesis-word-fit]').length;
  const w=document.createTreeWalker(p,4);w.nextNode();const n=w.currentNode,s=getSelection();s.setBaseAndExtent(n,Math.min(3,n.length),n,Math.min(7,n.length));const selected=s.toString();
  p.style.width='500px';layoutWordJustification(root,model);const selectionRetained=s.toString()===selected;
  const once=p.innerHTML;layoutWordJustification(root,model);const idempotent=p.innerHTML===once;
  root.__thesisComposing=true;p.style.width='510px';const during=p.innerHTML;const imeSkipped=!layoutWordJustification(root,model)&&during===p.innerHTML;
  root.__thesisComposing=false;layoutWordJustification(root,model);const caughtUp=during!==p.innerHTML;
  p.style.textAlign='left';layoutWordJustification(root,model);const removed=!p.querySelector('[data-thesis-word-fit],wbr[data-thesis-word-fit-break]');
  return {wrappers:count,sourcePreserved:thesisSourceHtml(p.innerHTML)===clean,selectionRetained,idempotent,imeSkipped,caughtUp,removed};
 });
 for(const [key,value] of Object.entries(presentation))assert.ok(value,key);
 // A family used only by an inline run must still be embedded genuinely.
 const inline=structuredClone(fixture);inline.__template.sections=inline.__template.sections.slice(0,1);
 inline.content='<p>Temel metin <span data-txt-node-id="inline-font-test">Arial yalnızca satır içi Çığ İZMİR</span> son.</p>';
 inline.researchData.thesis.sectionContent={J01:inline.content};
 const nativeFamily=async(value,family)=>page.evaluate(async({value,family})=>{
  const {prepareThesisNote,installContentDocument}=await import('/engine/contentModel.js');
  const note=prepareThesisNote(value),doc=note.researchData.thesis.document;doc.source.format='docx';
  const walk=nodes=>{for(const n of nodes){if(n.id==='inline-font-test')n.properties={direct:{fontFamily:family}};walk(n.children||[]);}};
  for(const section of doc.sections)walk(section.nodes);return installContentDocument(note,doc);
 },{value,family});
 const inlineNative=await nativeFamily(inline,'Arial');await seed(inlineNative);
 await page.getByRole('tab',{name:'Dosya',exact:true}).click();
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:120000}),page.getByRole('button',{name:'PDF',exact:true}).click()]);await download.saveAs(out+'inline-font.pdf');
 const fonts=embeddedPdfFonts(readFileSync(out+'inline-font.pdf'));assert.ok(fonts.some(f=>f.family==='Arial'));assert.ok(fonts.some(f=>f.family==='Times New Roman'));
 for(const f of fonts)assert.equal(f.name,f.postscript);
 // An absent inline family has an explicit UI warning and blocks PDF substitution.
 const missing=await nativeFamily(inline,'Mission05MissingFont');await seed(missing);
 await page.locator('.thesis-ribbon-warning summary').click();await page.getByText('Mission05MissingFont yazı tipi bu cihazda bulunamadı;', {exact:false}).waitFor();
 await page.getByRole('tab',{name:'Dosya',exact:true}).click();await page.getByRole('button',{name:'PDF',exact:true}).click();await page.locator('.thesis-ribbon-message[role="status"]').filter({hasText:/Mission05MissingFont.*izin verilen/}).waitFor();
 await page.screenshot({path:out+'missing-font.png'});assert.deepEqual(errors,[]);
 const matrixFonts=embeddedPdfFonts(readFileSync(out+'source-matrix-final/run/default.pdf'));
 for(const family of ['Times New Roman','Arial','Calibri']){
  const faces=matrixFonts.filter(f=>f.family===family);assert.equal(faces.length,4,family);for(const f of faces){assert.equal(f.name,f.postscript);assert.equal(f.fsType&2,0);}
 }
 writeFileSync(out+'browser-verification.json',JSON.stringify({status:'PASS',browser:browser.version(),editUndoRedoReload:true,cleanPersistedSource:true,presentation,inlineFontEmbedded:true,missingFontVisible:true,missingFontExportRejected:true,pageErrors:errors,inlineFonts:fonts,matrixFonts},null,2));
 console.log('PASS: edit/undo/redo/reload, selection/IME/idempotence, genuine inline/matrix fonts, visible missing-font rejection');
}catch(e){await page.screenshot({path:out+'browser-failure.png'});throw e;}finally{await browser.close();}

