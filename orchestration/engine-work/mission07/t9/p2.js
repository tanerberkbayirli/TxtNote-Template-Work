(()=>{const ts=[...document.querySelectorAll('.thesis-page-flow table')].filter(t=>t.textContent.includes('#9'));const t=ts[ts.length-1];
let top=t.closest('.academic-table-wrap')||t;const out=[];let e=top.previousElementSibling;for(let k=0;k<4&&e;k++,e=e.previousElementSibling){const r=e.getBoundingClientRect();const s=getComputedStyle(e);out.push({tag:e.tagName,h:r.height/1.25*0.75,mt:s.marginTop,mb:s.marginBottom,fs:s.fontSize,lh:s.lineHeight,html:e.outerHTML.slice(0,300)});}
const wrap=t.closest('.academic-table-wrap');return {wrap:wrap&&getComputedStyle(wrap).margin,out};})()
