()=>{const sh=document.querySelectorAll('.thesis-sheet')[90];const r=sh.getBoundingClientRect();
const els=[...document.querySelectorAll('[data-txt-node-id="docx-20653"],svg,canvas,img')].filter(e=>{const b=e.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom+5&&b.height>50});
return els.map(e=>({tag:e.tagName,cls:String(e.className&&e.className.baseVal||e.className).slice(0,60),h:Math.round(e.getBoundingClientRect().height),outer:e.outerHTML.slice(0,500),texts:e.querySelectorAll&&e.querySelectorAll('text').length}))}
