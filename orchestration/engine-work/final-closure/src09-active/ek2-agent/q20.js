(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const r=t.rows[28];const sh=document.querySelector('.thesis-sheet');const zoom=sh.getBoundingClientRect().width/sh.offsetWidth;
const fr=[...r.getClientRects()].filter(x=>x.height>zoom*.5&&x.width>0);
const v=getComputedStyle(r).getPropertyValue('--thesis-source-row-min').trim();
return {zoom,n:fr.length,tail:fr.at(-1)?.height/zoom,min:parseFloat(v)*96/25.4,spans:[...r.cells].map(c=>c.rowSpan),prevSpanning:[...t.rows[27].cells].map(c=>c.rowSpan)};})()
