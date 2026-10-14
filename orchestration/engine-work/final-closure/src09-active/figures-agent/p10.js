()=>{const sh=document.querySelectorAll('.thesis-sheet')[90];const r=sh.getBoundingClientRect();const k=841.9/r.height;
const p=document.querySelector('.txn-docx-15966');const out=[];
let e=p.previousElementSibling;for(let i=0;i<3&&e;i++,e=e.previousElementSibling){out.push([e.tagName,e.className.slice(0,30),[...e.getClientRects()].map(b=>[+((b.top-r.top)*k).toFixed(1),+((b.bottom-r.top)*k).toFixed(1)])])}
const b=p.getClientRects();out.push(['p',[...b].map(b=>[+((b.top-r.top)*k).toFixed(1),+((b.bottom-r.top)*k).toFixed(1)])]);
const cs=getComputedStyle(p);
const cont=p.parentElement;const cb=cont.getBoundingClientRect();
return {out,cont:[cont.className.slice(0,40),+((cb.top-r.top)*k).toFixed(1),getComputedStyle(cont).columnWidth,getComputedStyle(cont).height,getComputedStyle(cont).paddingTop],margins:[cs.marginTop,cs.marginBottom,cs.paddingTop],sheetpad:getComputedStyle(sh).paddingTop,
 next:(()=>{const n=p.nextElementSibling;return [n.className,[...n.getClientRects()].map(b=>[+((b.top-r.top)*k).toFixed(1),+((b.bottom-r.top)*k).toFixed(1)]),getComputedStyle(n).marginTop]})()}}
