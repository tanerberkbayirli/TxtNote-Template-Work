(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
const loc=(b)=>{const i=sheets.findIndex(s=>b.top>=s.top-1&&b.top<s.bottom);if(i<0)return ["?",0];return [i+1,Math.round((b.top-sheets[i].top)/z*.75*10)/10]};
const out=[];
for(const ri of (window.__rows||[28])){const r=t.rows[ri];
 out.push('ROW '+ri+' min='+getComputedStyle(r).getPropertyValue('--thesis-source-row-min')+' rects '+[...r.getClientRects()].map(x=>loc(x).join('@')+'h'+Math.round(x.height/z*.75*10)/10).join(' ')+' attrs='+[...r.attributes].map(a=>a.name).join(','));
 [...r.cells].forEach((c,k)=>{ const ps=[...c.querySelectorAll('p')].filter(p=>getComputedStyle(p).display!=='none'); out.push(' cell'+k+' n'+ps.length+' '+ps.map(p=>{const q=p.getClientRects(); return [...q].map(x=>loc(x).join('@')).join('+')}).join(' ')+' tail:'+(c.querySelector('[data-thesis-row-tail]')?.style.height||'')); }); }
return out.join('\n');})()
