(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 return sheets.slice(28,35).map(s=>({cls:s.className,data:{...s.dataset},attrs:[...s.attributes].map(a=>a.name+'='+a.value.slice(0,40)),text:s.textContent.slice(0,40)}));
})()
