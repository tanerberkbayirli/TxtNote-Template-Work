(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const sh=document.querySelector('.thesis-sheet');const z=sh.getBoundingClientRect().width/sh.offsetWidth;const f=v=>Math.round(v/z*.75*100)/100;
const c=t.rows[6].cells[2];const ct=c.getBoundingClientRect().top;
const kids=[...c.children].map(k=>{const b=k.getBoundingClientRect();const s=getComputedStyle(k);return [k.tagName,f(b.top-ct),f(b.height),s.marginTop,s.marginBottom,s.display, k.children.length]});
return kids.map(a=>a.join(' ')).join('\n')+'\n'+getComputedStyle(c).display+' '+c.firstElementChild.outerHTML.slice(0,300);})()
