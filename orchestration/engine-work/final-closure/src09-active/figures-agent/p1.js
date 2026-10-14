()=>{
const sheets=[...document.querySelectorAll('.thesis-sheet')];
const s=sheets[88],s2=sheets[89];
const out=[];
const flow=document.querySelector('.thesis-page-flow');
const ids=['docx-15503','docx-15504','docx-15505'];
const info=ids.map(id=>{const e=document.querySelector(`[data-txt-node-id="${id}"]`);if(!e)return {id,missing:true};const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {id,top:r.top+scrollY,h:r.height,html:e.outerHTML.slice(0,300),mt:cs.marginTop,mb:cs.marginBottom,lh:cs.lineHeight,pbb:cs.breakBefore,pba:cs.breakAfter}});
return {n:sheets.length,s89:sheets[88].getBoundingClientRect().top+scrollY,s90:sheets[89].getBoundingClientRect().top+scrollY,s91:sheets[90].getBoundingClientRect().top+scrollY,info,sheetCls:sheets.slice(86,93).map(s=>s.className+'|'+s.getAttribute('style'))};
}
