import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await b.newContext({viewport:{width:1400,height:1000}});
const p=await c.newPage();await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=EDGE_NOTES`);
await p.locator('.thesis-sheet').first().waitFor({timeout:60000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:60000});
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.thesis-footnote-list')].map(l=>({paras:l.querySelectorAll('.thesis-footnote-para').length,txt:l.textContent.match(/FOOTNOTE_\d+/g).filter((x,i,a)=>a.indexOf(x)==i).length,h:l.getBoundingClientRect().height,line:getComputedStyle(l.firstElementChild).lineHeight,fs:getComputedStyle(l.firstElementChild).fontSize, last:l.textContent.match(/FOOTNOTE_\d+/g).pop()}))))); 
await p.locator('.thesis-sheet').first().screenshot({path:'orchestration/engine-work/mission07/fn_sheet1.png'});
}finally{await b.close();}
