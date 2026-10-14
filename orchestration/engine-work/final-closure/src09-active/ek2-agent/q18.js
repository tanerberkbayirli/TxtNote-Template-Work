(()=>{ return [...document.querySelectorAll('[data-thesis-row-tail]')].map(s=>s.style.height+' '+s.closest('tr').textContent.slice(0,20)).join('\n')})()
