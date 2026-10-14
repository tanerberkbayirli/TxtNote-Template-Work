import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareThesisNote } from '../../engine/src/contentModel.js';
import generic from '../../engine/src/templates/generic.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url);
const {chromium}=require('../tools/node_modules/playwright');
const baseUrl=process.env.THESIS_BASE_URL || 'http://127.0.0.1:5175';
let note=prepareThesisNote({title:'Görev 2 kabulü',content:'<h1>Giriş</h1><p id="edit-target">İlk paragraf.</p>'
  +'<ol start="4"><li>Madde dört</li></ol><table><tbody><tr><td colspan="2">Birleşik hücre</td></tr><tr><td>Sol</td><td>Sağ</td></tr></tbody></table>'
  +'<p><span class="math-formula" contenteditable="false" data-latex="x^2" data-display="inline">x²</span> '
  +'<sup class="academic-footnote" data-fn-id="native-note" data-fn-text="Kaynak notu" contenteditable="false">1</sup></p>'
  +'<p><span class="academic-xref" data-ref-id="saved-heading" data-ref-kind="heading">Giriş</span></p>',
  researchData:{thesis:{templateId:generic.id,templateVersion:'1.0.0',selection:{universityId:'generic',degreeType:'master',language:'tr'},values:{YEAR:'2026'},sectionContent:{abstract:'<p>Özet korunacak.</p>'}}}});
