(()=>{
 const p=[...document.querySelectorAll('.thesis-body p[data-docx-style="T1"]')][3];
 const rows=[];
 const walk=(e,d)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);rows.push({d,tag:e.tagName,t:e.children.length?'':e.textContent.slice(0,20),top:+r.top.toFixed(2),h:+r.height.toFixed(2),fs:cs.fontSize,lh:cs.lineHeight,ff:cs.fontFamily.slice(0,25),disp:cs.display,va:cs.verticalAlign});[...e.children].forEach(c=>walk(c,d+1));};
 walk(p,0);
 return {html:p.outerHTML.slice(0,1500),rows};
})()
