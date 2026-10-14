import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_ACTIVE');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const result=await page.evaluate(()=>{
  const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}};
  const details=n=>{const s=getComputedStyle(n);return{tag:n.tagName,id:n.dataset.txtNodeId,text:n.textContent.slice(0,150),rect:rect(n),display:s.display,visibility:s.visibility,position:s.position,overflow:s.overflow,transform:s.transform,left:s.left,top:s.top,hidden:n.hidden}};
  return{drawings:[...document.querySelectorAll('.thesis-page-flow [data-native-object="drawing"]')].filter(n=>n.textContent.includes('Problem Yapısının')).map(n=>({node:details(n),children:[...n.querySelectorAll('[data-docx-box-block]')].map(details),parents:[n.parentElement,n.parentElement.parentElement,n.parentElement.parentElement.parentElement].map(details)})),sheets:[...document.querySelectorAll('.thesis-sheet')].slice(93,98).map(details)};
 });
 writeFileSync('orchestration/engine-work/final-closure/src09-active/content-inspection.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}finally{await browser.close();}
