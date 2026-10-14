(()=>{const sh=document.querySelector('.thesis-sheet');const sr=sh.getBoundingClientRect();
const t=[...document.querySelectorAll('.thesis-page-flow table')].find(t=>t.textContent.includes('#7'));
const wrap=t.closest('.academic-table-wrap');
const td=t.querySelector('td');const cs=getComputedStyle(td);
const rows=[...t.rows].slice(0,6).map(r=>({h:r.getBoundingClientRect().height,html:r.outerHTML.slice(0,600)}));
return {sheet:[sr.width,sr.height],zoom:getComputedStyle(sh).zoom,table:t.outerHTML.slice(0,1500),tw:t.getBoundingClientRect().width,wrapH:wrap?.outerHTML.slice(0,300),td:{pad:cs.padding,fs:cs.fontSize,lh:cs.lineHeight,ff:cs.fontFamily},p:td.querySelector('p')&&(()=>{const s=getComputedStyle(td.querySelector('p'));return {m:s.margin,lh:s.lineHeight,fs:s.fontSize}})(),rows};})()
