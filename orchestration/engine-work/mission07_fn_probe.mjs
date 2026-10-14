import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const id=process.argv[2]||'EDGE_NOTES';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await b.newContext({viewport:{width:1400,height:1000}});
const p=await c.newPage();await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
await p.locator('.thesis-sheet').first().waitFor({timeout:60000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:60000});
await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate(()=>{
 const refs=[...document.querySelectorAll('sup.academic-footnote, span.academic-footnote')].map(r=>({idx:r.getAttribute('data-fn-index'),len:(r.getAttribute('data-fn-text')||'').length}));
 const areas=[...document.querySelectorAll('.thesis-footnote-list')].map(l=>({n:l.children.length,h:Math.round(l.getBoundingClientRect().height),first:l.textContent.slice(0,60),last:l.textContent.slice(-40),cont:l.querySelectorAll('.thesis-footnote-continued').length}));
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>Math.round(s.getBoundingClientRect().height));
 const stamps=[...document.querySelectorAll('[data-thesis-fn-stamp]')].map(e=>[e.getAttribute('data-thesis-fn-stamp'),e.getAttribute('data-thesis-fn-reserve'),e.textContent.slice(0,20)]);
 return {refs,areas,sheets,stamps};
}),null,1));
}finally{await b.close();}
