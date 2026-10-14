import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const needle=process.argv[2];
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://localhost:5223'});const p=await c.newPage();
await p.goto('http://localhost:5223/tests/thesis-long.html?id='+(process.env.FIX||'SRC10_ACTIVE'));
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await p.evaluate(async(needle)=>{
 const {wordFitBudget}=await import('/engine/wordLineFit.js');
 const pp=[...document.querySelectorAll('.thesis-page-flow p')].find(x=>x.textContent.includes(needle));
 const doc=document;const ctx=doc.createElement('canvas').getContext('2d');ctx.fontKerning='none';
 const entries=[];let text='';const w=doc.createTreeWalker(pp,4);
 while(w.nextNode()){const n=w.currentNode;if(!n.length)continue;const st=getComputedStyle(n.parentElement);entries.push({start:text.length,end:text.length+n.length,font:`${st.fontStyle} ${st.fontWeight} 1000px ${st.fontFamily}`,size:Math.round(parseFloat(st.fontSize)*.75*1000)/1000/.75,sp:parseFloat(st.letterSpacing)||0});text+=n.data;}
 const adv=(a0,b0)=>{let r=0;for(const e of entries){const a=Math.max(a0,e.start),b=Math.min(b0,e.end);if(a>=b)continue;ctx.font=e.font;r+=ctx.measureText(text.slice(a,b)).width*e.size/1000+e.sp*(b-a);}return r;};
 const ms=[...text.matchAll(/[^ \r\n]+/g)];
 const toks=ms.map((m,i)=>({s:m.index,e:m.index+m[0].length,w:adv(m.index,m.index+m[0].length),sp:i?adv(ms[i-1].index+ms[i-1][0].length,m.index):0,t:m[0]}));
 const cs=getComputedStyle(pp);const width=parseFloat(cs.width),ind=parseFloat(cs.textIndent)||0;const measure=width-ind;
 let nat=toks[0].w,spaces=0,gaps=0;const rows=[];
 for(let i=1;i<toks.length;i++){nat+=toks[i].sp+toks[i].w;spaces+=toks[i].sp;gaps+=toks[i].sp>0?1:0;const bud=wordFitBudget(gaps,spaces/gaps,toks[i].w);rows.push([toks[i].t,Math.round((nat-measure)*100)/100,Math.round(bud*100)/100]);if(nat-measure>40)break;}
 return {width,ind,measure,rows:rows.slice(-8)};},needle);
console.log(JSON.stringify(r));await b.close();
