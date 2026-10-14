// Keeps one Chrome with the long fixture open; other scripts attach via CDP on :9333.
import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';
const b=await chromium.launchPersistentContext('C:/Users/CASPER/AppData/Local/Temp/m7profile',{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:1400,height:1000},args:['--remote-debugging-port=9333','--enable-blink-features=MulticolColumnWrapping']});
await b.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5175'});
const p=b.pages()[0]||await b.newPage();const t0=Date.now();
await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
console.log('READY',Date.now()-t0);
import {readFileSync,writeFileSync,existsSync,unlinkSync} from 'node:fs';
const C='orchestration/engine-work/mission07/cmd.js',R='orchestration/engine-work/mission07/result.json';
setInterval(async()=>{if(!existsSync(C))return;const code=readFileSync(C,'utf8');unlinkSync(C);
 try{const v=await p.evaluate(code);writeFileSync(R,JSON.stringify({ok:true,v}));}catch(e){writeFileSync(R,JSON.stringify({ok:false,e:String(e)}));}},500);
