import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mcbuThesis} from './task10b-document.mjs';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1450,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const selected=async id=>assert.deepEqual(await page.locator('[data-layout-selection-box]').evaluateAll(ns=>ns.map(n=>n.dataset.layoutSelectionBox)),[id]);
const bounds=locator=>locator.evaluate(n=>{const paper=n.closest('.thesis-paper')||n.closest('.thesis-page-stack').querySelector('.thesis-paper'),p=paper.getBoundingClientRect(),r=n.getBoundingClientRect(),scale=p.width/210;return {x:(r.left-p.left)/scale,y:(r.top-p.top)/scale,w:r.width/scale,font:parseFloat(getComputedStyle(n).fontSize)*.75}});
try{
await page.goto('http://127.0.0.1:5175/tests/thesis.html');const doc=mcbuThesis('');await page.evaluate(d=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(d)),doc);await page.reload();await page.locator('.thesis-paper').first().waitFor();await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');
const nodes=await page.locator('[data-layout-presentation]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.layoutId,text:n.innerText})));assert.ok(nodes.length>10);
for(const {id}of nodes){const loc=page.locator(`[data-layout-id="${id}"]`);await loc.scrollIntoViewIfNeeded();await loc.click();await settle();await selected(id)}console.log('PASS all '+nodes.length+' generated and static paragraphs select individually');
const row=page.locator('.thesis-toc li[data-layout-id]').nth(2);const id=await row.getAttribute('data-layout-id');await row.click();await settle();const neighborId=await row.evaluate(n=>n.nextElementSibling.dataset.layoutId),neighbor=page.locator('[data-layout-id="'+neighborId+'"]');const neighborBefore=await bounds(neighbor);const before=await bounds(row),number=await row.locator('.thesis-index-page').textContent();
await page.keyboard.press('ArrowRight');await settle();const moved=await bounds(row);assert.ok(Math.abs(moved.x-before.x-.25)<.05);assert.ok(Math.abs(moved.y-before.y)<.05);assert.ok(Math.abs((await bounds(neighbor)).y-neighborBefore.y)<.05);console.log('PASS generated row moves without changing neighboring flow');
await page.keyboard.press('Control+z');await settle();assert.ok(Math.abs((await bounds(row)).x-before.x)<.05);await page.keyboard.press('Control+y');await settle();assert.ok(Math.abs((await bounds(row)).x-moved.x)<.05);
await page.getByLabel('Punto',{exact:true}).fill('16');await settle();assert.equal(Math.round((await bounds(row)).font),16);console.log('PASS generated row typography, undo and redo');
await row.dblclick();await page.keyboard.press('Control+a');await page.keyboard.type('Dizin satiri duzenlendi');await page.keyboard.press('Escape');await settle();assert.equal(await row.locator('.thesis-index-page').textContent(),number);assert.match(await row.innerText(),/Dizin satiri duzenlendi/);console.log('PASS row label can be edited while its automatic page field survives');
const saved=await bounds(row);await page.reload();await page.locator(`[data-layout-id="${id}"]`).waitFor();await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await settle();const reopened=page.locator(`[data-layout-id="${id}"]`);assert.match(await reopened.innerText(),/Dizin satiri duzenlendi/);const after=await bounds(reopened);assert.ok(Math.abs(after.x-saved.x)<.05);assert.equal(Math.round(after.font),16);console.log('PASS position, label and typography persist after reload');
const pageNumber=page.locator('.thesis-page-number[data-layout-id]').first();await pageNumber.scrollIntoViewIfNeeded();const numId=await pageNumber.getAttribute('data-layout-id');const nb=await pageNumber.boundingBox();await page.mouse.click(nb.x+nb.width/2,nb.y+nb.height/2);await settle();await selected(numId);const numBefore=await bounds(pageNumber);await page.keyboard.press('ArrowRight');await settle();const numAfter=await bounds(pageNumber);assert.ok(Math.abs(numAfter.x-numBefore.x-.25)<.05);assert.ok(Math.abs(numAfter.y-numBefore.y)<.05);await page.getByLabel('Punto',{exact:true}).fill('14');await settle();assert.equal(Math.round((await bounds(pageNumber)).font),14);console.log('PASS automatic page number selects, moves and accepts typography');assert.deepEqual(errors,[]);
}finally{await browser.close()}





