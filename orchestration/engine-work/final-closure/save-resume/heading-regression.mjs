import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome'});
try {
  const p=await browser.newPage();await p.goto('http://127.0.0.1:5193');
  const results=await p.evaluate(async()=>{
    const {decorateAcademicDom}=await import('/src/lib/academicDocument.js');
    const view=html=>{const root=document.createElement('div');root.innerHTML=html;return root;};
    const imported=view('<h1 data-txt-node-id="docx-1" data-docx-style="Heading1">Introduction</h1><p>Body</p>');
    const initial=imported.innerHTML;
    decorateAcademicDom(imported,{explicitHeadings:true,headingNumbers:false,captions:false});
    decorateAcademicDom(imported,{explicitHeadings:true,headingNumbers:false,captions:false});
    const authored=view('<h2 class="academic-h academic-h2" data-academic-id="authored" data-number="7.2" data-unnumbered="true">Authored</h2>');
    const authoredBefore=authored.innerHTML;
    decorateAcademicDom(authored,{explicitHeadings:true,headingNumbers:false,captions:false});
    const legacy=view('<h1>Introduction</h1><h2>Details</h2>');decorateAcademicDom(legacy);
    return {importedUnchanged:imported.innerHTML===initial,authoredUnchanged:authored.innerHTML===authoredBefore,legacyNumbers:[...legacy.querySelectorAll('h1,h2')].map(n=>n.dataset.number),legacyClasses:[...legacy.querySelectorAll('h1,h2')].map(n=>n.classList.contains('academic-h'))};
  });
  assert.equal(results.importedUnchanged,true);assert.equal(results.authoredUnchanged,true);
  assert.deepEqual(results.legacyNumbers,['1','1.1']);assert.deepEqual(results.legacyClasses,[true,true]);
  writeFileSync('orchestration/engine-work/final-closure/save-resume/heading-regression.json',JSON.stringify({status:'PASS',...results},null,2));
  console.log('PASS: imported headings unchanged, authored flags preserved, legacy numbering retained');
} finally {await browser.close();}
