(()=>{
const r=document.querySelector('tr[data-thesis-row-min-break][data-docx-exact]');
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
r.removeAttribute('data-thesis-row-min-break');
const rr=r.getClientRects();
const si=sheets.findIndex(s=>rr[0].top>=s.top-1&&rr[0].top<s.bottom);
const out={pg:si+1,top:Math.round((rr[0].top-sheets[si].top)/z*.75*100)/100,h:rr.length+':'+[...rr].map(x=>Math.round(x.height/z*.75*100)/100)};
r.setAttribute('data-thesis-row-min-break','');
return out;})()
