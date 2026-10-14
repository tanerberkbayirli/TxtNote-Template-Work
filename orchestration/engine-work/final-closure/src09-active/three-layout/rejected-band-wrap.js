/** Full-column exclusion bands of overlapping anchored shapes. Coordinates and
 * distances use the caller's units. Narrow side corridors cannot hold a word. */
export function blockedShapeBottom(rectangles, left, right, top, lineHeight, minimumRoom) {
  const active = rectangles.filter(r => r.bottom > top && r.top < top + lineHeight && r.right > left && r.left < right)
    .sort((a,b) => a.left-b.left);
  let edge=left, room=0;
  for(const r of active){room=Math.max(room,r.left-edge);edge=Math.max(edge,r.right);}
  room=Math.max(room,right-edge);
  return active.length && room < minimumRoom ? Math.max(...active.map(r=>r.bottom)) : top;
}

/** Empty anchor marks stay at their source positions. Only following text is
 * moved below a band which leaves no usable corridor across the text column.
 * The rules live in a presentation stylesheet and never enter saved HTML. */
export function layoutImportedShapeWrap(root, nativeDocument) {
  let sheet=root?.querySelector('style[data-thesis-shape-wrap]');
  if(!root) return '';
  if(nativeDocument?.source?.format!=='docx'){sheet?.remove();return '';}
  // Always measure the source flow, not the displacement from the previous pass.
  if(sheet) sheet.textContent='';
  const shapes=new Map();
  const walk=nodes=>{for(const n of nodes||[]){if(n.attributes&&Object.hasOwn(n.attributes,'hidden'))continue;if(n.type==='drawing'&&n.properties?.shape)shapes.set(n.id,n.properties.shape);walk(n.children);}};
  nativeDocument.sections.forEach(s=>walk(s.nodes));
  const rules=[];
  for(const body of root.querySelectorAll('.thesis-page-flow .thesis-body')){
    const scale=body.offsetWidth?body.getBoundingClientRect().width/body.offsetWidth:1;
    if(!(scale>0))continue;
    const rects=[];
    for(const element of body.querySelectorAll('[data-native-object="drawing"][data-txt-node-id]')){
      const shape=shapes.get(element.dataset.txtNodeId);
      if(shape?.kind!=='anchor'||!['square','tight','through'].includes(shape.wrap)||element.closest('[hidden]'))continue;
      const r=element.getBoundingClientRect(),d=(shape.distPt||[0,0,0,0]).map(n=>n*96/72*scale);
      if(r.width>0&&r.height>0)rects.push({element,left:r.left-d[3],right:r.right+d[1],top:r.top-d[0],bottom:r.bottom+d[2]});
    }
    let shift=0;
    for(const p of body.querySelectorAll('p,h1,h2,h3,h4,h5,h6')){
      if(p.closest('[data-native-object="drawing"],table,[hidden]'))continue;
      const text=p.cloneNode(true);text.querySelectorAll('[data-native-object="drawing"],[hidden]').forEach(n=>n.remove());
      if(!text.textContent.trim())continue;
      const r=p.getBoundingClientRect(),style=getComputedStyle(p),line=parseFloat(style.lineHeight)*scale;
      if(!(r.width>0&&line>0))continue;
      const preceding=rects.filter(s=>s.element.compareDocumentPosition(p)&4);
      let target=r.top+shift;
      for(let n=0;n<preceding.length;n++){
        const bottom=blockedShapeBottom(preceding,r.left,r.right,target,line,24*96/72*scale);
        if(bottom<=target+.5)break;target=bottom;
      }
      const delta=target-r.top-shift;
      if(delta>.5&&/^[\w:-]+$/.test(p.dataset.txtNodeId||'')){
        rules.push(`.thesis-paper .thesis-body [data-txt-node-id="${p.dataset.txtNodeId}"][data-txt-node-id]{margin-top:${(parseFloat(style.marginTop)+delta/scale).toFixed(3)}px!important}`);
        shift+=delta;
      }
    }
  }
  const css=rules.join('\n');
  if(!sheet&&css){sheet=root.ownerDocument.createElement('style');sheet.setAttribute('data-thesis-shape-wrap','');root.append(sheet);}
  if(sheet)sheet.textContent=css;
  return css;
}
