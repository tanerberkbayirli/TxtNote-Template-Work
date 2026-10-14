(()=>{
 const ps=[...document.querySelectorAll('.thesis-body p')].filter(p=>/^(JÜRİ ONAY|ÖZ\b|ABSTRACT|3\. BÖLÜM)/.test(p.textContent.trim())&&p.textContent.length<200).slice(0,6);
 return ps.map(p=>{const s=getComputedStyle(p);const r=p.getBoundingClientRect();return {t:p.textContent.slice(0,60),style:p.dataset.docxStyle,cls:p.className,h:r.height,lh:s.lineHeight,mt:s.marginTop,mb:s.marginBottom,pt:s.paddingTop,fs:s.fontSize,ff:s.fontFamily,rects:[...p.getClientRects()].length,html:p.outerHTML.slice(0,400)}});
})()
