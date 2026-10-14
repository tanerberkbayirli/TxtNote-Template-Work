()=>{const rects=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
const out=rects.map(()=>[]);
const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){if(!n.parentElement.closest('.thesis-page-flow'))continue;const rg=document.createRange();rg.selectNodeContents(n);const r=rg.getClientRects()[0];if(!r||!n.nodeValue.trim())continue;const y=(r.top+r.bottom)/2,x=(r.left+r.right)/2;const si=rects.findIndex(s=>y>=s.top&&y<s.bottom&&x>=s.left&&x<=s.right);if(si>=0)out[si].push(n.nodeValue.trim().slice(0,12));}
return out.slice(86,95).map((a,k)=>(87+k)+': '+a.length+' '+a.slice(0,2).join('|'));}
