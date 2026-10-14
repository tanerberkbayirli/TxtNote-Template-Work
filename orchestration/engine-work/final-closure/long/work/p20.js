(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(s=>y>=s[0]&&y<s[1])+1;
 const caps=[...document.querySelectorAll('.thesis-body p')].filter(p=>/^\s*Şekil\s*4\s*\.\s*2/.test(p.textContent)&&p.textContent.length<120);
 const cap=caps.find(p=>pageOf(p.getBoundingClientRect().top+scrollY+1)>60);
 const out=[];let b=cap;
 for(let i=0;i<7&&b;i++,b=b.previousElementSibling){const r=b.getBoundingClientRect();const cs=getComputedStyle(b);out.push({tag:b.tagName,t:b.textContent.slice(0,30),top:Math.round(r.top+scrollY),h:Math.round(r.height),page:pageOf(r.top+scrollY+1),pb:pageOf(r.bottom+scrollY-1),mt:cs.marginTop,draw:b.querySelectorAll('[data-native-object=drawing]').length,anch:[...b.querySelectorAll('[data-native-object=drawing]')].slice(0,3).map(d=>{const c=getComputedStyle(d);return [c.position,c.width,c.height,c.top,c.left,c.float].join(' ')})});}
 return out;
})()
