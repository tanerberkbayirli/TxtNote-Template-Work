import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {importThesisDocx} from '../../engine/src/importDocx.js';
import {contentNodesToHtml} from '../../engine/src/contentModel.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(import.meta.url);
const {chromium}=require('../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage();
const oracle=JSON.parse(readFileSync(resolve(root,'orchestration/engine-work/mission03/source-oracle.json'))),cases=[];
const ids=nodes=>nodes.flatMap(n=>[...(n.id?[n.id]:[]),...ids(n.children||[])]);
try{
  for(const source of oracle.cases){
    const document=await importThesisDocx(readFileSync(resolve(root,source.input.path))),sections=[];
    for(const section of document.sections){
      const html=contentNodesToHtml(section.nodes),expected=ids(section.nodes);
      const actual=await page.evaluate(html=>{const t=document.createElement('template');t.innerHTML=html;return [...t.content.querySelectorAll('[data-txt-node-id]')].map(n=>n.getAttribute('data-txt-node-id'));},html);
      assert.deepEqual(actual,expected,source.id+' '+section.id+' HTML reparsing changed semantic object identities/order');sections.push({id:section.id,objects:actual.length});
    }
    cases.push({id:source.id,status:'PASS',sections});console.log(source.id+' DOM PASS');
  }
  writeFileSync(resolve(root,'orchestration/engine-work/mission03/dom-verification.json'),JSON.stringify({status:'PASS',cases},null,2)+'\n');
}finally{await browser.close();}
