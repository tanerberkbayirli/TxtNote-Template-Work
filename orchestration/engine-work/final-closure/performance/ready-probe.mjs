import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
console.log('launch');const b=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});console.log('launched');
const p=await b.newPage();console.log('page');await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC10',{waitUntil:'domcontentloaded'});console.log('domcontentloaded');
for(let i=0;i<6;i++){await p.waitForTimeout(10000);console.log(await p.evaluate(()=>({ready:document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady,pages:document.querySelectorAll('.thesis-sheet').length,pending:document.querySelectorAll('.math-formula__render--pending').length,text:document.body.innerText.slice(-1500)})));}
await b.close();
