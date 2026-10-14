import {createRequire} from 'node:module';import {writeFileSync,readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await browser.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
const p=await c.newPage();await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_TABLE_ONLY');await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
const data=await p.evaluate(readFileSync('orchestration/engine-work/final-closure/src09-resume/table/audit.js','utf8'));
writeFileSync('orchestration/engine-work/final-closure/src09-active/three-layout/table-rows.json',JSON.stringify(data,null,2));
console.log(data.rows.filter((r,i)=>i>=23&&i<=32));
console.log(await p.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow [data-txt-node-id="docx-1829"] p')].map(n=>{const s=getComputedStyle(n);return{id:n.dataset.txtNodeId,t:n.textContent,h:n.getBoundingClientRect().height,next:n.nextElementSibling?.getBoundingClientRect().top-n.getBoundingClientRect().top,font:s.fontSize,line:s.lineHeight,before:s.marginTop,after:s.marginBottom,guard:getComputedStyle(n,'::after').height,guardmargin:getComputedStyle(n,'::after').marginBottom,empty:getComputedStyle(n,'::before').fontSize};})));
}finally{await browser.close();}
