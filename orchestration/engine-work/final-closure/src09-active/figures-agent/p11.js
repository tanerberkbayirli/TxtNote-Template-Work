()=>{const sh=[...document.querySelectorAll('.thesis-sheet')];const p=document.querySelector('.txn-docx-15966');
const flow=p.closest('.thesis-page-flow');const cs=getComputedStyle(flow);const fb=flow.getBoundingClientRect();
const k=841.9/sh[90].getBoundingClientRect().height;
return {flowCls:flow.className,flowTop:fb.top+scrollY,h:fb.height,colGap:cs.columnGap,colW:cs.columnWidth,cc:cs.columnCount,fh:cs.height,pad:cs.padding,mt:cs.marginTop,
sheets:[89,90,91,92].map(i=>{const b=sh[i].getBoundingClientRect();return [i+1,+(b.top+scrollY).toFixed(1),+b.height.toFixed(1),sh[i].parentElement.className.slice(0,40)]}),
ptop:p.getBoundingClientRect().top+scrollY, sheetsAll:sh.length}}
