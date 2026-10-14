(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sh=document.querySelector('.thesis-sheet');const z=sh.getBoundingClientRect().width/sh.offsetWidth;const f=v=>Math.round(v/z*.75*100)/100;
const out={};
const r=t.rows[6];
out.base=f(r.getBoundingClientRect().height);
const store=[...r.cells].map(c=>c.style.cssText);
for(const k of [0,1,2,3]){
  r.cells[k].style.cssText+=';height:1px!important;min-height:0!important';
  // measure natural content height of cell via inner wrapper
  const c=r.cells[k];
  const w=document.createElement('div');w.style.cssText='display:flow-root';while(c.firstChild)w.appendChild(c.firstChild);c.appendChild(w);
  out['content'+k]=f(w.getBoundingClientRect().height);
  while(w.firstChild)c.appendChild(w.firstChild);w.remove();c.style.cssText=store[k];
}
out.trh=getComputedStyle(r).getPropertyValue('--thesis-source-row-min');
out.after=f(r.getBoundingClientRect().height);
return out;})()
