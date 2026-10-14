import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id='+(process.argv[2]||'SRC09_EQUATION_EXCERPT'));
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const results={};
 results.zoom=await page.evaluate(()=>new DOMMatrix(getComputedStyle(document.querySelector('.thesis-page-stack')).transform).a);
 const leadingCss=await page.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow p')].filter(p=>p.querySelector('math')).map(p=>{const s=getComputedStyle(p),lead=Math.max(0,parseFloat(s.lineHeight)-parseFloat(s.fontSize)*2355/2048);return `.thesis-body .txn-${p.dataset.txtNodeId} [data-native-object="equation"]{padding-bottom:${lead}px}`}).join(''));
 for(const [name,css] of Object.entries({baseline:'',zero:'.thesis-body [data-native-object="equation"]{display:inline-block;line-height:0}'+leadingCss,mathleading:'.thesis-body [data-native-object="equation"]{display:inline-block;line-height:0;padding-top:0.146484375em}'+leadingCss})) {
  await page.evaluate(css=>{let s=document.getElementById('probe');if(!s){s=document.createElement('style');s.id='probe';document.head.append(s);}s.textContent=css;},css);
  results[name]=await page.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow p')].filter(p=>p.querySelector('math')).map(p=>{const math=p.querySelector('math'),m=p.querySelector('[data-native-object]'),r=p.getBoundingClientRect(),n=p.nextElementSibling?.getBoundingClientRect();return {id:p.dataset.txtNodeId,text:p.textContent.slice(0,100),height:r.height,nextDelta:n?.top-r.top,font:getComputedStyle(math).fontFamily,fontSize:getComputedStyle(math).fontSize,mathHeight:math.getBoundingClientRect().height,wrapperHeight:m.getBoundingClientRect().height,line:getComputedStyle(p).lineHeight,html:math.outerHTML};}));
 }
 results.tree=await page.evaluate(()=>[...document.querySelectorAll('.thesis-page-flow math')].filter(m=>m.querySelector('mtable')).flatMap(m=>[...m.querySelectorAll('*')].map(n=>({tag:n.tagName,text:n.textContent,font:getComputedStyle(n).fontSize,depth:getComputedStyle(n).mathDepth,rect:{y:n.getBoundingClientRect().y,h:n.getBoundingClientRect().height}}))));
 results.headings=await page.evaluate(()=>['docx-18195','docx-18202','docx-18209','docx-18216'].map(id=>{const n=document.querySelector('.thesis-page-flow [data-txt-node-id="'+id+'"]');if(!n)return null;return {id,html:n.parentElement.outerHTML.slice(0,500),parents:[n,n.parentElement,n.parentElement.parentElement].map(p=>({tag:p.tagName,class:p.className,css:getComputedStyle(p).breakInside+' '+getComputedStyle(p).breakAfter+' '+getComputedStyle(p).breakBefore,top:p.getBoundingClientRect().top,height:p.getBoundingClientRect().height}))};}));
 writeFileSync('orchestration/engine-work/final-closure/src09-active/'+(process.argv[3]||'math-probe')+'.json',JSON.stringify(results,null,2));
 console.log('Saved equation probe');
}finally{await browser.close();}
