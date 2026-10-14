import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import readline from 'node:readline';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000}});
await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
const page=await context.newPage();
await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_MATH_RESUME');
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
console.log('READY');
const rl=readline.createInterface({input:process.stdin});
for await(const line of rl){
 try{
  const command=JSON.parse(line);
  if(command.close)break;
  const result=command.extract?await page.evaluate(readFileSync('orchestration/engine-work/final-closure/long/extract-words.js','utf8')):await page.evaluate(command.script);
  if(command.out)writeFileSync(command.out,JSON.stringify(result,null,2));
  console.log(command.out?`SAVED ${command.out}`:JSON.stringify(result));
 }catch(e){console.log('ERROR '+e.stack);}
}
await browser.close();
