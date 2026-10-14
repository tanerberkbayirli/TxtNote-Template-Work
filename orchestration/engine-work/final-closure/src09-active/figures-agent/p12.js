()=>{const p=document.querySelector('.txn-docx-15966');const out=[];let e=p;while(e&&!e.classList.contains('thesis-page-flow')){const c=getComputedStyle(e);out.push([e.tagName,e.className.slice(0,25),c.position,c.top,c.transform,c.marginTop,c.zoom,e.getBoundingClientRect().top+scrollY]);e=e.parentElement}
const c=getComputedStyle(e);out.push(['flow',c.position,c.transform,c.zoom,c.columnFill,c.height]);
const pp=p.previousElementSibling;const pc=getComputedStyle(pp);
return {out,prev:[pp.className,pc.marginBottom,pc.paddingBottom,pc.height,pp.getBoundingClientRect().top+scrollY,pp.getBoundingClientRect().bottom+scrollY],afterBefore:getComputedStyle(pp,'::after').marginBottom}}
