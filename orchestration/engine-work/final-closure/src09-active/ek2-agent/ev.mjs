import {createRequire} from 'node:module';import {readFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const b=await chromium.connectOverCDP('http://127.0.0.1:'+(process.env.PORT||'9341'));
const page=b.contexts()[0].pages()[0];
const r=await page.evaluate(readFileSync(process.argv[2],'utf8'));
console.log(typeof r==='string'?r:JSON.stringify(r,null,1));
await b.close().catch(()=>{});process.exit(0);
