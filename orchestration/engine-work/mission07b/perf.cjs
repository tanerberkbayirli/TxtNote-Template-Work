const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
(async()=>{
 const id=process.argv[2]||'SRC09';
 const b=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});const pg=await b.newPage({viewport:{width:1400,height:900}});
 const t0=Date.now();
 await pg.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
 await pg.waitForSelector('[data-thesis-pagination-ready="true"]',{timeout:300000});
 console.log('load ms',Date.now()-t0);
 for(let i=0;i<2;i++){
  const el=await pg.$('.thesis-body[contenteditable="true"], [contenteditable="true"]');
  await el.click();
  await pg.keyboard.press('Control+End');
  await pg.evaluate(()=>{window.__lt=0;new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt+=e.duration}).observe({type:'longtask',buffered:false});});
  const t1=Date.now();
  await pg.keyboard.type('x');
  const t2=Date.now();
  await pg.waitForTimeout(100);
  await pg.waitForSelector('[data-thesis-pagination-ready="true"]',{timeout:300000});
  console.log('type->ready ms',Date.now()-t1,'keypress ms',t2-t1,'longtask total',await pg.evaluate(()=>window.__lt));
 }
 await b.close();
})();
