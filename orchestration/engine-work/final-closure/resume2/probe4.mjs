import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2],needle=process.argv[3];
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(n=>{
 const p=[...document.querySelectorAll('.thesis-page-flow p')].find(p=>p.textContent.startsWith(n));
 const cs=getComputedStyle(p);
 const c=document.createElement('canvas').getContext('2d');c.fontKerning='none';
 const walker=document.createTreeWalker(p,4);const parts=[];let nd;
 while(nd=walker.nextNode()){const st=getComputedStyle(nd.parentElement);c.font=`${st.fontStyle} ${st.fontWeight} 1000px ${st.fontFamily}`;parts.push([nd.data,c.measureText(nd.data).width*parseFloat(st.fontSize)/1000,st.fontWeight,st.fontSize]);}
 const line1='False Negative: This value is calculated by finding the model’s “False Negative”';
 let acc=0,txt='';for(const [t,w] of parts){txt+=t;}
 return {width:cs.width,ti:cs.textIndent,ml:cs.marginLeft,pos:cs.position,parts:parts.slice(0,4),txtStart:txt.slice(0,100),delta:null};
},needle);
console.log(JSON.stringify(r,null,1));
await browser.close();
