()=>{const sheets=[...document.querySelectorAll('.thesis-sheet')];
const ids=[...document.querySelectorAll('.thesis-sheet')].length;
const el=document.querySelector('[data-txt-node-id="docx-15505"]');const r=el.getBoundingClientRect();
return {n:ids,h:r.height,top:r.top+scrollY,sheetTops:sheets.slice(87,93).map(s=>Math.round(s.getBoundingClientRect().top+scrollY))}}
