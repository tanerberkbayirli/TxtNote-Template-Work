(() => ['docx-3929','docx-4081','docx-4123','docx-4165','docx-4201','docx-4204','docx-4209'].map(id=>{
 const p=document.querySelector(`.thesis-page-flow p[data-txt-node-id="${id}"]`);
 if(!p)return{id,missing:true};
 const article=p.closest('.thesis-paper'),scale=article.getBoundingClientRect().width/article.offsetWidth;
 const pages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
 const boxes=n=>[...n.getClientRects()].map(r=>{const i=pages.findIndex(b=>r.top>=b.top&&r.top<b.bottom&&r.left>=b.left&&r.left<b.right);return{page:i+1,x:i>=0?(r.left-pages[i].left)/scale*.75:0,y:i>=0?(r.top-pages[i].top)/scale*.75:0,height:r.height/scale*.75,width:r.width/scale*.75}});
 const css=n=>{const s=getComputedStyle(n);return{font:s.font,family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,style:s.fontStyle,line:s.lineHeight,spacing:s.wordSpacing,padding:s.padding,margin:s.margin,align:s.verticalAlign,indent:s.textIndent}};
 return{id,rects:boxes(p),css:css(p),html:p.innerHTML.slice(0,5000),math:[...p.querySelectorAll('math,math *,.thesis-source-equation')].map(n=>({tag:n.tagName,rects:boxes(n),css:css(n)})),runs:[...p.querySelectorAll('span[data-txt-node-id]')].map(n=>({id:n.dataset.txtNodeId,css:css(n)})),fit:[...p.querySelectorAll('[data-thesis-word-fit]')].map(n=>({line:n.dataset.thesisWordFit,text:n.textContent,rects:boxes(n),spacing:getComputedStyle(n).wordSpacing}))};
}))()
