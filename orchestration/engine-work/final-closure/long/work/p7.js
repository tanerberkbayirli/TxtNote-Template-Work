(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(s=>y>=s[0]&&y<s[1])+1;
 const els=[...document.querySelectorAll('[data-native-object="drawing"]')].filter(e=>/yerleşim önizlemesi/.test(e.textContent));
 return els.map(el=>{
  let blk=el; while(blk.parentElement&&!/thesis-body|rich-text-body/.test(blk.parentElement.className))blk=blk.parentElement;
  const info=b=>{if(!b)return null;const r=b.getBoundingClientRect();const cs=getComputedStyle(b);return {tag:b.tagName,t:b.textContent.slice(0,30),top:Math.round(r.top+scrollY),h:Math.round(r.height),page:pageOf(r.top+scrollY+1),pb:pageOf(r.bottom+scrollY-1),cls:b.className.slice(0,30),mt:cs.marginTop,mb:cs.marginBottom,pagebr:b.querySelector?[...b.querySelectorAll('[data-docx-break]')].length:0}};
  const r=el.getBoundingClientRect();
  return {id:el.dataset.txtNodeId,prev:info(blk.previousElementSibling),blk:info(blk),next:info(blk.nextElementSibling),prev2:info(blk.previousElementSibling?.previousElementSibling),elH:r.height,sec:blk.closest('[data-thesis-flow-section]')?.dataset.thesisFlowSection};
 });
})()
