import {chromium} from '../../../tools/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const fixture=JSON.parse(readFileSync('orchestration/specs/aku-sbe.fixture.json','utf8'));
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
 const p=await browser.newPage({viewport:{width:1400,height:1000}});
 await p.addInitScript(d=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(d)),fixture);
 await p.goto('http://127.0.0.1:5201/tests/thesis.html');
 await p.waitForFunction(()=>document.querySelector('[data-thesis-pagination-ready]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 const result=await p.evaluate(()=>{const host=document.querySelector('[data-thesis-flow-section="outer-cover"]');return {host:host.outerHTML,rect:host.getBoundingClientRect().toJSON(),body:getComputedStyle(host.querySelector('.thesis-body')).cssText,blocks:[...host.querySelectorAll('[data-thesis-block]')].map(e=>{const s=getComputedStyle(e);return {text:e.textContent,rects:[...e.getClientRects()].map(r=>r.toJSON()),font:s.font,fontSize:s.fontSize,family:s.fontFamily,transform:s.textTransform,spacing:s.letterSpacing,width:s.width,line:s.lineHeight,before:s.marginTop,after:s.marginBottom,display:s.display,break:s.breakInside}})}});
 writeFileSync('orchestration/engine-work/final-closure/resumed-20261012/cover-probe.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result.blocks));
}finally{await browser.close()}

