import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),dist=resolve(root,'TxtNote/frontend/dist'),require=createRequire(import.meta.url);
const csp=JSON.parse(readFileSync(resolve(root,'TxtNote/src-tauri/tauri.conf.json'),'utf8')).app.security.csp;
const entry=readdirSync(resolve(dist,'assets')).find(n=>/^importPdf-.*\.js$/.test(n));assert.ok(entry);
const source=readFileSync(resolve(dist,'assets',entry),'utf8'),exports=source.match(/export\{([^}]+)\}/)?.[1];assert.ok(exports);
const alias=exports.split(',').map(s=>s.trim().split(' as ').at(-1))[0];
const runner=`import {${alias} as load} from '/assets/${entry}';
try {const bytes=await (await fetch('/input.pdf')).arrayBuffer();const note=await load(new File([bytes],'scan.pdf',{type:'application/pdf'}),{title:'CSP'});window.result={pages:note.researchData.thesis.document.sections.length,methods:note.researchData.thesis.document.source.pages.map(p=>p.method)};}catch(e){window.failure=e.stack||e.message;}`;
const server=createServer((req,res)=>{
 try{
  res.setHeader('Content-Security-Policy',csp);
  if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta charset="utf-8"><script type="module" src="/runner.js"></script>');}
  if(req.url==='/runner.js'){res.setHeader('Content-Type','text/javascript');return res.end(runner);}
  if(req.url==='/input.pdf'){res.setHeader('Content-Type','application/pdf');return res.end(readFileSync(resolve(root,'orchestration/engine-work/mission01/inputs/edge-synthetic-scans-final.pdf')));}
  const path=resolve(dist,'.'+decodeURIComponent(req.url.split('?')[0]));if(!path.startsWith(dist+sep)){res.writeHead(403);return res.end();}
  const mime={'.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.css':'text/css','.json':'application/json'}[extname(path)]||'application/octet-stream';res.setHeader('Content-Type',mime);res.end(readFileSync(path));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const {chromium}=require('../tools/node_modules/playwright');const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage(),violations=[],external=[];
 page.on('console',m=>{if(/Content Security Policy|Refused to/i.test(m.text()))violations.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto(origin);await page.waitForFunction(()=>window.result||window.failure,{},{timeout:180000});
 const result=await page.evaluate(()=>({result:window.result,failure:window.failure}));assert.equal(result.failure,undefined);assert.equal(result.result.pages,3);assert.deepEqual(result.result.methods,['ocr','ocr','ocr']);assert.deepEqual(violations,[]);assert.deepEqual(external,[]);
 writeFileSync(resolve(root,'orchestration/engine-work/mission04/csp-verification.json'),JSON.stringify({status:'PASS',productionBundle:true,csp,...result.result,violations,externalRequests:external},null,2));console.log('PASS: production PDF/OCR under exact desktop CSP, no external requests');
}finally{await browser.close();await new Promise(r=>server.close(r));}
