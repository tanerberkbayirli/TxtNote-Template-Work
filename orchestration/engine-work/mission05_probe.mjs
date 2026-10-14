import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
const page=await browser.newPage();const fixture=JSON.parse(readFileSync('orchestration/specs/engine-word-justify.fixture.json','utf8'));
await page.addInitScript(value=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(value)),fixture);
await page.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await page.locator('.thesis-body p').first().waitFor();await page.evaluate(()=>document.fonts.ready);
const rows=await page.evaluate(()=>{
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),out=[];
 for(const p of document.querySelectorAll('.thesis-body p')){
  const css=getComputedStyle(p),text=p.textContent;if(!/^J\d\d-/.test(text))continue;
  ctx.font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;ctx.fontKerning='none';
  const width=parseFloat(css.width)-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight),space=ctx.measureText(' ').width;
  const words=text.split(' ').map(text=>({text,width:ctx.measureText(text).width})),lines=[];
  let start=0;
  while(start<words.length){let end=start+1,natural=words[start].width;
   while(end<words.length){const next=natural+space+words[end].width,gaps=end-start;
    const budget=css.textAlign==='justify'?Math.min(.25*gaps*space,.36*(words[end].width+space)-.04/.75*gaps):0;
    if(next>width+budget+.05/.75)break;natural=next;end++;}
   lines.push({text:words.slice(start,end).map(w=>w.text).join(' '),natural,width,space,gaps:end-start-1,last:words[end-1].width});start=end;
  }
  out.push({tag:text.slice(0,5),font:ctx.font,width,lines});
 }
 return out;
});writeFileSync('orchestration/engine-work/mission05/probe-lines.json',JSON.stringify(rows,null,2));console.log(rows.length+' paragraphs');
}finally{await browser.close();}
