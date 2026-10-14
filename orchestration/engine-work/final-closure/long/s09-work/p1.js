(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const find=t=>{const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(n.parentElement.closest('.thesis-page-flow')&&n.nodeValue.includes(t))return n.parentElement;};
 const el=find('Shevchenko');
 let p=el.closest('p')||el;
 const flowRoot=p.parentElement;
 const sib=[...flowRoot.children];let i=sib.indexOf(p);
 const sr=sheets[47].getBoundingClientRect();
 const rows=[];
 for(let k=Math.max(0,i-22);k<Math.min(sib.length,i+8);k++){const b=sib[k];const r=b.getBoundingClientRect();const cs=getComputedStyle(b);
  rows.push({k:k-i,tag:b.tagName,txt:b.textContent.slice(0,30),top:+(r.top-sr.top).toFixed(2),h:+r.height.toFixed(2),lh:cs.lineHeight,fs:cs.fontSize,mt:cs.marginTop,mb:cs.marginBottom,pb:cs.paddingBottom,pos:cs.position,fl:cs.float,has:b.querySelectorAll('img,svg,canvas').length,cls:(b.className||'').toString().slice(0,50),attrs:[...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value.slice(0,25)).join(' ')});}
 return {parent:flowRoot.tagName+'.'+flowRoot.className,rows};
})()
