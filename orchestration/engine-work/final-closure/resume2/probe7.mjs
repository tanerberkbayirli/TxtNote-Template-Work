import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await (await browser.newContext()).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=SRC10`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
const texts=JSON.parse(process.argv[2]);
const r=await page.evaluate(async(texts)=>{
 const m=await import('/engine/wordLineFit.js');
 const c=document.createElement('canvas').getContext('2d');c.fontKerning='none';c.font='normal 400 1000px "Times New Roman"';
 const w=t=>c.measureText(t).width*16/1000;
 return texts.map(t=>{const ws=t.split(' ');const sp=w(' ');const nat=ws.reduce((a,x)=>a+w(x),0)+sp*(ws.length-1);return {t,gaps:ws.length-1,sp,last:w(ws.at(-1)),natPt:nat*.75,budgetPt:m.wordFitBudget(ws.length-1,sp,w(ws.at(-1)))*.75}});
},texts);
console.log(JSON.stringify(r,null,0));
await browser.close();
