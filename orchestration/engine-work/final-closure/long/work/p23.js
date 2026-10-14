(()=>{const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(s=>y>=s[0]&&y<s[1])+1;
 const body=document.querySelector('[data-thesis-flow-section="docx-section-23"] .thesis-body');
 const kids=[...body.querySelector(".rich-text-body").children].slice(-5);
 return kids.map(p=>{const r=p.getBoundingClientRect();const cs=getComputedStyle(p);return {t:p.textContent.slice(-30),top:Math.round(r.top+scrollY),h:Math.round(r.height),pg:pageOf(r.top+scrollY+1),pb:pageOf(r.bottom+scrollY-1),mt:cs.marginTop,mb:cs.marginBottom,pt:cs.paddingTop,br:cs.breakBefore+'/'+cs.breakAfter,nd:p.querySelectorAll('[data-native-object]').length,html:p.outerHTML.slice(0,150)}})})()
