/** Wrap cached DrawingML text with the actual installed font. The native story
 * stays in the document; these SVG lines are only a measured presentation. */
export function drawingTextLines(paragraph, width, measure, wrap = true) {
  const lines = [[]];
  let used = 0;
  const append = (value, run) => {
    const line = lines.at(-1), previous = line.at(-1);
    if (previous?.run === run) previous.text += value;
    else line.push({text:value,run});
    used = line.reduce((sum,piece)=>sum+measure(piece.text,piece.run),0);
  };
  for (const run of paragraph.runs) {
    for (let word of run.text.split(/(\s+)/u).filter(Boolean)) {
      if (wrap && used && used + measure(word,run) > width && word.trim()) { lines.push([]); used=0; }
      if (!used) word=word.trimStart();
      // Word breaks an overlong word inside narrow SmartArt frames.
      for (const character of word) {
        const line=lines.at(-1), previous=line.at(-1);
        const nextWidth=previous?.run===run ? used-measure(previous.text,run)+measure(previous.text+character,run) : used+measure(character,run);
        if (wrap && used && nextWidth > width && character.trim()) { lines.push([]); used=0; }
        append(character,run);
      }
    }
  }
  return lines;
}

const laidOut = new WeakSet();
export function layoutImportedGroupText(root) {
  layoutChartLabels(root);
  const frames = root.querySelectorAll('svg [data-docx-group-text]');
  let context;
  for (const frame of frames) {
    if (laidOut.has(frame)) continue;
    const model=JSON.parse(frame.getAttribute('data-docx-group-text'));
    context ||= root.ownerDocument.createElement('canvas').getContext('2d');
    const font=run=>`${run.italic?'italic ':''}${run.bold?'bold ':''}${run.size}px ${JSON.stringify(run.family)}`;
    const measure=(value,run)=>{context.font=font(run);return context.measureText(value).width;};
    const [left,top,right,bottom]=model.insets, width=Math.max(.01,model.width-left-right);
    const rows=[];
    let height=0;
    for (const [index,p] of model.paragraphs.entries()) {
      const size=Math.max(1,...p.runs.map(r=>r.size)), step=p.line.points ?? size*1.15*p.line.multiple;
      const before=index ? (p.before.points ?? size*1.15*p.before.multiple) : 0;
      const after=index < model.paragraphs.length-1 ? (p.after.points ?? size*1.15*p.after.multiple) : 0;
      height+=before;
      for (const line of drawingTextLines(p,width,measure,model.wrap)) {
        // Canvas ascent/descent gives the actual glyph baseline; the Word
        // line box also reserves the font's normal leading.
        const ascent=Math.max(0,...line.map(piece=>{context.font=font(piece.run);return context.measureText(piece.text || 'M').fontBoundingBoxAscent || piece.run.size*.9;}));
        rows.push({line,p,y:height+(step-size*1.15)/2+ascent});height+=step;
      }
      height+=after;
    }
    const room=model.height-top-bottom-height, offset=model.anchor==='ctr'?room/2:model.anchor==='b'?room:0;
    const nodes=[];
    for (const row of rows) {
      const advance=row.line.reduce((sum,piece)=>sum+measure(piece.text,piece.run),0);
      let x=model.x+left+(row.p.align==='ctr'?(width-advance)/2:row.p.align==='r'?width-advance:0);
      for (const piece of row.line) {
        const node=root.ownerDocument.createElementNS('http://www.w3.org/2000/svg','text');
        const attributes={x,y:model.y+top+offset+row.y,'font-family':piece.run.family,'font-size':piece.run.size,'font-weight':piece.run.bold?'700':'400','font-style':piece.run.italic?'italic':'normal',fill:piece.run.fill,'xml:space':'preserve'};
        for (const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
        node.textContent=piece.text;nodes.push(node);x+=measure(piece.text,piece.run);
      }
    }
    const layer=root.ownerDocument.createElementNS('http://www.w3.org/2000/svg','g');
    layer.setAttribute('data-thesis-group-text-layer','');
    if(frame.hasAttribute('transform'))layer.setAttribute('transform',frame.getAttribute('transform'));
    layer.append(...nodes);
    frame.setAttribute('visibility','hidden');frame.setAttribute('data-thesis-group-text-source','');
    frame.after(layer);laidOut.add(frame);
  }
}

function layoutChartLabels(root) {
  for(const frame of root.querySelectorAll('svg [data-docx-chart-plot]')) {
    if(laidOut.has(frame))continue;
    const {plot,width,valueRoom}=JSON.parse(frame.getAttribute('data-docx-chart-plot'));
    const context=root.ownerDocument.createElement('canvas').getContext('2d');
    const labels=[...frame.querySelectorAll('[data-docx-chart-category]')];
    const measured=labels.map(label=>{const css=getComputedStyle(label);context.font=`${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;return context.measureText(label.textContent).width;});
    const left=7+Math.min(width*.55,Math.max(0,...measured))+14+valueRoom, available=width-left-10;
    if(!(available>0 && plot.w>0)){laidOut.add(frame);continue;}
    const layer=frame.cloneNode(true);
    for(const node of [layer,...layer.querySelectorAll('*')]) {
      node.removeAttribute('data-txt-node-id');node.removeAttribute('class');
      if(node===layer)continue;
      const tag=node.localName;
      if(tag==='rect' && node!==layer.firstElementChild) {
        node.setAttribute('x',String(left+(Number(node.getAttribute('x'))-plot.x)*available/plot.w));
        node.setAttribute('width',String(Number(node.getAttribute('width'))*available/plot.w));
      }else if(tag==='line') {
        for(const key of ['x1','x2'])node.setAttribute(key,String(left+(Number(node.getAttribute(key))-plot.x)*available/plot.w));
      }else if(tag==='text' && node.hasAttribute('data-docx-chart-category')) {
        node.setAttribute('x',String(left+(Number(node.getAttribute('x'))+6-plot.x)*available/plot.w-6));
        node.removeAttribute('textLength');node.removeAttribute('lengthAdjust');
      }else if(tag==='text' && !node.hasAttribute('transform') && !node.hasAttribute('data-docx-chart-title')) {
        const offset=Number(node.getAttribute('data-docx-chart-value-offset') || 0),x=Number(node.getAttribute('x'));
        node.setAttribute('x',String(left+(x-offset-plot.x)*available/plot.w+offset));
      }
    }
    layer.removeAttribute('data-docx-chart-plot');layer.setAttribute('data-thesis-group-text-layer','');
    frame.setAttribute('visibility','hidden');frame.setAttribute('data-thesis-group-text-source','');frame.after(layer);laidOut.add(frame);
  }
}
