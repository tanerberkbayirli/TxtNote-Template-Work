(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(s=>y>=s[0]&&y<s[1])+1;
 const el=document.querySelector('[data-txt-node-id="docx-15691"]');
 let blk=el; while(blk.parentElement&&!/thesis-body|rich-text-body/.test(blk.parentElement.className))blk=blk.parentElement;
 const out=[];
 let p=blk; for(let i=0;i<3&&p.previousElementSibling;i++)p=p.previousElementSibling;
 for(let i=0;i<8&&p;i++,p=p.nextElementSibling){const r=p.getBoundingClientRect();const cs=getComputedStyle(p);out.push({tag:p.tagName,id:p.dataset.txtNodeId,t:p.textContent.slice(0,40),top:Math.round(r.top+scrollY),h:Math.round(r.height),page:pageOf(r.top+scrollY+1),pageBottom:pageOf(r.bottom+scrollY-1),mt:cs.marginTop,mb:cs.marginBottom,bb:cs.breakBefore+'/'+cs.breakAfter+'/'+cs.breakInside,disp:cs.display});}
 const r=el.getBoundingClientRect();
 return {sheets:sheets.slice(84,91).map(s=>s.map(Math.round)),out,el:{top:r.top+scrollY,h:r.height,w:r.width}};
})()
