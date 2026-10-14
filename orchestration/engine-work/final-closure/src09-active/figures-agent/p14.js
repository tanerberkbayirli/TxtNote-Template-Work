()=>{const sh=[...document.querySelectorAll('.thesis-sheet')];const r=sh[96].getBoundingClientRect();const k=841.9/r.height;
const all=[...document.querySelectorAll('[data-native-object="drawing"]')].filter(d=>{const b=d.getBoundingClientRect();return b.top>=r.top-2&&b.bottom<=r.bottom+2&&b.width>0});
return all.slice(0,60).map(d=>{const b=d.getBoundingClientRect();const cs=getComputedStyle(d);const t=d.textContent.trim().slice(0,22);const p=d.querySelector('[data-docx-box-block]');const pc=p&&getComputedStyle(p);
return [d.dataset.txtNodeId,t,+((b.left-r.left)*k).toFixed(1),+((b.top-r.top)*k).toFixed(1),+(b.width*k).toFixed(1),+(b.height*k).toFixed(1),cs.zIndex,cs.overflow,pc&&pc.fontWeight,pc&&pc.color,pc&&pc.fontSize,cs.transform]})}
