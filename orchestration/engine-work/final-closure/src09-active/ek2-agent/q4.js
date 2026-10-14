(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const r=t.rows[6];const z=0.758;
const out=[...r.cells].map(c=>{const items=[...c.querySelectorAll('li,p')];return {cellH:Math.round(c.getBoundingClientRect().height/z*.75*10)/10,tops:items.slice(0,40).map(li=>{const b=li.getBoundingClientRect();return [li.tagName,Math.round((b.top-r.getBoundingClientRect().top)/z*.75*10)/10,Math.round(b.height/z*.75*10)/10, li.textContent.slice(0,14)]})}});
const cs=getComputedStyle(r.cells[2]);
return {out,pad:cs.padding,sheet:getComputedStyle(r.cells[2].querySelector('p')).lineHeight}})()
