import assert from "node:assert/strict";

const near = (actual, expected, label, tolerance = 0.25) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, actual ${actual}`);
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const nodeRect = async locator => locator.evaluate(node => {
  const paper = node.closest('.thesis-paper'), bounds = paper.getBoundingClientRect(), rect = node.getBoundingClientRect();
  const scale = bounds.width / (parseFloat(getComputedStyle(paper).width) * 25.4 / 96);
  return { xMm:(rect.left-bounds.left)/scale,yMm:(rect.top-bounds.top)/scale,widthMm:rect.width/scale,heightMm:rect.height/scale };
});

/** Exercises the real editor. Works on the Vite fixture and packaged WebView2. */
export async function layoutEditorChecks(page, pass, { reload } = {}) {
  await page.getByLabel('Yakınlaştır', {exact:true}).selectOption('100');
  await settle(page);
  const stacks=await page.locator('.thesis-display-frame').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom};}));
  stacks.slice(1).forEach((rect,index)=>assert.ok(rect.top>=stacks[index].bottom-.5,`page group ${index+1} overlaps the preceding multi-page group`));
  const text = page.locator('[data-layout-type="text"]').first();
  await text.scrollIntoViewIfNeeded(); await text.click(); await settle(page);
  const id = await text.getAttribute('data-layout-id');
  const object = page.locator(`[data-layout-id="${id}"]`);
  const initial = await nodeRect(object);
  await page.getByRole('tab',{name:'Öğe',exact:true}).click();
  await settle(page);
  assert.ok(await page.getByLabel('Yazı tipi',{exact:true}).inputValue());
  assert.ok(Number(await page.getByLabel('Punto',{exact:true}).inputValue()) > 0);
  pass('1: template text selected and canonical font/point properties inspected');
  await page.getByLabel('X (mm)',{exact:true}).fill('40');
  await page.getByLabel('Y (mm)',{exact:true}).fill('42');
  await page.getByLabel('Genişlik (mm)',{exact:true}).fill('140');
  await page.getByLabel('Punto',{exact:true}).fill('12');
  await settle(page);
  let position = await nodeRect(object); near(position.xMm,40,'X');near(position.yMm,42,'Y');near(position.widthMm,140,'frame width');
  assert.equal(await object.evaluate(n=>parseFloat(getComputedStyle(n).fontSize)*72/96),12);
  pass('2/9: canonical x40/y42/width140/font12 rendered; text frame reflows');
  await object.click(); const before = await nodeRect(object);
  await page.keyboard.press('ArrowRight'); await settle(page);
  near((await nodeRect(object)).xMm,before.xMm+.25,'keyboard nudge',.02);
  await page.keyboard.press('Control+z');await settle(page);near((await nodeRect(object)).xMm,before.xMm,'undo',.02);
  await page.keyboard.press('Control+y');await settle(page);near((await nodeRect(object)).xMm,before.xMm+.25,'redo',.02);
  pass('keyboard object nudge, undo and redo');
  const box=await object.boundingBox();await page.mouse.move(box.x+10,box.y+8);await page.mouse.down();await page.mouse.move(box.x+28,box.y+18,{steps:12});await page.mouse.up();await settle(page);
  const dragged = await nodeRect(object); assert.ok(Math.abs(dragged.xMm-before.xMm) > 1);
  await page.keyboard.press('Control+z');await settle(page);near((await nodeRect(object)).xMm,before.xMm+.25,'one drag transaction undo',.03);
  pass('drag commits one undo transaction');
  await object.dblclick(); await page.keyboard.press('Control+a'); await page.keyboard.type('Canonical editable text'); await page.keyboard.press('Escape'); await settle(page);
  assert.equal(await object.innerText(),'Canonical editable text');pass('double-click edits real text; Escape exits to object mode');
  const image=page.locator('[data-layout-type="image"]').first();
  let imageGeometry=null;
  if(await image.count()) {
    await image.scrollIntoViewIfNeeded(); await image.click(); await settle(page);
    assert.equal(await page.getByLabel('Yazı tipi',{exact:true}).count(),0);
    await page.getByLabel('En-boy oranını kilitle',{exact:true}).check();
    const bounds=await nodeRect(image), handle=page.getByLabel('Resize se',{exact:true});
    const h=await handle.boundingBox();await page.mouse.move(h.x+h.width/2,h.y+h.height/2);await page.mouse.down();await page.mouse.move(h.x+24,h.y+18,{steps:8});await page.mouse.up();await settle(page);
    const resized=await nodeRect(image);near(resized.widthMm/resized.heightMm,bounds.widthMm/bounds.heightMm,'aspect ratio',.005);
    imageGeometry=resized;
    pass('3: real template logo selection, resize and aspect lock; image-specific inspector');
    await image.click({button:'right'});await page.getByRole('menu').waitFor();await page.keyboard.press('Escape');
  }
  await object.scrollIntoViewIfNeeded();await object.click({button:'right'});await page.getByRole('menu').waitFor();await page.keyboard.press('Escape');
  pass('7: object context menus open');
  await page.getByRole('tab',{name:'Sayfa ayarları',exact:true}).click();
  await page.getByLabel('Uygulama kapsamı',{exact:true}).selectOption('document');
  await page.getByLabel('Alt',{exact:true}).fill('25');await page.getByLabel('Sol',{exact:true}).fill('30');
  await page.getByRole('button',{name:'Sayfa ayarlarını uygula',exact:true}).click();await settle(page);
  const margins=await page.locator('.thesis-paper').evaluateAll(ns=>ns.map(n=>({bottom:parseFloat(getComputedStyle(n).paddingBottom)*25.4/96,left:parseFloat(getComputedStyle(n).paddingLeft)*25.4/96,empty:n.dataset.thesisEmptyFlow==='true'})));
  for(const margin of margins.filter(m=>!m.empty)){near(margin.bottom,25,'global bottom');near(margin.left,30,'global left');}
  pass('8: entire-document bottom25/left30 mm applied');
  await page.getByRole('tab',{name:'Düzen',exact:true}).click();
  await page.getByRole('button',{name:'Düzen değişikliğini geri al',exact:true}).click();await settle(page);
  assert.ok(await page.locator('.thesis-paper').evaluateAll(ns=>ns.some(n=>Math.abs(parseFloat(getComputedStyle(n).paddingLeft)*25.4/96-30)>.5)));
  await page.getByRole('button',{name:'Düzen değişikliğini yinele',exact:true}).click();await settle(page);
  for(const margin of await page.locator('.thesis-paper').evaluateAll(ns=>ns.filter(n=>n.dataset.thesisEmptyFlow!=='true').map(n=>parseFloat(getComputedStyle(n).paddingLeft)*25.4/96)))near(margin,30,'page redo');
  await page.getByRole('button',{name:'Cetvelleri göster veya gizle',exact:true}).click();
  await page.getByLabel('Cetvel birimi',{exact:true}).selectOption('pt');assert.match(await page.locator('[data-ruler-axis="x"]').first().getAttribute('aria-label'),/pt/);
  await page.getByLabel('Cetvel birimi',{exact:true}).selectOption('mm');
  pass('page geometry undo/redo and ruler unit conversion');
  await page.getByRole('tab',{name:'Giriş',exact:true}).click();
  await object.click();await settle(page);const saved=await nodeRect(object);
  if(reload){await reload();await page.getByLabel('Yakınlaştır',{exact:true}).selectOption('100');await settle(page);const reopened=await nodeRect(page.locator(`[data-layout-id="${id}"]`));for(const key of ['xMm','yMm','widthMm'])near(reopened[key],saved[key],`reload ${key}`, .02);assert.equal(await page.locator(`[data-layout-id="${id}"]`).innerText(),'Canonical editable text');pass('12: persisted layout/content survive reload');}
  return {id,initial,saved,margins,imageGeometry};
}
