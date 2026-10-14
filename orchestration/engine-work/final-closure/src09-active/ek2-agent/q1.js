(()=>{
const tables=[...document.querySelectorAll('.thesis-body table')];
const stack=document.querySelector('.thesis-sheet')?.parentElement;
const out=[];
for(const t of tables){ const txt=t.textContent; if(!/Chowdury/.test(txt)) continue;
 out.push({rows:t.rows.length,tall:t.hasAttribute('data-thesis-tall'),rr:[...t.rows].slice(0,8).map(r=>({t:r.textContent.slice(0,50),h:r.dataset.docxHeader,cont:r.getAttribute('data-thesis-cont'),hb:r.hasAttribute('data-thesis-head-break'),cs:r.dataset.docxCantsplit,rects:[...r.getClientRects()].map(x=>[Math.round(x.top),Math.round(x.height)])}))});
}
return out;})()
