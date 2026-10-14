/** CSS float exclusion for paragraph-relative anchored rectangles. The drawing
 * itself remains absolutely positioned; this transparent float only excludes
 * text from the occupied bands, including the source wrap distances. */
export function shapeExclusion(shapes, widthPt) {
  if (!(widthPt > 0)) return null;
  const rects = shapes.filter(s => s.kind === "anchor" && ["square", "tight", "through"].includes(s.wrap)
    && ["paragraph", "line", "text", ""].includes(s.vertical?.relativeFrom || "") && !s.vertical?.align
    && ["column", "text", "margin", ""].includes(s.horizontal?.relativeFrom || "")).map(s => {
      const d = s.distPt || [0,0,0,0], h = s.horizontal || {};
      const x = h.align === "center" ? (widthPt-s.widthPt)/2 : h.align === "right" ? widthPt-s.widthPt : h.align === "left" ? 0 : h.offsetPt || 0;
      return {left:Math.max(0,x-d[3]),right:Math.min(widthPt,x+s.widthPt+d[1]),top:Math.max(0,(s.vertical?.offsetPt||0)-d[0]),bottom:(s.vertical?.offsetPt||0)+s.heightPt+d[2]};
    }).filter(r => r.right > r.left && r.bottom > r.top);
  if (!rects.length) return null;
  const height = Math.max(...rects.map(r=>r.bottom));
  const leftRoom = Math.min(...rects.map(r=>r.left)), rightRoom = widthPt-Math.max(...rects.map(r=>r.right));
  const side = leftRoom > rightRoom ? "right" : "left";
  const edges = [...new Set([0,...rects.flatMap(r=>[r.top,r.bottom])])].sort((a,b)=>a-b);
  const points = [[side === "left" ? 0 : widthPt,0]];
  for(let i=0;i<edges.length-1;i++){
    const a=edges[i],b=edges[i+1],active=rects.filter(r=>r.top<b&&r.bottom>a);
    const boundary=side==="left"?Math.max(0,...active.map(r=>r.right)):Math.min(widthPt,...active.map(r=>r.left));
    points.push([boundary,a],[boundary,b]);
  }
  points.push([side === "left" ? 0 : widthPt,height]);
  const length=n=>`${Math.round(n*100)/100}pt`;
  return {side,heightPt:height,polygon:`polygon(${points.map(([x,y])=>`${length(x)} ${length(y)}`).join(",")})`};
}
