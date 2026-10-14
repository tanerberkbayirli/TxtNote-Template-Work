(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const sh=sheets[118];sh.scrollIntoView();
 const sr=sh.getBoundingClientRect();
 const pts=[[420,765],[420,750],[420,700]];
 const out=[];
 for(const [x,y] of pts){
  const stack=document.elementsFromPoint(sr.left+x,sr.top+y);
  const hitEl=stack.find(e=>e.closest('.thesis-page-flow')&&!e.matches('.thesis-sheet'))||stack[0];
  const chain=[];let e=hitEl;
  while(e&&e!==document.body){const cs=getComputedStyle(e);const b=e.getBoundingClientRect();chain.push({tag:e.tagName,cls:(e.className||'').toString().slice(0,40),top:+(b.top-sr.top).toFixed(1),bottom:+(b.bottom-sr.top).toFixed(1),h:+b.height.toFixed(1),cols:cs.columnCount+'/'+cs.columnWidth,fill:cs.columnFill,ov:cs.overflow,disp:cs.display,height:cs.height,pad:cs.paddingBottom,bi:cs.breakInside,attrs:[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value.slice(0,20)).join(' ')});if(chain.length>12)break;e=e.parentElement;}
  out.push({x,y,chain});
 }
 return {sheetH:sr.height,sheetW:sr.width,out};
})()
