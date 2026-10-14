(()=>{
 const doc=window.thesisTest.getDoc().researchData.thesis.document,byId=new Map();
 const walk=nodes=>{for(const n of nodes||[]){if(n.attributes&&Object.hasOwn(n.attributes,'hidden'))continue;if(n.type==='drawing'&&n.properties?.shape)byId.set(n.id,n.properties.shape);walk(n.children);}};doc.sections.forEach(s=>walk(s.nodes));
 const changes=[];
 for(const body of document.querySelectorAll('.thesis-page-flow .thesis-body')){
  const scale=body.getBoundingClientRect().width/body.offsetWidth,previous=[];
  for(const p of body.querySelectorAll('p')){
   if(p.closest('table,[data-native-object="drawing"],[hidden]'))continue;
   const clone=p.cloneNode(true);clone.querySelectorAll('[data-native-object="drawing"],[hidden]').forEach(n=>n.remove());
   const own=[...p.querySelectorAll('[data-native-object="drawing"]')].filter(n=>byId.has(n.dataset.txtNodeId)&&!n.closest('[hidden]'));
   if(!clone.textContent.trim()){
    const r=p.getBoundingClientRect(),width=r.width/scale,line=parseFloat(getComputedStyle(p).lineHeight);
    const rects=[...previous,...own].flatMap(el=>{const s=byId.get(el.dataset.txtNodeId),a=el.getBoundingClientRect(),d=s.distPt||[0,0,0,0];return s.kind==='anchor'&&['square','tight','through'].includes(s.wrap)&&getComputedStyle(el).position==='absolute'&&a.bottom+d[2]*scale*4/3>r.top? [{left:Math.max(0,(a.left-r.left)/scale-d[3]*4/3),right:Math.min(width,(a.right-r.left)/scale+d[1]*4/3),top:(a.top-r.top)/scale-d[0]*4/3,bottom:(a.bottom-r.top)/scale+d[2]*4/3}]:[];}).filter(a=>a.right>a.left);
    let y=0;
    for(let n=0;n<=rects.length;n++){
     const active=rects.filter(r=>r.bottom>y+.01&&r.top<y+line-.01).sort((a,b)=>a.left-b.left);
     let edge=0,room=0;for(const a of active){room=Math.max(room,a.left-edge);edge=Math.max(edge,a.right);}room=Math.max(room,width-edge);
     if(room>=32||!active.length)break;
     y=Math.min(...active.map(r=>r.bottom));
    }
    if(y>.5&&y<line*20){p.style.setProperty('padding-top',y+'px','important');changes.push({id:p.dataset.txtNodeId,deltaPt:y*.75});}
   }
   previous.push(...own);
  }
 }
 return changes;
})()
