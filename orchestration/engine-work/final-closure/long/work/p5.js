(()=>{
 const els=[...document.querySelectorAll('[data-native-object="drawing"]')].filter(e=>/yerleşim önizlemesi/.test(e.textContent));
 return {n:els.length,items:els.slice(0,12).map(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return {id:e.dataset.txtNodeId,t:e.textContent.slice(0,50),w:r.width,h:r.height,disp:cs.display,pos:cs.position,wcss:cs.width,hcss:cs.height,ov:cs.overflow,parent:e.parentElement.tagName+':'+(e.parentElement.dataset.docxStyle||''),pH:e.parentElement.getBoundingClientRect().height}})};
})()
