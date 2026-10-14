(()=>{const t=[...document.querySelectorAll(".thesis-body table")].find(t=>/^Yakın tedarikçi/.test(t.textContent.trim()));const c=t.rows[2].cells[4];const p=c.querySelector('p');
 const ids=[p.dataset.txtNodeId,c.dataset.txtNodeId,t.rows[2].dataset.txtNodeId,t.dataset.txtNodeId];
 const out=[];
 for(const st of document.styleSheets){let rules;try{rules=st.cssRules}catch(e){continue}
  for(const r of rules){ const tx=r.cssText||''; if(ids.some(id=>tx.includes('"'+id+'"'))) out.push(tx.slice(0,400)); }}
 const r=document.createRange();r.selectNodeContents(p);
 return {out,rects:[...r.getClientRects()].map(x=>[Math.round(x.left),Math.round(x.top),Math.round(x.width),Math.round(x.height)]),p:p.getBoundingClientRect().toJSON(),tr:t.rows[2].getBoundingClientRect().toJSON()};
})()
