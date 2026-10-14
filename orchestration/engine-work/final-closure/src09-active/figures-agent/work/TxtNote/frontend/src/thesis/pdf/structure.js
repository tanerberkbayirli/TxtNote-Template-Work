/** Geometry in rotated PDF viewport points, top-left origin. No source text is
 * discarded by heuristics: headers/footers and uncertain candidates stay editable. */
export const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const overlap = (a, b) => Math.max(0, Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
const inside = (a,b) => a.x+a.width/2 >= b.x-1 && a.x+a.width/2 <= b.x+b.width+1 && a.y+a.height/2 >= b.y-1 && a.y+a.height/2 <= b.y+b.height+1;
export const box = items => {
  if (!items.length) return {x:0,y:0,width:0,height:0};
  const x=Math.min(...items.map(i=>i.x)), y=Math.min(...items.map(i=>i.y));
  return {x,y,width:Math.max(...items.map(i=>i.x+i.width))-x,height:Math.max(...items.map(i=>i.y+i.height))-y};
};
export function textLines(tokens) {
  const rows=[];
  for (const token of [...tokens].sort((a,b)=>a.y-b.y || a.x-b.x)) {
    let row=rows.find(r=>Math.abs(r.baseline-token.baseline)<Math.max(2,Math.min(r.height,token.height)*.35));
    if (!row) { row={baseline:token.baseline,height:token.height,tokens:[]};rows.push(row); }
    row.tokens.push(token);
  }
  return rows.sort((a,b)=>a.baseline-b.baseline).flatMap(row=>{
    const sorted=row.tokens.sort((a,b)=>a.x-b.x), groups=[[]];
    for(const t of sorted) { const prev=groups.at(-1).at(-1); if(prev && t.x-prev.x-prev.width>Math.max(24,t.height*3))groups.push([]); groups.at(-1).push(t); }
    return groups.map(ts=>({ ...box(ts),baseline:row.baseline,tokens:ts,
      text:ts.map((t,i)=>{const prev=ts[i-1];return (prev && !/\s$/.test(prev.text) && !/^\s/.test(t.text) && t.x-prev.x-prev.width>Math.max(.8,t.height*.12)?" ":"")+t.text;}).join("") }));
  });
}

/** Recursively split whitespace gutters. Full-width titles divide vertical bands
 * before columns; this avoids interleaving two-column paragraphs line by line. */
export function readingOrder(items, depth=0) {
  if(items.length<2 || depth>20)return items;
  const cut = axis => {
    const size=axis==='x'?'width':'height'; const sorted=[...items].sort((a,b)=>a[axis]-b[axis]);
    let end=sorted[0][axis]+sorted[0][size],best=null;
    for(let i=1;i<sorted.length;i++){const gap=sorted[i][axis]-end;if(gap>(axis==='x'?18:7) && (!best||gap>best.gap))best={gap,at:i,sorted};end=Math.max(end,sorted[i][axis]+sorted[i][size]);}
    return best;
  };
  const x=cut('x'), y=cut('y');
  const split=x || y;
  if(!split)return [...items].sort((a,b)=>a.y-b.y || a.x-b.x);
  return [...readingOrder(split.sorted.slice(0,split.at),depth+1),...readingOrder(split.sorted.slice(split.at),depth+1)];
}

/** Detect ruled table grids in the rendered page. It works for native and OCR
 * pages alike, independent of PDF paint order. Cell semantics remain reviewable. */
export function ruledTables({data,width,height}, scale=1) {
  const dark=(x,y)=>{const i=(y*width+x)*4;return data[i+3]>100 && data[i]*.299+data[i+1]*.587+data[i+2]*.114<130;};
  const segments=[];
  for(const vertical of [false,true]) {
    const outer=vertical?width:height,inner=vertical?height:width,min=(vertical?22:45)*scale;
    for(let a=0;a<outer;a++){
      let start=-1,gap=0;
      for(let b=0;b<=inner;b++){
        const ink=b<inner&&dark(vertical?a:b,vertical?b:a);
        if(ink){if(start<0)start=b;gap=0;}
        else if(start>=0 && ++gap>Math.max(1,Math.round(scale))){const end=b-gap+1;if(end-start>=min)segments.push({vertical,a,start,end});start=-1;gap=0;}
      }
    }
  }
  const merged=[];
  for(const s of segments){const prev=merged.find(p=>p.vertical===s.vertical&&Math.abs(p.a-s.a)<Math.max(2,scale*1.5)&&Math.abs(p.start-s.start)<scale*3&&Math.abs(p.end-s.end)<scale*3);if(!prev)merged.push(s);}
  const hs=merged.filter(s=>!s.vertical),vs=merged.filter(s=>s.vertical);
  const touches=(h,v)=>v.a>=h.start-scale*3&&v.a<=h.end+scale*3&&h.a>=v.start-scale*3&&h.a<=v.end+scale*3;
  const visited=new Set(),result=[];
  for(const first of hs){if(visited.has(first))continue;const cluster=new Set([first]),queue=[first];
    while(queue.length){const s=queue.pop();visited.add(s);for(const t of (s.vertical?hs:vs))if(!cluster.has(t)&&touches(s.vertical?t:s,s.vertical?s:t)){cluster.add(t);queue.push(t);}}
    const ch=[...cluster].filter(s=>!s.vertical),cv=[...cluster].filter(s=>s.vertical);
    if(ch.length<2||cv.length<2)continue;
    const xs=[...new Set(cv.map(s=>s.a/scale))].sort((a,b)=>a-b),ys=[...new Set(ch.map(s=>s.a/scale))].sort((a,b)=>a-b);
    if(xs.length>40||ys.length>200)continue;
    const rect={x:xs[0],y:ys[0],width:xs.at(-1)-xs[0],height:ys.at(-1)-ys[0]};
    if(rect.width<45||rect.height<22)continue;
    const cells=[],occupied=new Set();
    const boundary=(vertical,a,start,end)=>[...cluster].some(s=>s.vertical===vertical&&Math.abs(s.a/scale-a)<2&&s.start/scale<=start+2&&s.end/scale>=end-2);
    for(let row=0;row<ys.length-1;row++)for(let col=0;col<xs.length-1;col++){
      if(occupied.has(row+':'+col))continue;
      let colspan=1,rowspan=1;
      while(col+colspan<xs.length-1&&!boundary(true,xs[col+colspan],ys[row],ys[row+1]))colspan++;
      while(row+rowspan<ys.length-1&&!boundary(false,ys[row+rowspan],xs[col],xs[col+colspan]))rowspan++;
      for(let r=row;r<row+rowspan;r++)for(let c=col;c<col+colspan;c++)occupied.add(r+':'+c);
      cells.push({row,col,colspan,rowspan,x:xs[col],y:ys[row],width:xs[col+colspan]-xs[col],height:ys[row+rowspan]-ys[row]});
    }
    result.push({...rect,kind:'table',cells,rows:ys.length-1,columns:xs.length-1});
  }
  return result.sort((a,b)=>a.y-b.y);
}

export function analyzePage(page) {
  const assigned=new Set();
  const tables=(page.tables||[]).map(t=>({...t,cells:t.cells.map(c=>{
    const tokens=page.tokens.filter(w=>!assigned.has(w.id)&&inside(w,c));tokens.forEach(w=>assigned.add(w.id));
    return {...c,tokens,lines:textLines(tokens)};
  })}));
  const outside=page.tokens.filter(t=>!assigned.has(t.id));
  const lines=textLines(outside), sizes=outside.map(t=>t.height).sort((a,b)=>a-b),bodySize=sizes[Math.floor(sizes.length/2)]||12;
  const blocks=[];
  for(const line of readingOrder(lines)){
    const header=line.y<page.height*.065,footer=line.y+line.height>page.height*.935;
    const heading=line.height>bodySize*1.2 && line.text.length<220;
    const role=header?'header':footer?'footer':heading?'heading':'paragraph';
    const previous=blocks.at(-1);
    if(role==='paragraph'&&previous?.kind==='paragraph'&&line.y>=previous.y&&line.y-previous.y-previous.height<bodySize*.8&&overlap(previous,line)>Math.min(previous.width,line.width)*.45){
      previous.lines.push(line);Object.assign(previous,box(previous.lines));
    }else blocks.push({...line,kind:role,lines:[line]});
  }
  const items=readingOrder([...blocks,...tables,...(page.images||[]).map(i=>({...i,kind:'image'}))]);
  const columnLines=lines.filter(l=>lines.some(r=>r!==l&&Math.abs(r.y-l.y)<Math.max(r.height,l.height)&&r.x>l.x+l.width+20));
  return {...page,items,bodySize,multipleColumns:columnLines.length>=3};
}

export function repeatedMargins(pages) {
  const groups=new Map();
  for(const p of pages)for(const item of p.items)if(['header','footer'].includes(item.kind)){
    const key=item.kind+':'+item.lines.map(l=>l.text).join(' ').replace(/\d+/g,'#').trim();
    if(!groups.has(key))groups.set(key,new Set());groups.get(key).add(p.number);
    item.marginKey=key;
  }
  for(const p of pages)for(const item of p.items)if(item.marginKey)item.repeatedMargin=groups.get(item.marginKey).size>=Math.min(3,Math.max(2,Math.ceil(pages.length*.35)));
  return pages;
}

/** Remaining connected ink after recognized words and table regions are masked.
 * These are explicitly uncertain visual candidates, never certified figures. */
export function rasterRegions(image,scale,tokens,tables){
  const step=Math.max(2,Math.round(scale*3)),cols=Math.ceil(image.width/step),rows=Math.ceil(image.height/step),mask=new Uint8Array(cols*rows);
  const ignored=[...tokens,...tables];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const px=(x+.5)*step/scale,py=(y+.5)*step/scale;
    if(ignored.some(r=>px>=r.x-2&&px<=r.x+r.width+2&&py>=r.y-2&&py<=r.y+r.height+2))continue;
    let dark=0,total=0;
    for(let dy=0;dy<step;dy+=2)for(let dx=0;dx<step;dx+=2){const ix=x*step+dx,iy=y*step+dy;if(ix>=image.width||iy>=image.height)continue;const i=(iy*image.width+ix)*4;total++;if(image.data[i]+image.data[i+1]+image.data[i+2]<550)dark++;}
    if(dark>total*.1)mask[y*cols+x]=1;
  }
  const result=[];
  for(let start=0;start<mask.length;start++)if(mask[start]){
    mask[start]=0;const pending=[start],points=[];
    while(pending.length){const i=pending.pop(),x=i%cols,y=Math.floor(i/cols);points.push({x:x*step/scale,y:y*step/scale,width:step/scale,height:step/scale});
      for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy,j=ny*cols+nx;if(nx>=0&&nx<cols&&ny>=0&&ny<rows&&mask[j]){mask[j]=0;pending.push(j);}}
    }
    const rect=box(points);if(points.length>=16&&rect.width>=16&&rect.height>=16&&rect.width*rect.height>=400)result.push({...rect,candidate:true});
  }
  return result.slice(0,100);
}
