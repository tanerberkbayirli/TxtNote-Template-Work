import{createRequire}from'node:module';const{chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const page=await b.newPage();await page.goto('http://127.0.0.1:5200/tests/thesis-long.html?id=TABS14_tail');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');
 console.log(await page.evaluate(()=>{
  const p=document.querySelector('.thesis-page-flow p'),tab=p.querySelector('.txn-docx-18'),c=p.querySelector('.txn-docx-17');const out=[];
  const read=rule=>out.push({rule,c:c.getBoundingClientRect().top-p.getBoundingClientRect().top,tab:tab.getBoundingClientRect().top-p.getBoundingClientRect().top,height:p.getBoundingClientRect().height});
  tab.style.cssText='white-space:break-spaces';const w=document.createElement('wbr');tab.prepend(w);read('wbr inside');w.remove();
  tab.before(w);read('wbr before');w.remove();
  const s=document.createElement('style');s.textContent='.txn-docx-18::before{content:"";display:inline-block;width:0}';document.head.append(s);read('zero inline block before');
  return out;
 }));
}finally{await b.close()}
