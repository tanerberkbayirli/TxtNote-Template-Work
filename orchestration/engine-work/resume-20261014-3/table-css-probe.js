(() => {
 const table='.txn-docx-9879',r=document.querySelector(`${table} .txn-docx-9150`),out=[];
 const read=rule=>{const p=r.closest('.thesis-paper'),scale=p.getBoundingClientRect().width/p.offsetWidth;const rect=r.getBoundingClientRect();const sheets=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());const i=sheets.findIndex(s=>rect.top>=s.top&&rect.top<s.bottom&&rect.left>=s.left&&rect.left<s.right);out.push({rule,page:i+1,y:(rect.top-sheets[i].top)/scale*.75})};
 read('baseline');
 for(const rule of [`${table} td::after{display:none!important}`,`${table} p{orphans:1!important;widows:1!important}`,`${table} tr{break-inside:avoid!important}`,`${table},${table} tbody{break-inside:auto!important}`,`${table} td p::after{display:none!important}`,`${table} tr{height:auto!important}`]){
  const s=document.createElement('style');s.textContent=rule;document.head.append(s);read(rule);s.remove();
 }
 return out;
})()
