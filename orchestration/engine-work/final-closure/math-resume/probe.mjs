import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--enable-blink-features=MulticolColumnWrapping'] });
try {
  const page = await browser.newPage({viewport:{width:1400,height:1000}});
  await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=EQ_PROBE');
  await page.waitForFunction(() => document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady === 'true', null, {timeout:300000});
  const variants={};
  for (const [name,css] of Object.entries({baseline:'',font:'[data-native-object="equation"] math{font-family:"Cambria Math"}',normal:'[data-native-object="equation"] math{font-family:"Cambria Math";math-style:normal}',limits:'[data-native-object="equation"] math{font-family:"Cambria Math";math-style:normal}'})) {
  if(name==='limits') await page.evaluate(()=>document.querySelectorAll('msubsup').forEach(s=>{if(s.firstElementChild?.tagName==='mo'){const replacement=document.createElementNS('http://www.w3.org/1998/Math/MathML','munderover');replacement.append(...s.childNodes);s.replaceWith(replacement);}}));
  await page.evaluate(css => {let s=document.getElementById('probe-style');if(!s){s=document.createElement('style');s.id='probe-style';document.head.append(s);}s.textContent=css;},css);
  const result = await page.evaluate(() => [...document.querySelectorAll('.thesis-page-flow .rich-text-body > p')].map(p => {
    const m=p.querySelector('math'), f=p.querySelector('.math-formula');
    return {text:p.textContent, height:p.offsetHeight*.75, mathHeight:m?.getBoundingClientRect().height, html:m?.outerHTML, css:m && {font:getComputedStyle(m).font, mathStyle:getComputedStyle(m).mathStyle, display:getComputedStyle(m).display}, span:f && {display:getComputedStyle(f).display,lineHeight:getComputedStyle(f).lineHeight}};
  }));
  variants[name]=result;
  }
  mkdirSync('orchestration/engine-work/final-closure/math-resume',{recursive:true});
  writeFileSync('orchestration/engine-work/final-closure/math-resume/probe.json',JSON.stringify(variants,null,2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(variants).map(([n,r])=>[n,r.filter(x=>x.html).map(x=>({text:x.text,height:x.height,mathHeight:x.mathHeight}))]))));
} finally { await browser.close(); }
