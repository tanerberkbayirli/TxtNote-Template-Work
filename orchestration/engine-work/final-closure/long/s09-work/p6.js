(()=>{
 const root=document.querySelector('[aria-label="Belge sayfaları"]');
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const rows=[];
 while(n=w.nextNode()){if(!n.parentElement.closest('.thesis-page-flow'))continue;if(/^\s*0\.345\s*$/.test(n.nodeValue)){rows.push(n.parentElement.closest('tr'));}}
 return rows.map(tr=>({cells:[...tr.cells].map(td=>({np:td.querySelectorAll('p').length,txt:td.textContent.trim().slice(0,12),afterH:[...td.querySelectorAll('p')].map(p=>getComputedStyle(p,'::after').height+'/'+getComputedStyle(p,'::after').marginBottom).join(','),tdAfter:getComputedStyle(td,'::after').height})),prevRowTxt:tr.previousElementSibling&&tr.previousElementSibling.textContent.slice(0,20)}));
})()
