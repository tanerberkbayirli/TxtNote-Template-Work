(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sh=document.querySelector('.thesis-sheet');const z=sh.getBoundingClientRect().width/sh.offsetWidth;
const r=t.rows[6];const rt=r.getBoundingClientRect().top;const f=v=>Math.round(v/z*.75*100)/100;
return {rowH:f(r.getBoundingClientRect().height),cells:[...r.cells].map(c=>{const ps=[...c.querySelectorAll('p')].filter(p=>getComputedStyle(p).display!=='none');const l=ps.at(-1),b=l.getBoundingClientRect();const s=getComputedStyle(l);
 return {n:ps.length,firstTop:f(ps[0].getBoundingClientRect().top-rt),lastBottom:f(b.bottom-rt),lastMB:s.marginBottom,lastH:f(b.height),va:getComputedStyle(c).verticalAlign,cellH:f(c.getBoundingClientRect().height),pad:getComputedStyle(c).paddingTop+'/'+getComputedStyle(c).paddingBottom,after:getComputedStyle(l,'::after').height+' '+getComputedStyle(l,'::after').marginBottom}})}})()
