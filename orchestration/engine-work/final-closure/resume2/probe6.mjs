import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await (await browser.newContext()).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=SRC10`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
const r=await page.evaluate(async()=>{
 const m=await import('/engine/wordLineFit.js');
 const c=document.createElement('canvas').getContext('2d');c.fontKerning='none';
 const w=(t,b)=>{c.font=`normal ${b?700:400} 1000px "Times New Roman"`;return c.measureText(t).width*16/1000;};
 const bold=w('False Negative:',true),reg=w('False Negative:',false),sp=w(' ');
 const rest=['This','value','is','calculated','by','finding','the','model’s','“False','Negative”'].map(x=>w(x));
 const natural=bold+rest.reduce((a,b)=>a+b,0)+sp*11;
 const gaps=11;
 return {regNatural:reg+rest.reduce((a,b)=>a+b,0)+sp*11,bold,sp,rest,natural,budget:m.wordFitBudget(gaps,sp,rest.at(-1)),eps:m.WORD_FIT_EPSILON};
});
console.log(JSON.stringify(r));
await browser.close();
