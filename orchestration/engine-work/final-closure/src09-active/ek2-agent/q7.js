(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sheets=[...document.querySelectorAll('.thesis-sheet')];
const z=sheets[0].getBoundingClientRect().width/ sheets[0].offsetWidth;
const rows=[...t.rows].map((r,i)=>({i,t:r.textContent.slice(0,22),rects:[...r.getClientRects()].map(x=>x)})).map(o=>{const x=o.rects[0];const si=Math.floor(((x.top-sheets[0].getBoundingClientRect().top)/z+0.5)/(sheets[1].getBoundingClientRect().top-sheets[0].getBoundingClientRect().top)*z);return {i:o.i,t:o.t,pg:si+1,pos:o.rects.map(x=>[Math.round((x.top-sheets[si].getBoundingClientRect().top)/z*.75*10)/10,Math.round(x.height/z*.75*10)/10])}});
return rows.filter(r=>r.pg>=159&&r.pg<=162);})()
