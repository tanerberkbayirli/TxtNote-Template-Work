import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '../../../tools/node_modules/playwright/index.mjs';
const fixture=JSON.parse(await readFile('orchestration/specs/adu-sagbil.fixture.json','utf8'));
fixture.content='<p>Araştırma metni.</p>';fixture.researchData.thesis.sectionContent=Object.fromEntries(Object.keys(fixture.researchData.thesis.sectionContent||{}).map(key=>[key,'<p>Özel sayfa denetimi.</p>']));
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.addInitScript(f=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(f)),fixture);
 await page.goto((process.env.THESIS_BASE_URL||'http://127.0.0.1:5194')+'/tests/thesis.html');
 await page.locator('.thesis-sheet').first().waitFor();await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await page.evaluate(()=>document.fonts.ready);
 const report=await page.evaluate(async()=>{
  const [{THESIS_TEMPLATE_REGISTRY},{compileThesisDocument},{measurePositionedSpecialPages}]=await Promise.all([import('/engine/registry.js'),import('/engine/engine.js'),import('/engine/specialPageFit.js')]);
  const doc=window.thesisTest.getDoc(),descriptor=THESIS_TEMPLATE_REGISTRY.find(entry=>entry.id===doc.researchData.thesis.templateId),template=(await descriptor.load()).default;
  const model=compileThesisDocument(template,doc.researchData.thesis,doc.title,doc.content),root=document.querySelector('[aria-label="Belge sayfaları"]');
  const rounds=[];
  for(let i=0;i<20;i++){
   await new Promise(resolve=>requestAnimationFrame(resolve));const measured=measurePositionedSpecialPages(root,model);
   rounds.push({round:i,ready:root.dataset.thesisPaginationReady,css:measured.css,positions:measured.positions,styles:[...root.querySelectorAll('style')].map(style=>style.textContent).filter(text=>text.includes('translate:')||text.includes('contain:none!important'))});
  }
  return rounds;
 });
 await writeFile('orchestration/engine-work/final-closure/special/helper-cycle.json',JSON.stringify(report,null,2));
 const uniqueCss=new Set(report.map(row=>row.css)).size,readyRounds=report.filter(row=>row.ready==='true').length;
 assert.equal(uniqueCss,1,'positioned measurements must stop changing without content edits');
 assert.equal(readyRounds,report.length,'normal editor pagination must settle despite repeated measurement');
 console.log({rounds:report.length,uniqueCss,readyRounds});
}finally{await browser.close()}
