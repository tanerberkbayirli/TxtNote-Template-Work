import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id=SRC10_ACTIVE');
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate((ids)=>ids.map(id=>{const pp=document.querySelector(`.thesis-page-flow p[data-txt-node-id="${id}"]`);const sr=pp.closest('.thesis-page-flow').getBoundingClientRect();const k=595.32/document.querySelector('.thesis-sheet').getBoundingClientRect().width;
 const pr=pp.getBoundingClientRect();
 return {id,left:pr.left*k,w:pr.width*k,h:pr.height*k,html:pp.innerHTML.replace(/<math[\s\S]*?<\/math>/g,'<MATH/>').slice(0,900),tabs:[...pp.querySelectorAll('[data-thesis-tab]')].map(t=>{const r=t.getBoundingClientRect();return [Math.round(r.left*k*10)/10,Math.round(r.width*k*10)/10]}),
 css:(({tabSize,textIndent,whiteSpace})=>({tabSize,textIndent,whiteSpace}))(getComputedStyle(pp))}}),['docx-4123','docx-4165']);
console.log(JSON.stringify(r,null,1));await b.close();
