(() => {
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>s.getBoundingClientRect());
 const section=document.querySelector('.thesis-paper[data-thesis-section="docx-section-23"]');
 return [...(section?.querySelectorAll('.thesis-body > p, .thesis-body .rich-text-body > p') || [])].slice(-8).map(p=>{
  const r=p.getBoundingClientRect(),s=getComputedStyle(p);
  const page=sheets.findIndex(b=>r.height>0&&r.top>=b.top-.5&&r.top<b.bottom&&r.left>=b.left&&r.left<b.right);
  return {id:p.dataset.txtNodeId,text:p.textContent.slice(0,35),page:page+1,topPt:page>=0?(r.top-sheets[page].top)*.75:null,heightPt:r.height*.75,line:s.lineHeight,before:s.marginTop,after:s.marginBottom,padding:s.padding,display:s.display};
 });
})()
