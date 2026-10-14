(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const r=t.rows[14];
const st=document.querySelector('.thesis-sheet').parentElement;
return {attrs:[...r.attributes].map(a=>a.name).join(','),minb:r.hasAttribute('data-thesis-row-min-break'),min:getComputedStyle(r).getPropertyValue('--thesis-source-row-min'),hasFn:document.body.innerHTML.length};})()
