(()=>{
 const doc=window.thesisTest.getDoc().researchData.thesis.document,byId=new Map();
 const walk=nodes=>{for(const n of nodes||[]){if(n.attributes&&Object.hasOwn(n.attributes,'hidden'))continue;if(n.type==='drawing'&&n.properties?.shape)byId.set(n.id,n.properties.shape);walk(n.children);}};doc.sections.forEach(s=>walk(s.nodes));
 const changes=[];
 for(const body of document.querySelectorAll('.thesis-page-flow .thesis-body')){
  const scale=body.getBoundingClientRect().width/body.offsetWidth;
  const previous=[];
  for(const p of body.querySelectorAll('p')){
   if(p.closest('table,[data-native-object="drawing"],[hidden]'))continue;
   const clone=p.cloneNode(true);clone.querySelectorAll('[data-native-object="drawing"],[hidden]').forEach(n=>n.remove());
   const own=[...p.querySelectorAll('[data-native-object="drawing"]')].filter(n=>byId.has(n.dataset.txtNodeId)&&!n.closest('[hidden]'));
   if(!clone.textContent.trim()&&previous.length){
    const r=p.getBoundingClientRect(),width=r.width/scale;
    const rects=previous.flatMap(element=>{const s=byId.get(element.dataset.txtNodeId),a=element.getBoundingClientRect(),d=s.distPt||[0,0,0,0];
     return s.kind==='anchor'&&['square','tight','through'].includes(s.wrap)&&a.bottom+d[2]*scale*4/3>r.top&&a.top<r.bottom? [{left:Math.max(0,(a.left-r.left)/scale-d[3]*4/3),right:Math.min(width,(a.right-r.left)/scale+d[1]*4/3),top:Math.max(0,(a.top-r.top)/scale-d[0]*4/3),bottom:(a.bottom-r.top)/scale+d[2]*4/3}]:[];
    }).filter(a=>a.right>a.left&&a.bottom>a.top);
    if(rects.length){
     const marker=document.createElement('span');marker.textContent=' ';marker.style.whiteSpace='pre';p.append(marker);
     const before=marker.getBoundingClientRect().top;
     const left=Math.min(...rects.map(x=>x.left)),right=width-Math.max(...rects.map(x=>x.right)),side=left>right?'right':'left';
     const edges=[...new Set([0,...rects.flatMap(a=>[a.top,a.bottom])])].sort((a,b)=>a-b),points=[[side==='left'?0:width,0]];
     for(let i=0;i<edges.length-1;i++){const a=edges[i],b=edges[i+1],active=rects.filter(r=>r.top<b&&r.bottom>a);const edge=side==='left'?Math.max(0,...active.map(x=>x.right)):Math.min(width,...active.map(x=>x.left));points.push([edge,a],[edge,b]);}
     const height=Math.max(...rects.map(x=>x.bottom));points.push([side==='left'?0:width,height]);
     const f=document.createElement('span');f.style.cssText=`display:block;float:${side};width:100%;height:${height}px;shape-outside:polygon(${points.map(p=>p.map(v=>v+'px').join(' ')).join(',')})`;p.prepend(f);
     const delta=(marker.getBoundingClientRect().top-before)/scale;
     f.remove();marker.remove();
     if(delta>.5){const m=parseFloat(getComputedStyle(p).marginTop);p.style.setProperty('margin-top',`${m+delta}px`,'important');changes.push({id:p.dataset.txtNodeId,deltaPt:delta*.75});}
    }
   }
   previous.push(...own);
  }
 }
 return changes;
})()
