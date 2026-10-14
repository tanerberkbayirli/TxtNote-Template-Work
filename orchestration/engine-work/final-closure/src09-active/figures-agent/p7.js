()=>{const sh=document.querySelectorAll('.thesis-sheet')[90];const r=sh.getBoundingClientRect();const k=841.9/r.height;
const img=document.querySelector('.txn-docx-15961');const p=img.closest('p')||img.parentElement;
const f=e=>{const b=e.getBoundingClientRect();return {top:+((b.top-r.top)*k).toFixed(1),bottom:+((b.bottom-r.top)*k).toFixed(1),h:+(b.height*k).toFixed(1),left:+((b.left-r.left)*k).toFixed(1),w:+(b.width*k).toFixed(1)}};
const cs=getComputedStyle(p),ci=getComputedStyle(img);
const cap=[...document.querySelectorAll('p')].find(e=>e.textContent.startsWith('Şekil 3.6'));
return {img:f(img),p:f(p),pcls:p.outerHTML.slice(0,200),ptag:p.tagName,pm:[cs.marginTop,cs.marginBottom,cs.paddingTop,cs.paddingBottom,cs.lineHeight,cs.display],img_style:[ci.display,ci.verticalAlign,ci.width,ci.height,ci.margin,ci.aspectRatio],cap:f(cap),capm:[getComputedStyle(cap).marginTop,getComputedStyle(cap).marginBottom]}}
