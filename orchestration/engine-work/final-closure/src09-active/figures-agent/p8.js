()=>{const out=[];for(const s of document.querySelectorAll('style')){const t=s.textContent;for(const id of ['docx-15966','docx-15961','docx-15965','docx-15964']){let i=-1;while((i=t.indexOf('txn-'+id+'.',i+1))>=0&&out.length<12)out.push(t.slice(Math.max(0,i-50),i+300));}}
const img=document.querySelector('.txn-docx-15961');const at={};for(const a of img.attributes)if(a.name!=='src')at[a.name]=a.value;
return {out,at,pHtml:img.closest('p').outerHTML.replace(/src="[^"]*"/,'src=…').slice(0,900)}}
