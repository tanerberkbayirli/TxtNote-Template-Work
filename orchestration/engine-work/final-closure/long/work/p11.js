(()=>{
 const t=[...document.querySelectorAll(".thesis-body table")].find(t=>/^Yakın tedarikçi/.test(t.textContent.trim()));
 const z=0.7590;
 return [...t.rows].map((r,i)=>({i,h:+(r.getBoundingClientRect().height/z).toFixed(1),cells:[...r.cells].map(c=>{const p=c.querySelector('p');const cs=p&&getComputedStyle(p);const cr=c.getBoundingClientRect();return {t:c.textContent.slice(0,22),w:+(cr.width/z).toFixed(1),h:+(cr.height/z).toFixed(1),ph:p&&+(p.getBoundingClientRect().height/z).toFixed(1),lh:cs&&cs.lineHeight,fs:cs&&cs.fontSize,mt:cs&&cs.marginTop,mb:cs&&cs.marginBottom,np:c.querySelectorAll('p').length,pad:getComputedStyle(c).padding}})}));
})()
