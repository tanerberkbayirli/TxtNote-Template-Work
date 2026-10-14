(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
const loc=(b)=>{const i=sheets.findIndex(s=>b.top>=s.top-1&&b.top<s.bottom);if(i<0)return ["?",0];return [i+1,Math.round((b.top-sheets[i].top)/z*.75*10)/10]};
const out=[];
for(const ri of [24,25]){ const r=t.rows[ri]; out.push('ROW '+ri+' '+r.getAttribute('data-docx-exact')+' rects '+[...r.getClientRects()].map(x=>loc(x).join('@')+'h'+Math.round(x.height/z*.75*10)/10).join(' '));
 [...r.cells].forEach((c,k)=>{ const ps=[...c.querySelectorAll('p')].filter(p=>getComputedStyle(p).display!=='none'); out.push(' cell'+k+' rs'+c.rowSpan+' n'+ps.length+' '+ps.map(p=>{const q=p.getClientRects()[0]; return q?loc(q).join('@'):'-'}).join(' ')); }); }
return out.join('\n');})()
