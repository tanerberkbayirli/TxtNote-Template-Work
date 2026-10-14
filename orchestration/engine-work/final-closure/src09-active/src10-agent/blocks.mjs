import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const pg=+process.argv[2];
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate((pg)=>{const s=document.querySelectorAll('.thesis-sheet')[pg-1];const sr=s.getBoundingClientRect(),k=595.32/sr.width;
 const out=[];for(const ch of document.querySelectorAll('.thesis-page-flow p,.thesis-page-flow table')){if(ch.parentElement.closest('table')&&ch.tagName==='P')continue;const r=ch.getBoundingClientRect();
  const cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;if(cy<sr.top||cy>sr.bottom||cx<sr.left||cx>sr.right)continue;const cs=getComputedStyle(ch);
  out.push({tag:ch.tagName,id:ch.dataset.txtNodeId,top:+((r.top-sr.top)*k).toFixed(1),h:+(r.height*k).toFixed(1),l:+((r.left-sr.left)*k).toFixed(1),w:+(r.width*k).toFixed(1),mt:cs.marginTop,mb:cs.marginBottom,lh:cs.lineHeight,pb:cs.paddingBottom,text:ch.textContent.slice(0,30),math:!!ch.querySelector('math')});}
 return out;},pg);
for(const x of r)console.log(JSON.stringify(x));
await b.close();
