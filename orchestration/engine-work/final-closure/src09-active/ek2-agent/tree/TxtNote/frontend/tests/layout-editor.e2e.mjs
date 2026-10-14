import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {mcbuThesis} from './task10b-document.mjs';
import {layoutEditorChecks} from './layout-editor-checks.mjs';
import {layoutExportChecks} from './layout-export-checks.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1450,height:1000}});
await page.context().grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5175'});
const out=new URL('../../output/page-layout/',import.meta.url);
const file=name=>new URL(name,out).pathname.replace(/^\/(\w:)/,'$1');
await mkdir(out,{recursive:true});
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
const pass=message=>{checks.push(message);console.log('PASS '+message);};
try{
 await page.goto('http://127.0.0.1:5175/tests/thesis.html');
 const figure=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=420;c.height=210;const ctx=c.getContext('2d');ctx.fillStyle='#dceafb';ctx.fillRect(0,0,420,210);ctx.fillStyle='#172033';ctx.font='24px Arial';ctx.fillText('Layout export fixture',30,110);return c.toDataURL('image/png');});
 const doc=mcbuThesis(figure);await page.evaluate(d=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(d)),doc);await page.reload();
 await page.locator('[data-layout-id]').first().waitFor();
 const result=await layoutEditorChecks(page,pass,{reload:async()=>{await page.reload();await page.locator('[data-layout-id]').first().waitFor();}});
 const files={};for(const [button,ext]of [['PDF','pdf'],['Word','docx']]){const download=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await(await download).saveAs(file('layout-editor.'+ext));files[ext]=file('layout-editor.'+ext);}
 pass('10: real editor PDF and DOCX exports generated');
 const semantic=await layoutExportChecks(page,files,{toleranceMm:.25,pageCount:await page.locator('.thesis-sheet').count(),elements:[{id:result.id,type:'text',text:'Canonical editable text',xMm:40.25,yMm:42,widthMm:140,fontFamily:'Times New Roman',fontSizePt:12},{selector:'[data-layout-type="image"]',type:'image',...result.imageGeometry}]});
 pass('11/13: real PDF/OOXML geometry, TNR12 and editable text-box semantic round-trip');
 const document=await page.evaluate(()=>window.thesisTest.getDoc());await writeFile(file('document.json'),JSON.stringify(document,null,2));
 const flowMetrics=await page.locator('[data-thesis-flow-section="main"] :is(figure,table)').evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return {tag:node.tagName,width:r.width,height:r.height,marginTop:s.marginTop,marginBottom:s.marginBottom};}));
 assert.deepEqual(errors,[]);await page.screenshot({path:file('editor.png')});
 await writeFile(file('browser.json'),JSON.stringify({status:'PASS',checks,result,files,semantic,flowMetrics,errors},null,2));
}catch(error){await page.screenshot({path:file('failure.png')});await writeFile(file('browser.json'),JSON.stringify({status:'FAIL',checks,error:error.stack,errors},null,2));throw error;}finally{await browser.close();}
