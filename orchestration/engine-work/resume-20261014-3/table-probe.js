(() => {
 const t=document.querySelector('.thesis-page-flow table[data-txt-node-id="docx-9879"]');
 const paper=t.closest('.thesis-paper'),scale=paper.getBoundingClientRect().width/paper.offsetWidth;
 const pages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
 return [...t.rows].map(row=>({id:row.dataset.txtNodeId,text:row.textContent.slice(0,90),rects:[...row.getClientRects()].map(r=>{const i=pages.findIndex(p=>r.top>=p.top&&r.top<p.bottom&&r.left>=p.left&&r.left<p.right);return{page:i+1,y:i>=0?(r.top-pages[i].top)/scale*.75:0,height:r.height/scale*.75}}),cells:[...row.cells].slice(0,2).map(c=>({id:c.dataset.txtNodeId,padding:getComputedStyle(c).padding,paragraphs:[...c.querySelectorAll('p')].map(p=>{const s=getComputedStyle(p);return{id:p.dataset.txtNodeId,text:p.textContent,font:s.fontFamily,size:s.fontSize,line:s.lineHeight,margin:s.margin,padding:s.padding}})}))})).filter(r=>r.rects.some(b=>b.page>=84&&b.page<=86));
})()
