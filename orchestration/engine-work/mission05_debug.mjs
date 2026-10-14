import {createRequire} from 'node:module';import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const page=await browser.newPage();const fixture=JSON.parse(readFileSync('orchestration/specs/engine-mission05-typography.fixture.json','utf8'));
await page.addInitScript(v=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(v)),fixture);
await page.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await page.locator('[data-thesis-flow-section="J08"]').waitFor();await page.evaluate(()=>document.fonts.ready);
const rows=await page.evaluate(async()=>{
 const {fitWordLines}=await import('/engine/wordLineFit.js'),ctx=document.createElement('canvas').getContext('2d');ctx.fontKerning='none';
 return [...document.querySelectorAll('.thesis-body p')].filter(p=>/^(J02-4|J03-3|J05-4)/.test(p.textContent)).map(p=>{
 const css=getComputedStyle(p),text=p.textContent,entries=[];let at=0;const walker=document.createTreeWalker(p,4);
 while(walker.nextNode()){const node=walker.currentNode,s=getComputedStyle(node.parentElement);entries.push({text:node.data,start:at,end:at+node.length,font:`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`});at+=node.length;}
 const advance=(a,b)=>entries.reduce((r,e)=>{const x=Math.max(a,e.start),y=Math.min(b,e.end);if(x>=y)return r;ctx.font=e.font;return r+ctx.measureText(text.slice(x,y)).width;},0);
 const matches=[...text.matchAll(/[^ \r\n]+/g)],words=matches.map((m,i)=>({text:m[0],start:m.index,end:m.index+m[0].length,width:advance(m.index,m.index+m[0].length),space:i?advance(matches[i-1].index+matches[i-1][0].length,m.index):0}));
 const width=parseFloat(css.width)-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
 const lines=fitWordLines(words,width,parseFloat(css.textIndent)||0).map(l=>({...l,text:words.slice(l.start,l.end).map(w=>w.text).join(' ')}));
 return {tag:text.slice(0,5),width,lines,words,spans:[...p.querySelectorAll('[data-thesis-word-fit]')].map(s=>({n:s.dataset.thesisWordFit,text:s.textContent,space:s.style.wordSpacing,left:s.style.left,rects:[...s.getClientRects()].map(r=>({left:r.left,top:r.top,width:r.width}))}))};
 });
});writeFileSync('orchestration/engine-work/mission05/debug.json',JSON.stringify(rows,null,2));console.log(rows.map(r=>({tag:r.tag,last:r.lines.at(-1)})));
}finally{await browser.close();}
