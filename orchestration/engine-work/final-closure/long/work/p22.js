(()=>{const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(s=>y>=s[0]&&y<s[1])+1;
 const e=[...document.querySelectorAll('.thesis-body span')].filter(e=>e.children.length===0&&/Tipik/.test(e.textContent)).pop();
 let b=e;while(b.tagName!=='P')b=b.parentElement;
 const out=[];let p=b;for(let i=0;i<10&&p;i++,p=p.previousElementSibling){const r=p.getBoundingClientRect();const cs=getComputedStyle(p);out.push({t:p.textContent.slice(0,25),top:Math.round(r.top+scrollY),h:Math.round(r.height),pg:pageOf(r.top+scrollY+1),pb:pageOf(r.bottom+scrollY-1),mt:cs.marginTop,mb:cs.marginBottom,br:cs.breakBefore+'/'+cs.breakAfter+'/'+cs.breakInside,nd:p.querySelectorAll('[data-native-object]').length,posabs:[...p.querySelectorAll('[data-native-object=drawing]')].filter(d=>getComputedStyle(d).position==='absolute').length,pstyle:p.dataset.docxStyle});}
 return out})()
