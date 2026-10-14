import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const results=[];
try {
 for(const variant of ['exact','minimum','none']) {
  const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:5200/tests/thesis-long.html?id=MERGE14_${variant}`);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:60000});
  const data=await page.evaluate(()=>{
   const table=document.querySelector('.thesis-body table');
   const article=table.closest('.thesis-paper'),scale=article.getBoundingClientRect().width/article.offsetWidth;
   const sheet=document.querySelector('.thesis-sheet').getBoundingClientRect();
   const end=[...document.querySelectorAll('.thesis-body p')].find(p=>p.textContent.trim()==='END');
   const tr=table.getBoundingClientRect(),er=end?.getBoundingClientRect(),es=end&&getComputedStyle(end);
   const frame={tableTopPt:(tr.top-sheet.top)/scale*.75,tableBottomPt:(tr.bottom-sheet.top)/scale*.75,endTopPt:er&&(er.top-sheet.top)/scale*.75,endHeightPt:er&&er.height/scale*.75,endStyle:es&&{line:es.lineHeight,padding:es.padding,margin:es.margin,fontSize:es.fontSize},columnHeight:getComputedStyle(table.closest('.thesis-page-flow')).columnHeight};
   return {frame,scale,pages:document.querySelectorAll('.thesis-sheet').length,rows:[...table.rows].map(row=>({id:row.dataset.txtNodeId,height:row.getBoundingClientRect().height/scale,cells:[...row.cells].map(c=>{const s=getComputedStyle(c);return{id:c.dataset.txtNodeId,span:c.rowSpan,height:c.getBoundingClientRect().height/scale,scroll:c.scrollHeight,client:c.clientHeight,cssHeight:s.height,overflow:s.overflow,align:s.verticalAlign,content:[...c.children].map(n=>({tag:n.tagName,height:n.getBoundingClientRect().height/scale,scroll:n.scrollHeight})).slice(0,3)}})}))};
  });
  results.push({variant,...data});await page.close();
 }
} finally {await browser.close();}
writeFileSync(new URL('./merge-probe.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
