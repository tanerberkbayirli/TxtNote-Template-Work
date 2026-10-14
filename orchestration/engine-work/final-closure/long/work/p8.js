(()=>{
 const p=document.querySelector('[data-txt-node-id="docx-14782"]');
 const rows=[];
 const walk=(e,d)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);rows.push({d,tag:e.tagName,id:e.dataset.txtNodeId,t:e.children.length?'':e.textContent.slice(0,25),h:Math.round(r.height),w:Math.round(r.width),disp:cs.display,pos:cs.position,fl:cs.float,lh:cs.lineHeight,hc:cs.height});if(d<4)[...e.children].slice(0,12).forEach(c=>walk(c,d+1));};
 walk(p,0);
 return rows;
})()
