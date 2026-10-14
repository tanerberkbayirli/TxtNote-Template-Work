import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_ACTIVE');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const result=await page.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow [data-native-object="drawing"]')].filter(n=>n.querySelector('svg')&&/Konulara|Yayın Yerine|Yıllara Göre|Metodolojik/.test(n.textContent)).map(n=>{
  const svg=n.querySelector('svg'),frame=svg.getBoundingClientRect();
  return{id:n.dataset.txtNodeId,html:svg.outerHTML,frame:{x:frame.x,y:frame.y,width:frame.width,height:frame.height},labels:[...svg.querySelectorAll('text')].map(t=>{const r=t.getBoundingClientRect();return{text:t.textContent,width:r.width,height:r.height,inside:r.left>=frame.left-1&&r.right<=frame.right+1&&r.top>=frame.top-1&&r.bottom<=frame.bottom+1}})};
 }));
 assert.equal(result.length,4);
 for(const r of result){assert.ok(r.labels.length>10);assert.ok(r.labels.every(l=>l.inside&&l.height>0),JSON.stringify(r.labels.filter(l=>!l.inside)));}
 writeFileSync('orchestration/engine-work/final-closure/src09-active/chart-check.json',JSON.stringify({status:'PASS',charts:4,result},null,2));
 for(const [i,r] of result.entries()){
  const preview=await context.newPage({viewport:{width:1000,height:650}});
  await preview.setContent(`<body style="margin:16px"><div style="width:${r.frame.width/0.759}px;height:${r.frame.height/0.759}px">${r.html}</div></body>`);
  await preview.locator('svg').screenshot({path:`orchestration/engine-work/final-closure/src09-active/chart-${i+1}.png`});
  await preview.close();
 }
 console.log('Actual SRC09: 4 bar charts, all SVG labels inside visible frames.');
}finally{await browser.close();}
