// Independent browser DOM equivalence check for existing hand-authored fixtures.
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {contentNodesFromHtml,contentNodesToHtml} from '../../engine/src/contentModel.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url),{chromium}=require('../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage();const results=[];
try {
  for(const file of readdirSync(resolve(root,'orchestration/specs')).filter(n=>n.endsWith('.fixture.json'))) {
    const fixture=JSON.parse(readFileSync(resolve(root,'orchestration/specs',file),'utf8'));
    for(const [section,html] of Object.entries({main:fixture.content,...fixture.researchData?.thesis?.sectionContent})) {
      if(!html)continue;
      console.log(file+':'+section);
      const projected=contentNodesToHtml(contentNodesFromHtml(html));
      const result=await page.evaluate(([left,right])=>{
        const clean=html=>{const t=document.createElement('template');t.innerHTML=html;for(const n of t.content.querySelectorAll('*')) for(const a of ['data-txt-node-id','data-academic-id','data-fn-id'])n.removeAttribute(a);return t;};
        const a=clean(left),b=clean(right);const equal=a.content.isEqualNode(b.content);
        const original=a.innerHTML,projected=b.innerHTML;
        let i=0;while(i<original.length&&original[i]===projected[i])i++;
        return {equal,...(!equal?{at:i,original:original.slice(Math.max(0,i-120),i+220),projected:projected.slice(Math.max(0,i-120),i+220)}:{})};
      },[html,projected]);
      results.push({fixture:file,section,...result});
    }
  }
  const report={status:results.every(r=>r.equal)?'PASS':'FAIL',sections:results.length,failures:results.filter(r=>!r.equal)};
  writeFileSync(resolve(root,'orchestration/engine-work/mission02/projection-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));process.exitCode=report.status==='PASS'?0:1;
}finally{await browser.close();}
