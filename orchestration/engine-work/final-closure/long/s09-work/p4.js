(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const sh=sheets[80];sh.scrollIntoView();const sr=sh.getBoundingClientRect();
 const K=851.9985/841.92;
 const find=t=>{const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())if(n.parentElement.closest('.thesis-page-flow')&&n.nodeValue.includes(t)){const r=document.createRange();r.selectNodeContents(n);const b=r.getBoundingClientRect();if(b.top>sr.top&&b.top<sr.bottom)return n.parentElement;}};
 const el=find('Yakla');const table=el.closest('table');
 const out=[];
 const rec=(e,d)=>{const b=e.getBoundingClientRect();const cs=getComputedStyle(e);out.push({d,tag:e.tagName,txt:(e.children.length===0||e.tagName==='P')?e.textContent.trim().slice(0,18):'',top:+((b.top-sr.top)/K).toFixed(1),bot:+((b.bottom-sr.top)/K).toFixed(1),h:+(b.height/K).toFixed(1),lh:cs.lineHeight,mt:cs.marginTop,mb:cs.marginBottom,pt:cs.paddingTop,pb:cs.paddingBottom,fs:cs.fontSize,minh:cs.minHeight,hh:cs.height});
  for(const c of e.children){if(['P','TABLE','TBODY','TR','TD','DIV'].includes(c.tagName))rec(c,d+1);}};
 rec(table,0);
 return out;
})()
