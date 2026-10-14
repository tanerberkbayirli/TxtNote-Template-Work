const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
(async()=>{
 const b=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});const pg=await b.newPage({viewport:{width:1400,height:900}});
 await pg.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=SRC09`);
 await pg.waitForSelector('[data-thesis-pagination-ready="true"]',{timeout:300000});
 const el=await pg.$('[contenteditable="true"]');await el.click();await pg.keyboard.press('Control+End');
 const c=await pg.context().newCDPSession(pg);await c.send('Profiler.enable');await c.send('Profiler.start');
 await pg.keyboard.type('x');await pg.waitForTimeout(500);
 await pg.waitForSelector('[data-thesis-pagination-ready="true"]',{timeout:300000});
 const {profile}=await c.send('Profiler.stop');
 const self=new Map();const dt=profile.timeDeltas;const idx=new Map(profile.nodes.map(n=>[n.id,n]));
 profile.samples.forEach((s,i)=>{const n=idx.get(s);const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').pop().split('?')[0]+':'+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+dt[i]);});
 console.log([...self].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>(v/1000|0)+'ms '+k).join('\n'));
 await b.close();
})();
