(()=>{
 const z=0.7590;
 const out=[];
 for(const key of ['Faaliyet Yalın Gelişimin','Yakın tedarikçi']){
 const ts=[...document.querySelectorAll('.thesis-body table')].filter(t=>t.textContent.trim().startsWith(key.slice(0,10)));
 for(const t of ts){out.push({key,rows:[...t.rows].map(r=>+(r.getBoundingClientRect().height/z*0.75).toFixed(1)),wr:t.querySelectorAll('txt-table-cell-content').length});}}
 return out;
})()
