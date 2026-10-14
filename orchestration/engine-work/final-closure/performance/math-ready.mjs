import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const b=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await b.newContext(),p=await context.newPage(),report={};
try{
 await p.goto('http://127.0.0.1:5193/tests/thesis-batchb.html');
 const fixture=JSON.parse(readFileSync('TxtNote/frontend/tests/generated/s1.fixture.json','utf8'));
 fixture.content+='<p><span class="math-formula math-formula--inline" data-latex="x^2" data-display="inline"></span></p>';
 await p.evaluate(f=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(f)),fixture);
 await p.route(/katex.*(?:\.js|\.css)/,r=>r.abort());await p.reload();
 await p.waitForSelector('.math-formula__render--error',{timeout:60000});
 await p.waitForFunction(()=>document.body.textContent.includes('Denklem görünümü yüklenemedi; sayfalama doğrulanamadı'),null,{timeout:60000});
 await p.locator('details').filter({hasText:'Denklem görünümü yüklenemedi; sayfalama doğrulanamadı'}).locator('summary').click();
 report.errorVisible=true;report.notReady=await p.locator('[aria-label="Belge sayfaları"]').getAttribute('data-thesis-pagination-ready')!=='true';
 report.status=report.errorVisible&&report.notReady?'PASS':'FAIL';
}catch(e){report.status='ERROR';report.error=String(e.stack||e);}
finally{writeFileSync('orchestration/engine-work/final-closure/performance/math-ready.json',JSON.stringify(report,null,2));await b.close();console.log(report);if(report.status!=='PASS')process.exitCode=1;}
