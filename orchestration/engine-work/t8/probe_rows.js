(()=>{const ts=[...document.querySelectorAll('.thesis-page-flow table')];
 const out=ts.map(t=>({n:t.rows.length,id:t.dataset.txtNodeId,rows:[...t.rows].map(r=>{const b=r.getBoundingClientRect();const c=r.cells[0];return [Math.round(b.height*75)/100,(r.textContent||'').trim().length]})}));
 return out.filter(o=>o.n>20);})()
