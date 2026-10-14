(()=>{
const T=window.__T||{};
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const z=sheets[0].width/document.querySelector('.thesis-sheet').offsetWidth;
const loc=(x)=>{const i=sheets.findIndex(s=>x.top>=s.top-1&&x.top<s.bottom);return i<0?null:[i+1,Math.round((x.top-sheets[i].top)/z*.75*10)/10,Math.round(x.height/z*.75*10)/10]};
return [...t.rows].map((r,i)=>[i,r.textContent.slice(0,16),...[...r.getClientRects()].map(loc)]).map(a=>JSON.stringify(a)).join('\n');})()
