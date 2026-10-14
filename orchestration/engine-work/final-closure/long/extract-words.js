(()=>{
 // Words of every physical page, as orchestration/engine-work/mission07/extract.js, with one difference: a word that the editor splits over
 // several text nodes ("y" + "ö" + "netimi": a font-fallback span, a no-break run boundary) is ONE word again. The pieces are
 // joined only when they touch: same line (top within 4 px), and the next piece starts within 2 px of where the previous ended,
 // with no whitespace on either side of the node boundary. Page, order and the y of the first piece are unchanged.
 if(document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady!=='true')return null;
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right,words:[]};});
 const walker=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let node;
 let open=null; // last token whose node ended without whitespace: {entry, right, top}
 const range=document.createRange();
 while(node=walker.nextNode()){
  if(!node.parentElement.closest('.thesis-page-flow'))continue;
  const text=node.nodeValue,pattern=/\S+/g;let match,first=true;
  while(match=pattern.exec(text)){
   range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
   const rect=range.getClientRects()[0];if(!rect)continue;
   const y=(rect.top+rect.bottom)/2+scrollY,x=(rect.left+rect.right)/2;
   const si=sheets.findIndex(s=>y>=s.top&&y<s.bottom&&x>=s.left&&x<=s.right);
   const touches=first&&match.index===0&&open&&Math.abs(rect.top-open.top)<4&&Math.abs(rect.left-open.right)<2;
   if(touches){open.entry[1]+=match[0];open.right=rect.right;}
   else if(si>=0){const entry=[Math.round(rect.top+scrollY-sheets[si].top),match[0]];sheets[si].words.push(entry);open={entry,right:rect.right,top:rect.top};}
   else open=null;
   first=false;
   if(match.index+match[0].length<text.length)open=null;
  }
  if(!/\S$/.test(text))open=null;
 }
 return sheets.map((s,i)=>({i:i+1,words:s.words}));
})()
