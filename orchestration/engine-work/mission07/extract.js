(()=>{
 if(document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady!=='true'||document.querySelectorAll('.thesis-sheet').length<50)return null;
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right,words:[]};});
 const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){if(!n.parentElement.closest('.thesis-page-flow'))continue;const t=n.nodeValue;const re=/\S+/g;let m;const rg=document.createRange();
  while(m=re.exec(t)){rg.setStart(n,m.index);rg.setEnd(n,m.index+m[0].length);const r=rg.getClientRects()[0];if(!r)continue;const y=(r.top+r.bottom)/2+scrollY;const x=(r.left+r.right)/2;
   const si=sheets.findIndex(s=>y>=s.top&&y<s.bottom&&x>=s.left&&x<=s.right);if(si>=0)sheets[si].words.push([Math.round(r.top+scrollY-sheets[si].top),m[0]]);}}
 return sheets.map((s,i)=>({i:i+1,words:s.words}));
})()
