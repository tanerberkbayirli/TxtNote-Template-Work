import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const b=await chromium.connectOverCDP('http://127.0.0.1:9333');
const p=b.contexts()[0].pages()[0];
console.log(await p.evaluate(process.argv[2]));
await b.close();
