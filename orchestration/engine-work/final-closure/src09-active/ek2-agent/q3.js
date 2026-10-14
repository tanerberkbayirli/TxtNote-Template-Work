(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
return [7,11].map(i=>{const r=t.rows[i];return {html:r.outerHTML.slice(0,1800),cells:[...r.cells].map(c=>({w:Math.round(c.getBoundingClientRect().width),h:Math.round(c.getBoundingClientRect().height),text:c.textContent.slice(0,40)}))}});})()
