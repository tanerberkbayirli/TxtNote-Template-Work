(() => ['docx-3929','docx-4209'].map(id=>{
 const p=document.querySelector(`.thesis-page-flow p[data-txt-node-id="${id}"]`);
 if(!p)return{id,missing:true};
 const article=p.closest('.thesis-paper'),scale=article.getBoundingClientRect().width/article.offsetWidth;
 const pages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
 const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),range=document.createRange(),lines=[];
 for(let n=walker.nextNode();n;n=walker.nextNode())for(const m of n.nodeValue.matchAll(/\S+/g)){
  range.setStart(n,m.index);range.setEnd(n,m.index+m[0].length);const r=range.getBoundingClientRect();
  const page=pages.findIndex(b=>r.top>=b.top&&r.top<b.bottom&&r.left>=b.left&&r.left<b.right);
  if(page<0)continue;
  const x=(r.left-pages[page].left)/scale*.75,y=(r.top-pages[page].top)/scale*.75;
  let line=lines.find(l=>l.page===page+1&&Math.abs(l.y-y)<2);
  if(!line){line={page:page+1,x,y,text:''};lines.push(line)}line.text+=(line.text?' ':'')+m[0];
 }
 const style=n=>{if(!n)return null;const s=getComputedStyle(n);return{tag:n.tagName,font:s.fontFamily,size:s.fontSize,line:s.lineHeight,indent:s.textIndent,left:s.marginLeft,padding:s.paddingLeft,width:s.width}};
 return{id,lines,paragraph:style(p),item:style(p.closest('li')),list:style(p.closest('ol,ul'))};
}))()
