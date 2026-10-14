import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const id=process.argv[2]||'SRC10';const code=readFileSync(process.argv[3],'utf8');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5175'});
const p=await c.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:600000});
console.log(JSON.stringify(await p.evaluate(code),null,1));
}finally{await b.close();}
