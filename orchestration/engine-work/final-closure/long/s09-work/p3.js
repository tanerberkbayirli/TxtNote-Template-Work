(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const sh=sheets[80];sh.scrollIntoView();const sr=sh.getBoundingClientRect();
 const stack=document.elementsFromPoint(sr.left+330,sr.top+768);
 const p=stack.map(e=>e.closest('p')).find(Boolean);
 const cs=getComputedStyle(p),as=getComputedStyle(p,'::after');
 const id=p.dataset.txtNodeId;const rules=[];
 for(const s of document.styleSheets){let rs;try{rs=s.cssRules}catch(e){continue}for(const r of rs){if(r.cssText&&r.cssText.includes('"'+id+'"')||r.cssText&&r.cssText.includes('.txn-'+id))rules.push(r.cssText.slice(0,330));}}
 const r=p.getBoundingClientRect();
 return {id,txt:p.textContent.slice(0,30),top:r.top-sr.top,bottom:r.bottom-sr.top,pad:cs.paddingBottom,lh:cs.lineHeight,after:{h:as.height,mb:as.marginBottom},rules,style:p.dataset.docxStyle,td:!!p.closest('td'),li:!!p.closest('li')};
})()
