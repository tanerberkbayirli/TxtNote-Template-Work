(()=>{const t=[...document.querySelectorAll(".thesis-body table")].find(t=>/^\s*CE Stratejileri/.test(t.textContent));
 const c=t.rows[2].cells[0];
 const out=[];for(const st of document.styleSheets){let rules;try{rules=st.cssRules}catch(e){continue}for(const r of rules){const tx=r.cssText||'';if(r.selectorText&&c.matches(r.selectorText)&&/display/.test(tx))out.push(tx.slice(0,300));}}
 return out;
})()
