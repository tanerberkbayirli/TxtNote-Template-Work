import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
// Regression: selection chrome must follow scrolling and stay inside the page viewport;
// AKÜ inner-cover lines must never paint on top of each other (zoom, scroll, selection, drag).
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1300,height:800},colorScheme:'dark'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const pass=message=>console.log('PASS '+message);
const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const doc={title:'Test tezi',content:'',researchData:{thesis:{templateId:'aku-fbe-master-tr-v1',templateVersion:'1.0.0',selection:{universityId:'aku',degreeType:'master',language:'tr'},values:{YEAR:'2026'},sectionContent:{},enabledSections:[]}}};
const coverOverlaps=()=>page.evaluate(()=>{
  const paper=document.querySelector('[data-thesis-section="inner-cover"]')||document.querySelectorAll('.thesis-paper')[1];
  const lines=[...paper.querySelectorAll('[data-layout-type="text"]')].filter(n=>n.textContent.trim()).map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent.trim().slice(0,30),top:r.top,bottom:r.bottom,left:r.left,right:r.right};});
  if(!lines.some(l=>l.text.startsWith('AFYON')))return ['fixture: inner cover not found'];const hits=[];lines.forEach((a,i)=>lines.slice(i+1).forEach(b=>{const v=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top),h=Math.min(a.right,b.right)-Math.max(a.left,b.left);if(v>1&&h>1)hits.push(`${a.text} ⟂ ${b.text} (${v.toFixed(1)}px)`);}));
  return hits;
});
const overlayState=()=>page.evaluate(()=>{
  const box=document.querySelector('[data-layout-selection-box]');if(!box)return null;
  const el=document.querySelector(`[data-layout-id="${CSS.escape(box.getAttribute('data-layout-selection-box'))}"][data-layout-type]`);
  const viewport=document.querySelector('[aria-label="Belge sayfaları"]').parentElement.getBoundingClientRect();
  const b=box.getBoundingClientRect(),e=el.getBoundingClientRect();
  const clip=box.closest('[data-layout-selection-clip]')?.style.clipPath||'';
  return {dx:b.left-e.left,dy:b.top-e.top,dw:b.width-e.width,dh:b.height-e.height,viewportTop:viewport.top,clipTop:parseFloat((clip.match(/inset\(([\d.]+)px/)||[])[1]),boxTop:b.top};
});
try{
  await page.goto('http://127.0.0.1:5175/tests/thesis.html');
  await page.evaluate(d=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(d)),doc);await page.reload();
  await page.locator('[data-layout-id]').first().waitFor();await settle();
  for(const zoom of ['fit','50','75','100','125','150','fit']){
    await page.getByLabel('Yakınlaştır',{exact:true}).selectOption(zoom);await settle();await page.waitForTimeout(150);
    assert.deepEqual(await coverOverlaps(),[],`inner-cover overlap at zoom ${zoom}`);
  }
  pass('inner cover lines do not overlap at any zoom');
  const afyon=page.locator('[data-layout-type="text"]',{hasText:'AFYON KOCATEPE ÜNİVERSİTESİ'}).first();
  await afyon.scrollIntoViewIfNeeded();await afyon.click();await settle();
  let state=await overlayState();assert.ok(state,'selection box rendered');
  for(const k of ['dx','dy','dw','dh'])assert.ok(Math.abs(state[k])<=1,`selection box ${k}=${state[k]} before scroll`);
  const scroller=page.locator('[aria-label="Belge sayfaları"]').locator('..');
  for(const delta of [120,240,-60,400,-760]){
    await scroller.evaluate((n,d)=>{n.scrollTop+=d;},delta);await settle();
    state=await overlayState();
    for(const k of ['dx','dy','dw','dh'])assert.ok(Math.abs(state[k])<=1,`selection box ${k}=${state[k]} after scroll ${delta}`);
    assert.ok(Math.abs(state.clipTop-state.viewportTop)<=1,`clip top ${state.clipTop} vs viewport ${state.viewportTop}`);
  }
  await page.mouse.wheel(0,500);await settle();state=await overlayState();
  assert.ok(Math.abs(state.dy)<=1,`selection box dy=${state.dy} after wheel`);
  pass('selection box follows scroll and is clipped to the page viewport');
  assert.deepEqual(await coverOverlaps(),[],'inner-cover overlap after selection/scroll');
  // What is shown while dragging/resizing must be exactly where the object lands on drop, at every zoom.
  for(const zoom of ['75','100','150','fit']){
    await page.getByLabel('Yakınlaştır',{exact:true}).selectOption(zoom);await settle();await page.waitForTimeout(150);
    const target=page.locator('[data-layout-section="inner-cover"][data-layout-type="text"]',{hasText:'YÜKSEK'}).first();
    await target.scrollIntoViewIfNeeded();await settle();
    const rect=()=>target.evaluate(n=>{const r=n.getBoundingClientRect();return {t:r.top,l:r.left,w:r.width,h:r.height};});
    const start=await target.boundingBox();
    await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
    await page.mouse.move(start.x+start.width/2+37,start.y+start.height/2+23,{steps:10});
    const during=await rect();await page.mouse.up();await settle();await page.waitForTimeout(300);
    const dropped=await rect();
    assert.ok(Math.abs(dropped.t-during.t)<=0.5&&Math.abs(dropped.l-during.l)<=0.5,`drop shifted by ${(dropped.t-during.t).toFixed(2)},${(dropped.l-during.l).toFixed(2)}px at zoom ${zoom}`);
    await target.click();await settle();
    const handle=await page.getByLabel('Resize se',{exact:true}).boundingBox();
    await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();
    await page.mouse.move(handle.x+handle.width/2+30,handle.y+handle.height/2+12,{steps:8});
    const resizing=await rect();await page.mouse.up();await settle();await page.waitForTimeout(300);
    const resized=await rect();
    for(const k of ['t','l','w'])assert.ok(Math.abs(resized[k]-resizing[k])<=0.5,`resize ${k} shifted by ${(resized[k]-resizing[k]).toFixed(2)}px at zoom ${zoom}`);
    await page.keyboard.press('Control+z');await settle();await page.keyboard.press('Control+z');await settle();
  }
  pass('drag/resize preview equals the dropped position at every zoom');
  // Dragging a flow line out of the flow must not pull the following lines up under it.
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('150');await settle();
  await afyon.scrollIntoViewIfNeeded();await settle();
  const tops=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[data-layout-section="inner-cover"][data-layout-type="text"]')].map(n=>[n.getAttribute('data-layout-id'),n.getBoundingClientRect().top])));
  const before=await tops();
  const box=await afyon.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+15,box.y+box.height/2+10,{steps:10});await page.mouse.up();await settle();
  const stored=(await page.evaluate(()=>window.thesisTest.getDoc())).researchData.thesis.layout?.elements||{};
  const movedId=Object.keys(stored).find(id=>stored[id].layoutMode==='absolute');
  assert.ok(movedId,'drag committed an absolute position');
  const after=await tops();
  for(const [id,top] of Object.entries(before))if(id!==movedId)assert.ok(Math.abs(after[id]-top)<=0.5,`${id} moved ${after[id]-top}px after dragging ${movedId}`);
  assert.ok(Math.abs(after[movedId]-before[movedId]-10)<=1.5,`dragged line moved ${after[movedId]-before[movedId]}px`);
  pass('dragging a cover line leaves the other lines in place');
  await page.reload();await page.locator('[data-layout-id]').first().waitFor();await settle();
  await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('150');await settle();
  await afyon.scrollIntoViewIfNeeded();await settle();
  const reloaded=await tops();
  const shift=reloaded[movedId]-after[movedId];
  for(const [id,top] of Object.entries(after))assert.ok(Math.abs(reloaded[id]-shift-top)<=0.5,`${id} differs after reload`);
  pass('positioned line and its preserved slot survive reload');
  await afyon.click();await settle();await page.keyboard.press('Control+z');await settle();
  assert.deepEqual(errors,[]);
}catch(error){await page.screenshot({path:'../output/overlay-scroll-failure.png'});throw error;}finally{await browser.close();}
