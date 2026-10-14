(async()=>{
 const {fitWordLines}=await import('/engine/wordLineFit.js');
 const p=document.querySelector('p[data-txt-node-id="docx-3929"]'),ctx=document.createElement('canvas').getContext('2d');ctx.fontKerning='normal';
 const entries=[];let text='';const walker=document.createTreeWalker(p,4);
 for(let n=walker.nextNode();n;n=walker.nextNode()){const s=getComputedStyle(n.parentElement);entries.push({start:text.length,end:text.length+n.length,font:`${s.fontStyle} ${s.fontWeight} 1000px ${s.fontFamily}`,size:parseFloat(s.fontSize)});text+=n.data;}
 const advance=(a,b)=>entries.reduce((sum,e)=>{const start=Math.max(a,e.start),end=Math.min(b,e.end);if(start>=end)return sum;ctx.font=e.font;return sum+ctx.measureText(text.slice(start,end)).width*e.size/1000},0);
 const m=[...text.matchAll(/\S+/g)],words=m.map((v,i)=>({start:v.index,end:v.index+v[0].length,width:advance(v.index,v.index+v[0].length),space:i?advance(m[i-1].index+m[i-1][0].length,v.index):0}));
 const s=getComputedStyle(p),lines=fitWordLines(words,parseFloat(s.width),parseFloat(s.textIndent));
 return{width:s.width,indent:s.textIndent,words:words.slice(0,16).map(w=>({...w,text:text.slice(w.start,w.end)})),lines:lines.map(l=>({...l,text:text.slice(words[l.start].start,words[l.end-1].end)}))};
})()


