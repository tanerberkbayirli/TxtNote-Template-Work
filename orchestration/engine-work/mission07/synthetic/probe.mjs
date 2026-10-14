import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-blink-features=MulticolColumnWrapping']});
const p=await (await b.newContext({viewport:{width:1400,height:1000}})).newPage();
await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=synth`);
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
console.log(JSON.stringify(await p.evaluate(()=>{const rules=[];for(const ss of document.styleSheets){try{for(const r of ss.cssRules){if(/data-docx-style|docx/.test(r.cssText)&&r.cssText.length<700)rules.push(r.cssText)}}catch{}}return rules}),null,1));console.log(JSON.stringify(await p.evaluate(()=>{const o=[];for(const s of ['h1','h2','p']){const e=document.querySelector('.thesis-page-flow '+s);if(!e){o.push(s+' none');continue}const c=getComputedStyle(e);o.push([s,e.className,c.fontSize,c.lineHeight,c.marginTop,c.marginBottom,c.fontFamily,e.getBoundingClientRect().height].join('|'))}return o}),null,1));
await b.close();
