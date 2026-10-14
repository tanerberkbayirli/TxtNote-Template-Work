()=>{const sheets=[...document.querySelectorAll('.thesis-sheet')];
const rects=sheets.map(s=>s.getBoundingClientRect());
return sheets.slice(86,95).map((s,k)=>{const r=rects[86+k];const t=[];
 return {i:87+k,top:Math.round(r.top+scrollY),h:Math.round(r.height),w:Math.round(r.width),left:Math.round(r.left)}})}
