const path=require('path');const fs=require('fs');
const {chromium}=require(path.resolve('orchestration/tools/node_modules/playwright'));
(async()=>{
 const id=process.argv[2]; const extract=fs.readFileSync('orchestration/engine-work/mission07/extract.js','utf8');
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping'],headless:true});
 const p=await b.newPage({viewport:{width:1400,height:900}});
 await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
 let v=null;const t0=Date.now();
 while(Date.now()-t0<300000){await new Promise(r=>setTimeout(r,5000));try{v=await p.evaluate(extract);}catch(e){} if(v)break;}
 if(!v){console.log('timeout');process.exit(1);}
 fs.writeFileSync(`orchestration/engine-work/t8/${id}.pages.json`,JSON.stringify(v));
 console.log('sheets',v.length);
 if(process.argv[3]){fs.writeFileSync(`orchestration/engine-work/t8/${id}.probe.json`,JSON.stringify(await p.evaluate(fs.readFileSync(process.argv[3],'utf8'))));}
 await b.close();
})();
