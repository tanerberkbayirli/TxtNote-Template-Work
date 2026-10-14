(()=>{
const ROW=9;
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sh=document.querySelector('.thesis-sheet');const z=sh.getBoundingClientRect().width/sh.offsetWidth;const f=v=>Math.round(v/z*.75*100)/100;
const r=t.rows[ROW];const out={rowH:f(r.getBoundingClientRect().height),min:getComputedStyle(r).getPropertyValue('--thesis-source-row-min')};
out.cells=[...r.cells].map((c,k)=>{const w=document.createElement('div');w.style.cssText='display:flow-root';const st=c.style.cssText;c.style.cssText+=';height:1px!important;min-height:0!important';while(c.firstChild)w.appendChild(c.firstChild);c.appendChild(w);const h=f(w.getBoundingClientRect().height);
 const kids=[...w.children].map(k=>{const b=k.getBoundingClientRect(),s=getComputedStyle(k);return k.tagName+':'+f(b.height)+'/mt'+s.marginTop+'/mb'+s.marginBottom});
 while(w.firstChild)c.appendChild(w.firstChild);w.remove();c.style.cssText=st;return {k,h,kids:kids.length>10?kids.slice(0,3).concat(['...'],kids.slice(-4)):kids}});
return out;})()
