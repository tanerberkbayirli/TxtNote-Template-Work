import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'orchestration/engine-work/mission04');
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results=[];
try{
 for(const surface of ['pane','canvas']){
  const page=await browser.newPage({viewport:{width:1450,height:1050}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5176')&&!r.url().startsWith('data:'))external.push(r.url());});
  await page.goto(`http://127.0.0.1:5176/tests/pdf-academic.html?surface=${surface}`);
  await page.getByRole('button',{name:'Akademik araçları aç',exact:true}).click();
  const tools=page.getByLabel('Akademik araçlar',{exact:true});
  await tools.getByRole('button',{name:'Dosya',exact:true}).click();
  const input=tools.locator('input[type="file"][accept^=".pdf"]');
  const file=resolve(root,'orchestration/engine-work/mission01/inputs/edge-synthetic-scans-final.pdf');
  await input.setInputFiles(file);await page.getByRole('dialog').waitFor();
  await page.getByRole('button',{name:'İptal',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.pdfAcademic.getNote().content),'<p>Akademik özgün içerik.</p>');
  await page.getByRole('button',{name:'Akademik araçları aç',exact:true}).click();
  await tools.getByRole('button',{name:'Dosya',exact:true}).click();
  await input.setInputFiles(file);await page.getByRole('button',{name:"PDF'yi incelemeye hazırla",exact:true}).click();
  const dialog=page.getByRole('dialog').filter({hasText:'PDF aktarımını incele ve düzelt'});
  await dialog.waitFor({timeout:180000});
  assert.equal(await page.evaluate(()=>window.pdfAcademic.getNote().content),'<p>Akademik özgün içerik.</p>');
  assert.equal(await dialog.getByRole('button',{name:'PDF içeriğini uygula',exact:true}).isDisabled(),true);
  await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'PDF içeriğini uygula',exact:true}).click();
  await page.locator('[data-thesis-flow-section="pdf-page-3"]').waitFor({timeout:60000});
  let note=await page.evaluate(()=>window.pdfAcademic.getNote());
  assert.equal(note.researchData.thesis.document.sections.length,3);
  assert.equal(note.researchData.thesis.document.source.format,'pdf');
  await page.reload();await page.locator('[data-thesis-flow-section="pdf-page-3"]').waitFor({timeout:60000});
  assert.equal(await page.getByLabel('PDF aktarım raporu',{exact:true}).count(),1);
  note=await page.evaluate(()=>window.pdfAcademic.getNote());
  assert.equal(note.researchData.thesis.document.sections.length,3);
  assert.equal(note.researchData.thesis.document.source.pages[2].ocrRotation,90);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await page.screenshot({path:resolve(out,`academic-${surface}.png`)});
  results.push({surface,status:'PASS',pages:3,setupCancelPreserved:true,stagedContentPreserved:true,acknowledgementRequired:true,realRouterAllPages:true,reloadAllPages:true,pageErrors:errors,externalRequests:external});
  await page.close();
 }
 writeFileSync(resolve(out,'academic-verification.json'),JSON.stringify({status:'PASS',cases:results},null,2));
 console.log('PASS: academic PDF through DocumentPane and Canvas; three pages survive reload');
}finally{await browser.close();}