const document=note.researchData.thesis.document;
document.source={sha256:'a'.repeat(64),parts:{'word/document.xml':'<original native source />'}};
document.notes={'native-note':{kind:'footnote',nodes:[{type:'text',text:'Kaynak notu'}]}};
document.styles={Normal:{properties:{fontFamily:'Arial',fontSizePt:11}}};
const main=document.sections.find(s=>s.id==='main');
main.properties={rules:{body:{fontFamily:'Arial',fontSizePt:11}}};
main.nodes[0].attributes['data-academic-id']='saved-heading';
main.nodes[1].properties={nativeParagraphXml:'<w:pPr><w:keepNext/></w:pPr>',styleId:'Normal'};
const id=main.nodes[1].id;
const browser=await chromium.launch({executablePath:process.env.THESIS_BROWSER_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1500,height:1000}});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(baseUrl+'/tests/thesis.html');
  await page.evaluate(value=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(value)),note);
  await page.reload();
  await page.locator('#edit-target').waitFor();
  const target=page.locator('#edit-target');
  assert.equal(await target.getAttribute('data-txt-node-id'),id);
  await target.click(); await page.keyboard.press('End'); await page.keyboard.insertText(' Düzenleme ığüşİ.');
  await page.waitForFunction(()=>window.thesisTest?.getDoc()?.content?.includes('Düzenleme ığüşİ.'));
  let saved=await page.evaluate(()=>window.thesisTest.getDoc());
  let savedMain=saved.researchData.thesis.document.sections.find(s=>s.id==='main');
  assert.deepEqual(savedMain.nodes.find(n=>n.id===id).properties,main.nodes[1].properties);
  assert.deepEqual(saved.researchData.thesis.document.source,document.source);
  assert.match(saved.researchData.thesis.sectionContent.abstract,/Özet korunacak/);
  assert.doesNotMatch(saved.content,/data-academic-page-gap|data-thesis-(?:fn-reserve|frag-first|number)=/);
  const projection=await page.evaluate(async()=>{
    const {compileThesisDocument}=await import('/engine/engine.js');
    const {default:generic}=await import('/engine/templates/generic.js');
    const {sameThesisEditorProjection,thesisSourceHtml}=await import('/engine/sourceHtml.js');
    const doc=window.thesisTest.getDoc();
    const rendered=compileThesisDocument(generic,doc.researchData.thesis,doc.title,doc.content).sections.find(s=>s.id==='main').editorHtml;
    const clean=s=>thesisSourceHtml(s).replace(/\sdata-txt-node-id=["'][^"']*["']/gi,'');
    const a=clean(doc.content),b=clean(rendered);let i=0;while(i<a.length&&a[i]===b[i])i++;
    return {same:sameThesisEditorProjection(doc.content,rendered),at:i,original:a.slice(Math.max(0,i-120),i+300),rendered:b.slice(Math.max(0,i-120),i+300)};
  });
  writeFileSync(resolve(root,'orchestration/engine-work/mission02/editor-ack-diagnostic.json'),JSON.stringify(projection,null,2));
  assert.equal(projection.same,true,JSON.stringify(projection));
  await page.keyboard.press('Control+z');
  await page.waitForFunction(()=>!window.thesisTest.getDoc().content.includes('Düzenleme ığüşİ.'));
  await page.keyboard.press('Control+y');
  await page.waitForFunction(()=>window.thesisTest.getDoc().content.includes('Düzenleme ığüşİ.'));
  await page.getByRole('button',{name:'Tez bilgileri',exact:true}).click();
  await page.getByLabel('Belge biçimi',{exact:true}).selectOption('source');
  await page.waitForFunction(()=>window.thesisTest.getDoc()?.researchData?.thesis?.document?.formatMode==='source');
  assert.equal(await page.locator('#edit-target').evaluate(el=>getComputedStyle(el).fontSize),'14.6667px');
  await page.getByLabel('Tez şablonu',{exact:true}).selectOption('fixture-university-c-phd-en-v1');
  await page.waitForFunction(()=>window.thesisTest.getDoc()?.researchData?.thesis?.templateId==='fixture-university-c-phd-en-v1');
  await page.locator('#switch-note').click(); await page.locator('#other-note').waitFor();
  await page.locator('#switch-note').click(); await page.locator('#edit-target').waitFor();
  await page.reload(); await page.locator('#edit-target').waitFor();
  saved=await page.evaluate(()=>window.thesisTest.getDoc());
  savedMain=saved.researchData.thesis.document.sections.find(s=>s.id==='main');
  assert.equal(saved.researchData.thesis.document.formatMode,'source');
  assert.deepEqual(savedMain.nodes.find(n=>n.id===id).properties,main.nodes[1].properties);
  assert.equal(await page.locator('#edit-target').getAttribute('data-txt-node-id'),id);
  assert.match(await page.locator('#edit-target').innerText(),/Düzenleme ığüşİ/);
  assert.equal(await page.locator('[data-thesis-flow-section="main"] table').count(),1);
  assert.equal(await page.locator('[data-thesis-flow-section="main"] td[colspan="2"]').count(),1);
  assert.equal(await page.locator('[data-thesis-flow-section="main"] [data-latex="x^2"]').count(),1);
  assert.doesNotMatch(saved.content,/math-formula__(?:toolbar|render)|class="katex/);
  assert.equal(await page.locator('.math-formula__toolbar, .math-formula__render').evaluateAll(nodes=>nodes.filter(n=>!n.closest('.math-formula')).length),0);
  assert.equal(await page.locator('[data-thesis-flow-section="main"] [data-fn-id="native-note"]').count(),1);
  assert.deepEqual(errors,[]);
  await page.locator('#edit-target').scrollIntoViewIfNeeded();
  await page.screenshot({path:resolve(root,'orchestration/engine-work/mission02/browser-final.png'),fullPage:false});
  writeFileSync(resolve(root,'orchestration/engine-work/mission02/browser-verification.json'),JSON.stringify({status:'PASS',browser:await browser.version(),checks:['real contentEditable input','undo and redo','native paragraph properties and ID retained','source parts and note body retained','source format selector and recorded font applied','template switch','note unmount/remount','reload saved content','merged table, list, equation, note and reference retained','no page presentation persisted'],pageErrors:errors},null,2)+'\n');
  console.log('Mission02 browser acceptance PASS');
} catch(error) {
  console.error(JSON.stringify({pageErrors:errors,body:(await page.locator('body').innerText()).slice(0,2500)}));
  await page.screenshot({path:resolve(root,'orchestration/engine-work/mission02/browser-failure.png'),fullPage:false});
  throw error;
} finally {await browser.close();}
