import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const results=[];
try {
 for(const blanks of [0,1,3]) {
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:5200/tests/thesis-long.html?id=RESUME14_BREAK${blanks}`);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:60000});
  const result=await page.evaluate(()=>{
   const model=window.thesisTest.getDoc().researchData.thesis.document;
   const marker=model.sections[0].nodes.at(-1);
   const el=document.querySelector(`.thesis-page-flow p[data-txt-node-id="${marker.id}"]`);
   return {pages:document.querySelectorAll('.thesis-sheet').length,markerDisplay:getComputedStyle(el).display,sourceMarkerRetained:marker.properties.paragraphPropertiesXml.includes('sectPr'),text:document.querySelector('[aria-label="Belge sayfaları"]').textContent};
  });
  results.push({blanks,...result,pass:result.pages===2&&result.markerDisplay==='none'&&result.sourceMarkerRetained});
  await page.close();
 }
} finally {await browser.close();}
writeFileSync(new URL('./browser.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
if(results.some(r=>!r.pass))process.exitCode=1;
