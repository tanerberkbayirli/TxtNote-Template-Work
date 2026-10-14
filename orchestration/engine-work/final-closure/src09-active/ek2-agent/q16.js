(()=>{
const out=[];
for(const r of document.querySelectorAll('tr[data-thesis-row-min-break]')){
 const flow=r.closest('.thesis-page-flow');const cs=getComputedStyle(flow);
 out.push([r.textContent.slice(0,15),cs.columnHeight,cs.getPropertyValue('--thesis-col-lead'),cs.rowGap,cs.paddingTop,flow.getBoundingClientRect().top - flow.closest('.thesis-sheet')?.getBoundingClientRect().top]);
}
const sh=document.querySelector('.thesis-sheet');
return out.concat([[getComputedStyle(sh).height]]);})()
