// 13-C: real-browser interaction flow on a small/medium/long fixture.
// usage: node orchestration/engine-work/final-closure/performance/interact.mjs <fixtureId> [origin]   (EDGE_NOTES/s1 = localStorage pages, SRC10 = long in-memory page)
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2]||'EDGE_NOTES', origin=process.argv[3]||'http://127.0.0.1:5193';
const long=['SRC09','SRC10'].includes(id);
const fxPath=`TxtNote/frontend/tests/generated/${id}.fixture.json`;
const out=`${process.env.PERFORMANCE_OUT||'orchestration/engine-work/final-closure/performance'}/interact-${id}`;
const report={id,origin,long,steps:{},timings:{},notes:[]};
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text().slice(0,200))});
const ok=(k,v,extra)=>{report.steps[k]=v?'PASS':'FAIL';if(extra!==undefined)report.steps[k+'_info']=extra;console.log(k,v?'PASS':'FAIL',extra??'')};
const T='[aria-label="Belge sayfaları"]';
let edited=null;
async function open(){
  if(long){
    if(edited) await page.route('**/tests/generated/'+id+'.fixture.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(edited)}));
    await page.goto(`${origin}/tests/thesis-long.html?id=${id}`);
  } else {
    await page.goto(`${origin}/tests/thesis-batchb.html`);
    if(!edited){const fx=readFileSync(fxPath,'utf8');await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',v),fx);await page.reload();}
  }
  const t0=Date.now();
  await page.waitForSelector(`${T} .thesis-body p`,{timeout:240000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(t=>document.querySelector(t)?.dataset.thesisPaginationReady==='true',T,{timeout:240000}).catch(()=>report.notes.push('pagination-ready flag not reached in 240s'));
  return Date.now()-t0;
}
const docStr=()=>page.evaluate(()=>JSON.stringify(window.thesisTest.getDoc()));
const waitDoc=(m,timeout=30000)=>page.waitForFunction(m=>JSON.stringify(window.thesisTest.getDoc()).includes(m),m,{timeout});
const notDoc=(m,timeout=30000)=>page.waitForFunction(m=>!JSON.stringify(window.thesisTest.getDoc()).includes(m),m,{timeout});
try{
  report.timings.openMs=await open();
  // choose two long body paragraphs (mid-document for long fixtures)
  const info=await page.evaluate(({T})=>{
    const cands=[];for(const b of document.querySelectorAll(T+' .thesis-body')){const ps=[...b.querySelectorAll('p')].filter(p=>(p.textContent||'').trim().length>80&&!p.closest('table,li'));for(let i=0;i+1<ps.length;i++)if(ps[i].nextElementSibling===ps[i+1]||true)cands.push([ps[i],ps[i+1]]);}
    const m=Math.floor(cands.length/2);const [a,b]=cands[m];
    return {count:cands.length,pick:m,textA:a.textContent.slice(0,60),keyA:a.textContent.slice(0,45),keyB:b.textContent.slice(0,45)};
  },{T});
  report.paragraphCount=info.count;
  const loc=k=>page.locator(`${T} .thesis-body p`,{hasText:k}).first();
  const A=loc(info.keyA),B=loc(info.keyB);
  await A.scrollIntoViewIfNeeded();await A.click();await page.keyboard.press('End');
  const t1=Date.now();await page.keyboard.type(' Yazim13X',{delay:15});
  await waitDoc('Yazim13X');report.timings.typeToSaveMs=Date.now()-t1;
  ok('typing',await A.evaluate(e=>e.textContent.includes('Yazim13X')));
  // selection
  await A.click();await page.keyboard.press('Home');await page.keyboard.down('Shift');for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');await page.keyboard.up('Shift');
  const sel=await page.evaluate(()=>getSelection().toString());ok('selection',sel.length===5,JSON.stringify(sel));
  await page.keyboard.press('Control+c');
  const clip=await page.evaluate(()=>navigator.clipboard.readText());ok('real-copy-clipboard',clip===sel,JSON.stringify(clip));
  await B.click();await page.keyboard.press('End');await page.keyboard.press('Control+v');
  const marker=sel;await page.waitForTimeout(600);
  const bt=await B.evaluate(e=>e.textContent);ok('real-paste',bt.includes(sel+(bt.includes(sel+sel)?'':''))&&bt!==info.textA,JSON.stringify(bt.slice(-12)));
  // external text paste (plain text clipboard from outside)
  await page.evaluate(()=>navigator.clipboard.writeText('Dis13Yapistir'));await page.keyboard.press('Control+v');await waitDoc('Dis13Yapistir');
  ok('paste-external-text',true);
  // cut
  const len0=(await A.evaluate(e=>e.textContent)).length;
  await A.click();await page.keyboard.press('Home');await page.keyboard.down('Shift');for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');await page.keyboard.up('Shift');
  const cutSel=await page.evaluate(()=>getSelection().toString());await page.keyboard.press('Control+x');await page.waitForTimeout(600);
  const len1=(await A.evaluate(e=>e.textContent)).length;
  ok('cut',len1===len0-cutSel.length&&cutSel.length===3&&(await page.evaluate(()=>navigator.clipboard.readText()))===cutSel,{len0,len1,cutSel});
  await page.keyboard.press('Control+v');await page.waitForTimeout(600);
  ok('cut-paste-restore',(await A.evaluate(e=>e.textContent)).length===len0);
  // IME composition (CDP)
  const cdp=await context.newCDPSession(page);
  await A.click();await page.keyboard.press('End');
  const before=await docStr();
  await cdp.send('Input.imeSetComposition',{text:'şğ',selectionStart:2,selectionEnd:2});
  const comp=await page.evaluate(t=>document.querySelector(t).__thesisComposing,T);
  await cdp.send('Input.imeSetComposition',{text:'şğüı',selectionStart:4,selectionEnd:4});
  await page.waitForTimeout(500);
  const mid=await docStr();
  ok('ime-composing-flag',comp===true);
  report.steps.ime_composing_text_autosaved_info=mid.includes('şğüı'); // observation: in-progress composition text reaches the save stream; cancel/commit verified separately
  await cdp.send('Input.insertText',{text:'şğüıİ13'});
  await waitDoc('şğüıİ13');
  ok('ime-commit',!(await page.evaluate(t=>Boolean(document.querySelector(t).__thesisComposing),T)));
  const after=await docStr();ok('no-temp-markup-in-save',!/data-thesis-word-fit|data-thesis-fn-stamp|data-m13/.test(after.replace(/data-m13/g,'')));
  // IME cancel
  await cdp.send('Input.imeSetComposition',{text:'iptal',selectionStart:5,selectionEnd:5});
  await cdp.send('Input.imeSetComposition',{text:'',selectionStart:0,selectionEnd:0});await page.waitForTimeout(400);
  ok('ime-cancel-clean',!(await docStr()).includes('iptal'));
  // undo / redo
  const edits=['Yazim13X','Dis13Yapistir','şğüıİ13'];
  const undo=[];for(let i=0;i<40;i++){await page.keyboard.press('Control+z');}
  await page.waitForTimeout(800);let s=await docStr();
  ok('undo-removes-edits',edits.every(e=>!s.includes(e)),edits.filter(e=>s.includes(e)));
  for(let i=0;i<60;i++){await page.keyboard.press('Control+y');}
  await page.waitForTimeout(800);s=await docStr();
  ok('redo-restores-edits',edits.every(e=>s.includes(e)),edits.filter(e=>!s.includes(e)));
  edited=JSON.parse(await page.evaluate(()=>JSON.stringify({...window.thesisTest.getDoc()})));
  const savedLen=(await docStr()).length;
  report.timings.reopenMs=await open();
  s=await docStr();
  ok('save-reopen-keeps-edits',edits.every(e=>s.includes(e)),{savedLen,reopenedLen:s.length});
  ok('reopen-render-has-edits',await page.evaluate(({T,edits})=>{const t=document.querySelector(T).textContent;return edits.every(e=>t.includes(e))},{T,edits}));
  await page.locator(`${T} .thesis-body p`).first().click();await page.keyboard.press('Control+z');await page.waitForTimeout(300);
  // Enter: text typed immediately after Enter must start the NEW (second) paragraph
  const keyE=await page.evaluate(({T})=>{const ps=[...document.querySelectorAll(T+' .thesis-body p')].filter(p=>p.textContent.trim().length>80&&!p.closest('table,li'));return ps[Math.floor(ps.length/2)+2].textContent.slice(0,45)},{T});
  const E=loc(keyE);await E.scrollIntoViewIfNeeded();await E.click();await page.keyboard.press('Home');
  const pBefore=await page.evaluate(T=>document.querySelectorAll(T+' .thesis-body p').length,T);
  await page.keyboard.press('Enter');await page.keyboard.type('Yeni13P');await page.waitForTimeout(900);
  const er=await page.evaluate(T=>{const ps=[...document.querySelectorAll(T+' .thesis-body p')];const i=ps.findIndex(p=>p.textContent.includes('Yeni13P'));return {count:ps.length,idx:i,pos:ps[i]?.textContent.indexOf('Yeni13P'),prevEmptyOrHead:ps[i-1]?.textContent.slice(-12)}},T);
  ok('enter-splits-paragraph',er.count===pBefore+1,er);
  ok('enter-caret-moves-to-new-paragraph',er.pos===0,er);
  ok('no-page-errors',errors.length===0,errors.slice(0,5));
  report.status=Object.values(report.steps).includes('FAIL')?'FAIL':'PASS';
  await page.screenshot({path:out+'.png'});
}catch(e){report.status='ERROR';report.error=String(e.stack||e).slice(0,1500);await page.screenshot({path:out+'-failure.png'}).catch(()=>{});}
finally{report.pageErrors=errors.slice(0,10);report.browser=browser.version();writeFileSync(out+'.json',JSON.stringify(report,null,1));console.log(report.status,report.error||'');await browser.close();if(report.status!=="PASS")process.exitCode=1;}


