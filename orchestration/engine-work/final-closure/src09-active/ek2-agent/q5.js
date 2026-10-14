(()=>{
const t=[...document.querySelectorAll('.thesis-body table')].find(t=>/Chowdury ve Hossain/.test(t.textContent)&&t.rows.length==70);
const r=t.rows[6];const c=r.cells[0];const ps=c.querySelectorAll('p');
const f=(p)=>{const s=getComputedStyle(p);const a=getComputedStyle(p,'::after');return {lh:s.lineHeight,mt:s.marginTop,mb:s.marginBottom,pt:s.paddingTop,pb:s.paddingBottom,h:s.height,fs:s.fontSize,aft:a.content+' '+a.height+' '+a.marginBottom+' '+a.display, cls:p.className,attrs:[...p.attributes].map(a=>a.name+'='+a.value.slice(0,30)).join(' ')}};
return {first:f(ps[0]),last:f(ps[15]),mid:f(ps[4]),cellStyle:{va:getComputedStyle(c).verticalAlign,h:c.style.cssText,pad:getComputedStyle(c).padding},rowStyle:r.style.cssText,rowH:getComputedStyle(r).height, rowmin:getComputedStyle(r).getPropertyValue('--thesis-source-row-min'),
 listcell:getComputedStyle(r.cells[2].querySelector('li')).margin,liP:f(r.cells[2].querySelector('li p'))}})()
