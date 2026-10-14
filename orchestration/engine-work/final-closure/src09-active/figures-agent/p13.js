()=>{const out=[];for(const s of document.querySelectorAll('style')){const t=s.textContent;let i=-1;while((i=t.indexOf('txn-docx-15966',i+1))>=0&&out.length<12)out.push(t.slice(Math.max(0,i-40),i+160).replace(/\n/g,' '));}
return out}
