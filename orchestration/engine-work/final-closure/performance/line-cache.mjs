import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const b=await chromium.launch({channel:'chrome'}),p=await b.newPage();
try{
 await p.goto('http://127.0.0.1:5193/tests/thesis-batchb.html');
 const result=await p.evaluate(async()=>{
  const {layoutWordJustification:layout}=await import('/engine/wordLineLayout.js');
  const root=document.createElement('div');root.style.width='400px';root.innerHTML='<div data-thesis-section="s"><div class="thesis-body"><p contenteditable="true">'+('Türkçe uzun paragraf sözcükleri bir sonraki satıra taşınır. '.repeat(15))+'</p></div></div>';document.body.append(root);
  const css=document.createElement('style');css.textContent='.thesis-body p{font:12pt "Times New Roman";text-align:justify}.cache-theme .thesis-body p{font-size:14pt}';document.head.append(css);
  await document.fonts.ready;
  const model={sections:[{id:'s',rules:{justify:'word',page:{widthMm:210,margins:{leftMm:25,rightMm:25}}}}]},out={};
  out.initial=layout(root,model);out.sameDomNoop=!layout(root,model);
  const para=root.querySelector('p'),text=para.querySelector('[data-thesis-word-fit]').firstChild;text.data+=' Düzenleme';out.syncTextChange=layout(root,model);out.syncRepeatNoop=!layout(root,model);
  const s=getSelection(),r=document.createRange();r.setStart(para.querySelector('[data-thesis-word-fit]').firstChild,5);r.collapse(true);s.removeAllRanges();s.addRange(r);para.focus();
  root.style.width='350px';out.widthChange=layout(root,model);out.caretPreserved=s.anchorOffset===5;
  para.style.fontFamily='Arial';out.fontStyleChange=layout(root,model);
  css.textContent=css.textContent.replace('12pt','13pt');out.sameLengthStylesheetChange=layout(root,model);
  document.body.classList.add('cache-theme');out.ancestorClassChange=layout(root,model);out.finalRepeatNoop=!layout(root,model);
  root.style.textTransform='uppercase';layout(root,model);out.rootTextTransformUnwraps=!para.querySelector('[data-thesis-word-fit]');
  root.style.textTransform='none';out.rootTransformRestored=layout(root,model);
  return out;
 });
 const report={status:Object.values(result).every(Boolean)?'PASS':'FAIL',result};writeFileSync('orchestration/engine-work/final-closure/performance/line-cache.json',JSON.stringify(report,null,2));console.log(report);
}finally{await b.close();}
