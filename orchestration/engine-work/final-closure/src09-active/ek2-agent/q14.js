(()=>{
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
return [...document.querySelectorAll('tr[data-thesis-row-min-break]')].map(r=>{const rr=r.getClientRects()[0];const si=sheets.findIndex(s=>rr.top>=s.top-1&&rr.top<s.bottom);return [si+1,Math.round((rr.top-sheets[si].top)/z*.75*10)/10,Math.round(rr.height/z*.75*10)/10,r.hasAttribute('data-docx-exact'),getComputedStyle(r).getPropertyValue('--thesis-source-row-min'),r.textContent.slice(0,25)].join(' | ')}).join('\n');})()
