window.__slow=[];
const w=(proto,name)=>{const o=proto[name];proto[name]=function(...a){const t=performance.now();const r=o.apply(this,a);const d=performance.now()-t;if(d>150)window.__slow.push([name,Math.round(d),Math.round(t),(new Error().stack.split('\n')[2]||'').trim().slice(-90)]);return r;};};
w(Element.prototype,'getBoundingClientRect');w(Range.prototype,'getClientRects');w(Window.prototype,'getComputedStyle');w(Element.prototype,'querySelectorAll');
