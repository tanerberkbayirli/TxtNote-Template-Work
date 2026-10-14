(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const r=t.rows[6];const c=r.cells[2];const rt=r.getBoundingClientRect().top;
const kids=[...c.querySelectorAll('p')];
return kids.slice(18).map(p=>{const b=p.getBoundingClientRect();const s=getComputedStyle(p);return [p.dataset.docxStyle,Math.round((b.top-rt)*.75*10)/10,Math.round(b.height*.75*10)/10,s.lineHeight,s.marginTop,s.marginBottom,p.parentElement.tagName, p.textContent.slice(0,10)]})})()
