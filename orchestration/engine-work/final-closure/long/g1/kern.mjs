import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const ctx=await browser.newContext();const page=await ctx.newPage();
await page.setContent('<div id=r></div>');
const r=await page.evaluate(()=>{const out={};for(const [k,css] of Object.entries({auto:'font-kerning:auto',none:'font-kerning:none',nolig:'font-kerning:none;font-variant-ligatures:none'})){const s=document.createElement('span');s.style.cssText=`font:11pt "Times New Roman";white-space:nowrap;${css}`;s.textContent='NUMBER OF TRANSSHIPMENT';document.body.append(s);out[k]=s.getBoundingClientRect().width*0.75;s.remove()}return out});
console.log(r);await browser.close();
