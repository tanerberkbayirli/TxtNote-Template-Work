(()=>{
 const p=[...document.querySelectorAll('.thesis-body p')].find(p=>/^JÜRİ ONAY/.test(p.textContent.trim())&&p.textContent.length<50);
 const id=p.dataset.txtNodeId;
 const out=[];
 for(const st of document.styleSheets){let rules;try{rules=st.cssRules}catch(e){continue}
  for(const r of rules){ if(r.cssText&&(r.cssText.includes('"'+id+'"')||r.cssText.includes('docx-style="T1"')||r.cssText.includes(".txn-"+id)))out.push(r.cssText.slice(0,500));}}
 const kids=[...p.querySelectorAll('span,a')].slice(0,12).map(s=>{const cs=getComputedStyle(s);return [s.dataset.txtNodeId,s.textContent.slice(0,20),cs.fontSize,cs.lineHeight,cs.display]});
 return {out,kids,fs:getComputedStyle(p).fontSize};
})()
