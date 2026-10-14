(() => {
 const allPages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
 const data=[];
 for(const id of ['docx-3929','docx-6713']) {
  const p=document.querySelector(`.thesis-page-flow p[data-txt-node-id="${id}"]`);if(!p){data.push({id,missing:true});continue}
  const paper=p.closest('.thesis-paper'),scale=paper.getBoundingClientRect().width/paper.offsetWidth;
  const flow=p.closest('.thesis-page-flow');const fs=getComputedStyle(flow),ps=getComputedStyle(p),range=document.createRange(),w=document.createTreeWalker(p,4),lines=[];
  for(let n=w.nextNode();n;n=w.nextNode())for(const m of n.data.matchAll(/\S+/g)){
   range.setStart(n,m.index);range.setEnd(n,m.index+m[0].length);const r=range.getBoundingClientRect();const page=allPages.findIndex(b=>r.top>=b.top&&r.top<b.bottom&&r.left>=b.left&&r.left<b.right);if(page<0)continue;
   const y=(r.top-allPages[page].top)/scale*.75,bottom=(r.bottom-allPages[page].top)/scale*.75;let l=lines.find(l=>l.page===page+1&&Math.abs(l.y-y)<2);if(!l){l={page:page+1,y,bottom,text:''};lines.push(l)}l.text+=(l.text?' ':'')+m[0];
  }
  data.push({id,lines,paragraph:{lineHeight:ps.lineHeight,font:ps.fontFamily,fontSize:ps.fontSize,padding:ps.padding,margin:ps.margin,widows:ps.widows,orphans:ps.orphans,decoration:ps.boxDecorationBreak},flow:{height:fs.height,columnHeight:fs.columnHeight,lead:fs.getPropertyValue('--thesis-col-lead'),gap:fs.rowGap},paper:paper.dataset,group:window.thesisTest.getModel?.()});
 }
 return data;
})()
