(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const res=[];
 let cum=0;
 for(const a of document.querySelectorAll('.thesis-paper[data-thesis-layout="paged"]')){const n=+a.dataset.thesisPageCount;res.push([a.dataset.thesisSection,cum+1,cum+n,getComputedStyle(a).paddingBottom]);cum+=n;}
 return res.filter(r=>r[2]>=70&&r[1]<=135);
})()
