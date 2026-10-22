/** Safe SVG views of cached DrawingML groups/SmartArt and cached chart series.
 * Only known geometry, finite coordinates, validated colors and text enter the view.
 */
const kids = (n) => Array.from(n?.childNodes || []).filter((c) => c.nodeType === 1);
const child = (n, name) => kids(n).find((c) => c.localName === name);
const deep = (n, name) => kids(n).flatMap((c) => [...(c.localName === name ? [c] : []), ...deep(c, name)]);
const attr = (n, key, fallback = 0) => { const v = n?.hasAttribute(key) ? Number(n.getAttribute(key)) : NaN; return Number.isFinite(v) ? v : fallback; };
const el = (tag, attributes = {}, children = []) => ({ tag, attributes: Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k, String(v)])), children });
const text = (x, y, value, size = 10, fill = "#222222") => el("text", { x, y, "font-size": size, fill }, [{ text: String(value ?? "") }]);
const PALETTE = ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];
export function drawingTheme(root) {
  const result = {};
  const scheme = deep(root, "clrScheme")[0];
  for (const item of kids(scheme)) {
    const value = kids(item)[0];
    const color = value?.getAttribute(value.localName === "sysClr" ? "lastClr" : "val");
    if (/^[\da-f]{6}$/i.test(color || "")) result[item.localName] = "#" + color.toLowerCase();
  }
  const fonts=deep(root,'fontScheme')[0];
  for(const [kind,prefix] of [['majorFont','mj'],['minorFont','mn']]) {
    const face=child(child(fonts,kind),'latin')?.getAttribute('typeface');
    if(face)result[`+${prefix}-lt`]=face;
  }
  return result;
}
function color(fill, theme, fallback) {
  const rgb = child(fill, "srgbClr"), scheme = child(fill, "schemeClr");
  const system = child(fill, 'sysClr');
  if (/^[\da-f]{6}$/i.test(system?.getAttribute('lastClr') || '')) return '#' + system.getAttribute('lastClr');
  if (/^[\da-f]{6}$/i.test(rgb?.getAttribute("val") || "")) return "#" + rgb.getAttribute("val");
  const key = scheme?.getAttribute("val");
  return theme[key] || theme[{ tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" }[key]] || fallback;
}
const canvas = (width, height, children) => el("svg", { xmlns: "http://www.w3.org/2000/svg", width: "100%", height: "100%", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Word çizimi" }, children);

/** Only the preset polygons measured against independent Word controls. */
export function drawingShapeGeometry(shape) {
  const w = shape.widthPt, h = shape.heightPt, geometry = shape.geometry;
  if (![w,h].every(Number.isFinite) || w < 0 || h < 0 || shape.unsupportedGeometryAdjustment) return null;
  const ss = Math.min(w,h), adjustments = shape.geometryAdjustments || {};
  const adj = (key,fallback,max=100000) => Math.max(0,Math.min(max,Number.isFinite(adjustments[key]) ? adjustments[key] : fallback));
  let points;
  if (geometry === 'diamond') points = [[w/2,0],[w,h/2],[w/2,h],[0,h/2]];
  else if (geometry === 'bentUpArrow') {
    const a1=adj('adj1',25000,50000),a2=adj('adj2',25000,50000),a3=adj('adj3',25000,50000);
    const y1=ss*a3/100000,x1=w-ss*a2/50000,x3=w-ss*a2/100000,x2=x3-ss*a1/200000,x4=x3+ss*a1/200000,y2=h-ss*a1/100000;
    points=[[0,y2],[x2,y2],[x2,y1],[x1,y1],[x3,0],[w,y1],[x4,y1],[x4,h],[0,h]];
  } else if (['rightArrow','leftArrow'].includes(geometry)) {
    const shaft=h*adj('adj1',50000)/100000,head=ss*adj('adj2',50000,ss?100000*w/ss:0)/100000;
    points=[[0,(h-shaft)/2],[w-head,(h-shaft)/2],[w-head,0],[w,h/2],[w-head,h],[w-head,(h+shaft)/2],[0,(h+shaft)/2]];
    if (geometry === 'leftArrow') points=points.map(([x,y])=>[w-x,y]);
  } else if (['downArrow','upArrow'].includes(geometry)) {
    const shaft=w*adj('adj1',50000)/100000,head=ss*adj('adj2',50000,ss?100000*h/ss:0)/100000;
    points=[[(w-shaft)/2,0],[(w+shaft)/2,0],[(w+shaft)/2,h-head],[w,h-head],[w/2,h],[0,h-head],[(w-shaft)/2,h-head]];
    if (geometry === 'upArrow') points=points.map(([x,y])=>[x,h-y]);
  } else if (['line','straightConnector1'].includes(geometry)) points=[[0,0],[w,h]];
  else if (geometry === 'bentConnector3') {
    const adjustment=Number.isFinite(adjustments.adj1)?adjustments.adj1:50000,x=w*adjustment/100000;
    points=[[0,0],[x,0],[x,h],[w,h]];
  }
  else return null;
  if (shape.flipH) points=points.map(([x,y])=>[w-x,y]);
  if (shape.flipV) points=points.map(([x,y])=>[x,h-y]);
  return {points,closed:!['line','straightConnector1','bentConnector3'].includes(geometry)};
}

function drawingEndMarks(shape,geometry) {
  if (geometry.closed) return [];
  const stroke=shape.line==='style'?'#4472c4':shape.line || '#000000',weight=shape.lineWidthPt>0?shape.lineWidthPt:.75;
  return ['headEnd','tailEnd'].flatMap((end,index)=>{
    const marker=shape[end];if(!marker)return [];
    const path=index?[...geometry.points].reverse():geometry.points,tip=path[0],next=path.find(p=>Math.hypot(p[0]-tip[0],p[1]-tip[1])>0);
    if(!next)return [];
    const dx=next[0]-tip[0],dy=next[1]-tip[1],distance=Math.hypot(dx,dy),ux=dx/distance,uy=dy/distance;
    // Word's end marks retain a 2 pt base size on thin strokes. Independent
    // 0.5/0.75/1.5/3/6 pt native controls give medium lengths 6/6/6/9/18 pt.
    const sizes={sm:2,med:3,lg:5},base=Math.max(2,weight),length=(sizes[marker.length]||3)*base,half=(sizes[marker.width]||3)*base/2;
    const point=(along,across)=>[tip[0]+ux*along-uy*across,tip[1]+uy*along+ux*across];
    if (marker.type==='oval')return [el('ellipse',{cx:point(length/2,0)[0],cy:point(length/2,0)[1],rx:length/2,ry:half,fill:stroke,transform:`rotate(${Math.atan2(uy,ux)*180/Math.PI} ${point(length/2,0).join(' ')})`})];
    const points=marker.type==='diamond'?[point(0,0),point(length/2,half),point(length,0),point(length/2,-half)]:[point(length,half),point(0,0),point(length,-half),...(marker.type==='stealth'?[point(length*.7,0)]:[])];
    return [el(marker.type==='arrow'?'polyline':'polygon',{points:points.map(p=>p.join(',')).join(' '),fill:marker.type==='arrow'?'none':stroke,stroke,'stroke-width':marker.type==='arrow'?weight:0})];
  });
}

/** CSS `background` value for a shape that also holds text: an SVG layer inside the frame would be cut by the text clip. */
export function drawingShapeBackground(shape) {
  const geometry = drawingShapeGeometry(shape);
  if (!geometry) return null;
  const colour = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || "") || value === "none" ? value : fallback;
  const stroke = colour(shape.line === "style" ? "#4472c4" : shape.line, "none"), fill = geometry.closed ? colour(shape.fill, "none") : "none";
  const width = shape.lineWidthPt > 0 ? shape.lineWidthPt : .75, w = Math.max(.01, shape.widthPt), h = Math.max(.01, shape.heightPt);
  const primitive = geometry.closed ? `<polygon points="${geometry.points.map((point) => point.map((n) => Math.round(n * 1000) / 1000).join(",")).join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
    : `<line x1="${geometry.points[0][0]}" y1="${geometry.points[0][1]}" x2="${geometry.points[1][0]}" y2="${geometry.points[1][1]}" stroke="${stroke}" stroke-width="${width}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${primitive}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") no-repeat 0 0 / 100% 100%`;
}

/** Geometry-only layer: keep the imported textbox story and native DOCX intact. */
export function drawingShapePreview(shape) {
  const geometry=drawingShapeGeometry(shape);
  if (!geometry) return null;
  const stroke=shape.line === 'style' ? '#4472c4' : shape.line || 'none';
  const lineWidth=shape.lineWidthPt > 0 ? shape.lineWidthPt : .75;
  const attributes={fill:geometry.closed ? shape.fill || 'none' : 'none',stroke,'stroke-width':lineWidth};
  const primitive=geometry.closed || geometry.points.length>2 ? el(geometry.closed?'polygon':'polyline',{points:geometry.points.map(p=>p.join(',')).join(' '),...attributes}) : el('line',{x1:geometry.points[0][0],y1:geometry.points[0][1],x2:geometry.points[1][0],y2:geometry.points[1][1],...attributes});
  // A zero SVG viewport suppresses even overflowing strokes. One CSS pixel
  // keeps zero-extent Word connectors paintable without changing their frame.
  const result=canvas(Math.max(.75,shape.widthPt),Math.max(.75,shape.heightPt),[primitive,...drawingEndMarks(shape,geometry)]);
  Object.assign(result.attributes,{'data-docx-shape-geometry':'', 'aria-hidden':'true'});
  return result;
}

export function drawingGroupPreview(root, shape, theme = {}) {
  const width = shape.widthPt, height = shape.heightPt;
  if (!(width > 0 && height > 0)) return null;
  let count = 0;
  const visit = (node) => {
    const name = node.localName;
    if (["wsp", "sp", "cxnSp"].includes(name)) {
      const pr = child(node, "spPr"), xf = child(pr, "xfrm"), off = child(xf, "off"), ext = child(xf, "ext");
      const x = attr(off, "x") / 12700, y = attr(off, "y") / 12700, w = attr(ext, "cx") / 12700, h = attr(ext, "cy") / 12700;
      if (!(w >= 0 && h >= 0) || !xf) return [];
      count++;
      const geom = child(pr, "prstGeom")?.getAttribute("prst"), line = child(pr, "ln"), style = child(node, "style");
      const fill = child(pr, "noFill") ? "none" : color(child(pr, "solidFill"), theme, color(child(style, "fillRef"), theme, "none"));
      const stroke = child(line, "noFill") ? "none" : color(child(line, "solidFill"), theme, color(child(style, "lnRef"), theme, "#444444"));
      const common = { fill, stroke, "stroke-width": Math.max(0.5, attr(line, "w", 12700) / 12700) };
      const body = [];
      if (name === "cxnSp" || /line|Connector/i.test(geom || "")) body.push(el("line", { x1: x, y1: y, x2: x + w, y2: y + h, ...common }));
      else if (geom === "ellipse") body.push(el("ellipse", { cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, ...common }));
      else body.push(el("rect", { x, y, width: w, height: h, ...(/^round/.test(geom || "") ? { rx: Math.min(w, h) * 0.12 } : {}), ...common }));
      // Cached SmartArt connectors often use a numeric custom path, rather
      // than a preset. Its coordinates are in EMUs unless path w/h are given.
      const paths = deep(child(pr, 'custGeom'), 'path');
      if (paths.length) {
        const converted = paths.map(path => {
          const sx = path.hasAttribute('w') ? w / attr(path, 'w') : 1 / 12700;
          const sy = path.hasAttribute('h') ? h / attr(path, 'h') : 1 / 12700;
          let d = '';
          for (const command of kids(path)) {
            if (command.localName === 'close') { d += 'Z'; continue; }
            if (!['moveTo', 'lnTo'].includes(command.localName)) return null;
            const point = child(command, 'pt');
            if (!point || !['x','y'].every(a => /^-?\d+(?:\.\d+)?$/.test(point.getAttribute(a)))) return null;
            d += `${command.localName === 'moveTo' ? 'M' : 'L'}${x + attr(point,'x') * sx} ${y + attr(point,'y') * sy}`;
          }
          return d && Number.isFinite(sx + sy) ? el('path', { d, ...common }) : null;
        });
        if (converted.every(Boolean)) body.splice(0, body.length, ...converted);
      }
      const transforms = [];
      if (attr(xf,'rot')) transforms.push(`rotate(${attr(xf,'rot') / 60000} ${x+w/2} ${y+h/2})`);
      if (xf.getAttribute('flipH') === '1' || xf.getAttribute('flipV') === '1') transforms.push(`translate(${x+w/2} ${y+h/2}) scale(${xf.getAttribute('flipH') === '1' ? -1 : 1} ${xf.getAttribute('flipV') === '1' ? -1 : 1}) translate(${-x-w/2} ${-y-h/2})`);
      const result = transforms.length ? [el('g', {transform:transforms.join(' ')}, body)] : body;
      const txBody = child(node,'txBody');
      if (txBody) {
        const tx = child(node,'txXfrm') || xf, tOff = child(tx,'off'), tExt = child(tx,'ext'), bp = child(txBody,'bodyPr');
        const txX = attr(tOff,'x')/12700, txY = attr(tOff,'y')/12700, tw = attr(tExt,'cx')/12700, th = attr(tExt,'cy')/12700;
        const paragraphs = kids(txBody).filter(p=>p.localName==='p').map(p=>{
          const pp = child(p,'pPr'), defaults = child(pp,'defRPr') || child(p,'endParaRPr');
          const runs = kids(p).filter(r=>r.localName==='r').map(r=>{
            const rp=child(r,'rPr') || defaults;
            return {text:child(r,'t')?.textContent || '',size:attr(rp,'sz',1000)/100,bold:rp?.getAttribute('b')==='1',italic:rp?.getAttribute('i')==='1',family:child(rp,'latin')?.getAttribute('typeface') || 'Times New Roman',fill:color(child(rp,'solidFill'),theme,'#000000')};
          });
          const spacing = kind => {const n=child(pp,kind);return child(n,'spcPts') ? {points:attr(child(n,'spcPts'),'val')/100} : {multiple:attr(child(n,'spcPct'),'val',kind==='lnSpc'?100000:0)/100000};};
          return {runs,align:pp?.getAttribute('algn') || 'l',line:spacing('lnSpc'),before:spacing('spcBef'),after:spacing('spcAft')};
        });
        if (paragraphs.some(p=>p.runs.some(r=>r.text))) {
          const model={x:txX,y:txY,width:tw,height:th,insets:['lIns','tIns','rIns','bIns'].map(k=>attr(bp,k)/12700),anchor:bp?.getAttribute('anchor'),wrap:bp?.getAttribute('wrap')!=='none',paragraphs};
          const fallback=paragraphs.map((p,i)=>text(txX,txY+10+i*12,p.runs.map(r=>r.text).join(''),p.runs[0]?.size || 10));
          result.push(el('g', {'data-docx-group-text':JSON.stringify(model),...(attr(tx,'rot')?{transform:`rotate(${attr(tx,'rot')/60000} ${txX+tw/2} ${txY+th/2})`}:{})}, fallback));
        }
      } else {
        const paragraphs = deep(node,'p').map(p=>deep(p,'t').map(t=>t.textContent).join('')).filter(Boolean);
        paragraphs.forEach((p,i)=>result.push(text(x+4,y+12+i*12,p,10)));
      }
      return result;
    }
    const content = kids(node).flatMap(visit);
    if (["wgp", "grpSp", "spTree"].includes(name)) {
      const xf = child(child(node, "grpSpPr"), "xfrm"), off = child(xf, "off"), ext = child(xf, "ext"), chOff = child(xf, "chOff"), chExt = child(xf, "chExt");
      if (xf && attr(chExt, "cx") > 0 && attr(chExt, "cy") > 0) {
        const sx = attr(ext, "cx") / attr(chExt, "cx"), sy = attr(ext, "cy") / attr(chExt, "cy");
        return [el("g", { transform: `translate(${attr(off, "x") / 12700} ${attr(off, "y") / 12700}) scale(${sx} ${sy}) translate(${-attr(chOff, "x") / 12700} ${-attr(chOff, "y") / 12700})` }, content)];
      }
    }
    return content;
  };
  const content = visit(root);
  return count ? canvas(width, height, content) : null;
}

function horizontalBarPreview(root, chart, shape, series) {
  const width = shape.widthPt, height = shape.heightPt;
  if (!(width > 0 && height > 0)) return null;
  const title = deep(child(child(root, "chart"), "title"), "t").map(n => n.textContent || "").join("").trim();
  const legend = !!deep(root, "legend").length || series.length > 1;
  const top = title ? 32 : 12, bottom = legend ? 38 : 24, n = Math.max(...series.map(s => s.values.length));
  const rowHeight = Math.max(1, (height - top - bottom) / n);
  const size = Math.min(9, Math.max(5, rowHeight * 0.7));
  const labels = series[0].categories;
  const longest = Math.max(0, ...labels.map(s => s.length));
  const left = Math.min(width * 0.68, Math.max(40, longest * size * 0.48 + 12));
  const plotWidth = Math.max(1, width - left - 28);
  const min = Math.min(0, ...series.flatMap(s => s.values)), max = Math.max(1, ...series.flatMap(s => s.values));
  const x = v => left + plotWidth * (v - min) / (max - min), zero = x(0);
  const reverse = deep(deep(chart, "catAx")[0], "orientation")[0]?.getAttribute("val") !== "maxMin";
  const y = i => top + ((reverse ? n - 1 - i : i) + 0.5) * rowHeight;
  const content = [el("rect", { x: 0, y: 0, width, height, fill: "#ffffff" }), el("path", { d: `M${zero} ${top}V${height - bottom}M${left} ${height - bottom}H${left + plotWidth}`, fill: "none", stroke: "#444444" })];
  const fittedText = (tx, ty, value, fontSize, available, extra = {}) => {
    const result = text(tx, ty, value, fontSize);
    Object.assign(result.attributes, extra);
    // Keep every cached character in the SVG; long labels fit their allotted
    // column instead of overflowing the chart's viewport or being truncated.
    if (String(value).length * fontSize * 0.48 > available) Object.assign(result.attributes, { textLength: String(available), lengthAdjust: "spacingAndGlyphs" });
    return result;
  };
  if (title) content.push(fittedText(width / 2, 16, title, 10, width - 16, { "text-anchor": "middle" }));
  labels.forEach((label, i) => content.push(fittedText(left - 6, y(i) + size * 0.33, label, size, left - 12, { "text-anchor": "end" })));
  for (const [sIndex, ser] of series.entries()) {
    const barHeight = rowHeight * 0.72 / series.length;
    ser.values.forEach((value, i) => {
      const cy = y(i) - rowHeight * 0.36 + (sIndex + 0.5) * barHeight;
      content.push(el("rect", { x: Math.min(zero, x(value)), y: cy - barHeight / 2, width: Math.abs(x(value) - zero), height: barHeight, fill: ser.color }));
      if (deep(chart, "showVal").some(n => n.getAttribute("val") === "1")) {
        const label = text(x(value) + (value < 0 ? -3 : 3), cy + size * 0.33, value, size);
        if (value < 0) label.attributes["text-anchor"] = "end";
        content.push(label);
      }
    });
  }
  content.push(text(left, height - bottom + 14, min, 8), text(left + plotWidth - String(max).length * 4, height - bottom + 14, max, 8));
  if (legend) series.forEach((ser, i) => content.push(fittedText(8 + i * (width - 16) / series.length, height - 5, ser.title, 8, (width - 16) / series.length - 4, { fill: ser.color })));
  return canvas(width, height, content);
}


// --- Clustered bar/column charts: read the chart part's own style (colour transforms, gap, axes, labels, frame) ----------------------
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const sat = l > .5 ? d / (2 - max - min) : d / (max + min);
  const hue = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue / 6, sat, l];
}
function hslToRgb([h, s, l]) {
  if (!s) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
/** Fill/line colour with DrawingML lumMod/lumOff applied (the base resolves through the theme like `color`). */
function transformedColor(fillNode, theme, fallback) {
  const holder = child(fillNode, "srgbClr") || child(fillNode, "schemeClr") || child(fillNode, "sysClr");
  if (!holder) return fallback;
  const base = holder.localName === "sysClr" ? (/^[\da-f]{6}$/i.test(holder.getAttribute("lastClr") || "") ? "#" + holder.getAttribute("lastClr") : null) : color(fillNode, theme, null);
  if (!/^#[\da-f]{6}$/i.test(base || "")) return fallback;
  const mod = Number(child(holder, "lumMod")?.getAttribute("val")), off = Number(child(holder, "lumOff")?.getAttribute("val"));
  if (!Number.isFinite(mod) && !Number.isFinite(off)) return base.toLowerCase();
  const hsl = rgbToHsl([1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16)));
  hsl[2] = clamp01(hsl[2] * (Number.isFinite(mod) ? mod / 100000 : 1) + (Number.isFinite(off) ? off / 100000 : 0));
  return "#" + hslToRgb(hsl).map((v) => v.toString(16).padStart(2, "0")).join("");
}
/** Excel's automatic value scale: the smallest 1/2/5×10ⁿ unit that gives at most 10 intervals over the data plus 5 %. */
function autoScale(min, max, fixedMin = false) {
  const lo = fixedMin ? min : Math.min(0, min), top = max + (max - lo) * .05;
  const units = [1, 2, 5].flatMap((m) => Array.from({ length: 14 }, (_, i) => m * 10 ** (i - 4))).sort((a, b) => a - b);
  const unit = units.find((u) => Math.ceil(top / u) - Math.floor(lo / u) <= 10) || (top - lo) / 5;
  return { unit, min: Math.floor(lo / unit) * unit, max: Math.ceil(top / unit) * unit };
}
function textStyle(txPr, theme, defaults) {
  const base=deep(txPr,'defRPr')[0],run=deep(txPr,'rPr')[0],value=name=>run?.hasAttribute(name)?run.getAttribute(name):base?.getAttribute(name);
  const size=Number(value('sz')),rot=Number(deep(txPr,'bodyPr')[0]?.getAttribute('rot'));
  const typeface=child(run,'latin')?.getAttribute('typeface') || child(base,'latin')?.getAttribute('typeface');
  const family=typeface?.startsWith('+')?theme[typeface]:typeface;
  return { size: Number.isFinite(size) && size > 0 ? size / 100 : defaults.size, bold: value('b') === '1' || (value('b') == null && Boolean(defaults.bold)), rotation: Number.isFinite(rot) && Math.abs(rot) <= 21600000 ? rot / 60000 : 0, fill: transformedColor(child(run,'solidFill')||child(base,'solidFill'), theme, defaults.fill || '#000000'), caps:value('cap')==='all',family:family || defaults.family || 'Times New Roman' };
}
function indexedPoints(cache) {
  const count = Number(child(cache, "ptCount")?.getAttribute("val")) || 0, result = Array.from({ length: count }, () => null);
  for (const pt of kids(cache).filter((n) => n.localName === "pt")) { const i = Number(pt.getAttribute("idx")); if (i >= 0 && i < count) result[i] = child(pt, "v")?.textContent ?? ""; }
  return result;
}
function barChartPreview(root, plotArea, shape, theme) {
  const bar = deep(plotArea, "barChart")[0];
  if (!bar || ["lineChart", "scatterChart", "areaChart", "pieChart"].some((name) => deep(plotArea, name).length)) return null;
  if ((child(bar, "grouping")?.getAttribute("val") || "clustered") !== "clustered") return null;
  const horizontal = child(bar, "barDir")?.getAttribute("val") === "bar";
  const sers = kids(bar).filter((n) => n.localName === "ser").map((ser, i) => {
    const cats = indexedPoints(deep(child(ser, "cat"), "strCache")[0] || deep(child(ser, "cat"), "numCache")[0]);
    const vals = indexedPoints(deep(child(ser, "val"), "numCache")[0]).map((v) => v === null || v === "" ? null : Number(v));
    return { cats, vals, color: transformedColor(child(child(ser, "spPr"), "solidFill"), theme, PALETTE[i % PALETTE.length]), labels: child(ser, "dLbls") };
  });
  if (!sers.length || sers.some((s) => !s.vals.length || s.vals.some((v) => v !== null && !Number.isFinite(v)))) return null;
  const width = shape.widthPt, height = shape.heightPt;
  if (!(width > 100 && height > 60)) return null;
  const n = Math.max(...sers.map((s) => s.vals.length)), cats = sers[0].cats;
  const catAx = deep(plotArea, "catAx")[0], valAx = deep(plotArea, "valAx")[0];
  const valueAxisShown = Boolean(valAx) && child(valAx, "delete")?.getAttribute("val") !== "1";
  const catText = textStyle(child(catAx, "txPr"), theme, { size: 10, fill: "#000000" });
  const all = sers.flatMap((s) => s.vals).filter((v) => v !== null), scale = autoScale(Math.min(0, ...all), Math.max(1, ...all));
  const gap = Number(child(bar, "gapWidth")?.getAttribute("val")), gapWidth = Number.isFinite(gap) ? gap : 150;
  const chart = child(root, "chart"), titleNode = child(chart, "title");
  const titleRuns = deep(titleNode, "t").map((t) => t.textContent || "").join("").trim();
  const titleStyle = textStyle(child(titleNode, "txPr"), theme, { size: 14, bold: true });
  const title = titleStyle.caps ? titleRuns.toLocaleUpperCase("tr-TR") : titleRuns;
  const frameLine = child(child(root, "spPr"), "ln");
  const frameColor = child(frameLine, "noFill") ? "none" : transformedColor(child(frameLine, "solidFill"), theme, "#d9d9d9");
  const showValues = sers.some((s) => deep(s.labels, "showVal").some((v) => v.getAttribute("val") === "1"));
  const labelStyle = textStyle(child(sers[0].labels, "txPr"), theme, { size: 10, fill: "#000000" });
  const est = (value, size) => String(value).length * size * .46;
  const content = [el("rect", { x: .375, y: .375, width: width - .75, height: height - .75, fill: "#ffffff", ...(frameColor === "none" ? {} : { stroke: frameColor, "stroke-width": .75 }) })];
  // Word wraps a long title at about 80 % of the chart width instead of squeezing it.
  const titleLines = [];
  if (title) {
    const words = title.split(/\s+/);
    let line = "";
    for (const word of words) {
      if (line && est(`${line} ${word}`, titleStyle.size * 1.08) > width * .8) { titleLines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
    }
    titleLines.push(line);
    titleLines.forEach((value, i) => {
      const node = text(width / 2, 7 + titleStyle.size * (.95 + 1.2 * i), value, titleStyle.size, titleStyle.fill);
      node.attributes['data-docx-chart-title']='';
      Object.assign(node.attributes, { "text-anchor": "middle", ...(titleStyle.bold ? { "font-weight": "bold" } : {}) });
      if (est(value, titleStyle.size) > width - 16) Object.assign(node.attributes, { textLength: String(width - 16), lengthAdjust: "spacingAndGlyphs" });
      content.push(node);
    });
  }
  const top = title ? 14 + titleStyle.size * (1.7 + 1.2 * (titleLines.length - 1)) : 12;
  const manual = child(child(plotArea, "layout"), "manualLayout");
  const frac = (name) => Number(child(manual, name)?.getAttribute("val"));
  const inner = Boolean(manual) && child(manual, "layoutTarget")?.getAttribute("val") === "inner" && [frac("x"), frac("y"), frac("w"), frac("h")].every(Number.isFinite);
  const valueRoom = valueAxisShown ? Math.max(...[scale.min, scale.max].map((v) => est(v, 9))) + 8 : 0;
  const rotated = Math.abs(catText.rotation) === 90;
  let plot;
  if (inner) plot = { x: width * frac("x"), y: height * frac("y"), w: width * frac("w"), h: height * frac("h") };
  else if (horizontal) {
    const room = Math.min(width * .55, Math.max(0, ...cats.map((c) => est(c ?? "", catText.size))) + 14);
    plot = { x: 7 + room + valueRoom, y: top, w: width - 17 - room - valueRoom, h: height - top - 9 };
  } else {
    const room = rotated ? Math.min(height * .5, Math.max(0, ...cats.map((c) => est(c ?? "", catText.size))) + 12) : catText.size + 12;
    plot = { x: 7 + valueRoom, y: top, w: width - 14 - valueRoom, h: height - top - room - 3 };
  }
  const span = scale.max - scale.min || 1;
  const pos = (v) => horizontal ? plot.x + plot.w * (v - scale.min) / span : plot.y + plot.h * (scale.max - v) / span;
  const zero = pos(Math.max(0, scale.min)), band = (horizontal ? plot.h : plot.w) / n, barSize = band / (1 + gapWidth / 100) / sers.length;
  if (valueAxisShown) {
    for (let v = scale.min; v <= scale.max + 1e-9; v += scale.unit) {
      const p = pos(v), label = text(horizontal ? p : plot.x - 5, horizontal ? plot.y + plot.h + 11 : p + 3, Math.round(v * 1e6) / 1e6, 9);
      Object.assign(label.attributes, { "text-anchor": horizontal ? "middle" : "end" });
      content.push(label);
      if (child(valAx, "majorGridlines")) content.push(el("line", horizontal ? { x1: p, y1: plot.y, x2: p, y2: plot.y + plot.h, stroke: "#d9d9d9", "stroke-width": .5 } : { x1: plot.x, y1: p, x2: plot.x + plot.w, y2: p, stroke: "#d9d9d9", "stroke-width": .5 }));
    }
  }
  const axisLine = transformedColor(child(child(child(catAx, "spPr"), "ln"), "solidFill"), theme, "#d9d9d9");
  content.push(el("line", horizontal ? { x1: zero, y1: plot.y, x2: zero, y2: plot.y + plot.h, stroke: axisLine, "stroke-width": .75 } : { x1: plot.x, y1: zero, x2: plot.x + plot.w, y2: zero, stroke: axisLine, "stroke-width": .75 }));
  const reversed = child(child(catAx, "scaling"), "orientation")?.getAttribute("val") === "maxMin";
  // Automatic label interval: when the lines would touch, Word labels every second (third, …) category, starting with the first.
  const labelSpan = horizontal || rotated ? catText.size * 1.25 : Math.max(0, ...cats.map((c) => est(c ?? "", catText.size))) + 4;
  const skip = child(catAx, "tickLblSkip") ? Math.max(1, Number(child(catAx, "tickLblSkip").getAttribute("val")) || 1) : Math.max(1, Math.ceil(labelSpan / band));
  for (let i = 0; i < n; i++) {
    // Horizontal charts list the first category at the bottom (minMax); columns run left to right.
    const slot = horizontal ? (reversed ? i : n - 1 - i) : (reversed ? n - 1 - i : i), center = (horizontal ? plot.y : plot.x) + (slot + .5) * band;
    sers.forEach((ser, si) => {
      const v = ser.vals[i];
      if (v === null || v === undefined) return;
      const offset = (si - (sers.length - 1) / 2) * barSize, edge = pos(v), a = Math.min(zero, edge), size = Math.abs(edge - zero);
      content.push(el("rect", horizontal ? { x: a, y: center + offset - barSize / 2, width: size, height: barSize, fill: ser.color } : { x: center + offset - barSize / 2, y: a, width: barSize, height: size, fill: ser.color }));
      if (showValues) {
        const label = text(horizontal ? (v < 0 ? a - 3 : a + size + 3) : center + offset, horizontal ? center + offset + labelStyle.size * .33 : (v < 0 ? a + size + labelStyle.size : a - 3), v, labelStyle.size, labelStyle.fill);
        if(horizontal)label.attributes['data-docx-chart-value-offset']=v<0?-3:3;
        Object.assign(label.attributes, { "text-anchor": horizontal ? (v < 0 ? "end" : "start") : "middle", ...(labelStyle.bold ? { "font-weight": "bold" } : {}) });
        content.push(label);
      }
    });
    const name = cats[i];
    if (i % skip || name === null || name === undefined || String(name).trim() === "") continue;
    const value = String(name).trim();
    if (horizontal) {
      const label = text(zero - 6, center + catText.size * .33, value, catText.size, catText.fill);
      Object.assign(label.attributes, { "text-anchor": "end", 'data-docx-chart-category':'' });
      if (est(value, catText.size) > zero - 8) Object.assign(label.attributes, { textLength: String(Math.max(1, zero - 8)), lengthAdjust: "spacingAndGlyphs" });
      content.push(label);
    } else if (rotated) {
      const x = center + catText.size * .33, y = plot.y + plot.h + 6, label = text(x, y, value, catText.size, catText.fill);
      Object.assign(label.attributes, { transform: `rotate(-90 ${x} ${y})`, "text-anchor": "end" });
      content.push(label);
    } else {
      const label = text(center, plot.y + plot.h + 6 + catText.size, value, catText.size, catText.fill);
      label.attributes["text-anchor"] = "middle";
      if (est(value, catText.size) > band - 2) Object.assign(label.attributes, { textLength: String(Math.max(1, band - 2)), lengthAdjust: "spacingAndGlyphs" });
      content.push(label);
    }
  }
  // Auto chart layout depends on the installed font's actual advances, not
  // character count. Keep the conservative import preview and measure its
  // category-label column in the browser before pagination/PDF collection.
  const result = canvas(width, height, horizontal && !manual ? [el('g',{'data-docx-chart-plot':JSON.stringify({plot,width,valueRoom})},content)] : content);
  result.attributes["font-family"] = "Times New Roman";
  result.attributes.direction = "ltr";
  return result;
}


/** Single-series pie: slices clockwise from 12 o'clock in the data-point colours, each with an outside "category / percent" label in its own style. */
function pieChartPreview(root, plotArea, shape, theme) {
  const pie = deep(plotArea, "pieChart")[0];
  if (!pie || kids(pie).filter((n) => n.localName === "ser").length !== 1) return null;
  const ser = kids(pie).find((n) => n.localName === "ser");
  const cats = indexedPoints(deep(child(ser, "cat"), "strCache")[0] || deep(child(ser, "cat"), "numCache")[0]);
  const vals = indexedPoints(deep(child(ser, "val"), "numCache")[0]).map((v) => v === null || v === "" ? 0 : Number(v));
  const total = vals.reduce((a, b) => a + b, 0), width = shape.widthPt, height = shape.heightPt;
  if (!vals.length || vals.some((v) => !Number.isFinite(v) || v < 0) || !(total > 0) || !(width > 100 && height > 100)) return null;
  const points = new Map(kids(ser).filter((n) => n.localName === "dPt").map((n) => [Number(child(n, "idx")?.getAttribute("val")), n]));
  const labels = child(ser, "dLbls"), pointLabels = new Map(kids(labels).filter((n) => n.localName === "dLbl").map((n) => [Number(child(n, "idx")?.getAttribute("val")), n]));
  const on = (node, name, fallback) => { const v = child(node, name)?.getAttribute("val"); return v == null ? fallback : v === "1"; };
  const showName = on(labels, "showCatName", false), showPercent = on(labels, "showPercent", false);
  const sliceColor = (i) => transformedColor(child(child(points.get(i), "spPr"), "solidFill"), theme, PALETTE[i % PALETTE.length]);
  const titleNode = child(child(root, "chart"), "title"), titleText = deep(titleNode, "t").map((t) => t.textContent || "").join("").trim();
  const titleStyle = textStyle(child(titleNode, "txPr"), theme, { size: 14, bold: true });
  const title = titleStyle.caps ? titleText.toLocaleUpperCase("tr-TR") : titleText;
  const est = (value, size) => String(value).length * size * .46;
  const frameLine = child(child(root, "spPr"), "ln");
  const frameColor = child(frameLine, "noFill") ? "none" : transformedColor(child(frameLine, "solidFill"), theme, "#d9d9d9");
  const content = [el("rect", { x: .375, y: .375, width: width - .75, height: height - .75, fill: "#ffffff", ...(frameColor === "none" ? {} : { stroke: frameColor, "stroke-width": .75 }) })];
  const lines = [];
  let line = "";
  for (const word of title.split(/\s+/).filter(Boolean)) {
    if (line && est(`${line} ${word}`, titleStyle.size * 1.08) > width * .8) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  lines.forEach((value, i) => {
    const node = text(width / 2, 7 + titleStyle.size * (.95 + 1.2 * i), value, titleStyle.size, titleStyle.fill);
    Object.assign(node.attributes, { "text-anchor": "middle", ...(titleStyle.bold ? { "font-weight": "bold" } : {}) });
    content.push(node);
  });
  const top = lines.length ? 14 + titleStyle.size * (1.7 + 1.2 * (lines.length - 1)) : 12;
  const radius = Math.min(width * .27, (height - top) * .36), cx = width / 2, cy = top + (height - top) / 2;
  // Word's percent labels are rounded by largest remainder so that they add up to exactly 100 % (measured: SRC09 s.102, 26 % + 24 % for 303 and 279 of 1189).
  const exact = vals.map((v) => v / total * 100), percents = exact.map(Math.floor);
  exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]).slice(0, 100 - percents.reduce((a, b) => a + b, 0)).forEach(([, i]) => { percents[i] += 1; });
  let angle = -Math.PI / 2;
  vals.forEach((value, i) => {
    if (!value) return;
    const sweep = value / total * Math.PI * 2, a0 = angle, a1 = angle + sweep, mid = (a0 + a1) / 2;
    angle = a1;
    const p = (a) => [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    content.push(vals.filter(Boolean).length === 1 ? el("circle", { cx, cy, r: radius, fill: sliceColor(i) }) : el("path", { d: `M${cx} ${cy}L${x0} ${y0}A${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x1} ${y1}Z`, fill: sliceColor(i), stroke: "#ffffff", "stroke-width": .5 }));
    if (!showName && !showPercent) return;
    const style = textStyle(child(pointLabels.get(i), "txPr") || child(labels, "txPr"), theme, { size: 10, bold: true, fill: sliceColor(i) });
    const rows = [];
    if (showName && cats[i]) {
      let current = "";
      for (const word of String(cats[i]).trim().split(/\s+/)) { if (current && est(`${current} ${word}`, style.size) > 78) { rows.push(current); current = word; } else current = current ? `${current} ${word}` : word; }
      if (current) rows.push(current);
    }
    if (showPercent) rows.push(`${percents[i]}%`);
    const manual = child(child(pointLabels.get(i), "layout"), "manualLayout");
    const shiftX = (Number(child(manual, "x")?.getAttribute("val")) || 0) * width, shiftY = (Number(child(manual, "y")?.getAttribute("val")) || 0) * height;
    const lx = cx + (radius + 14) * Math.cos(mid) + shiftX, ly = cy + (radius + 12) * Math.sin(mid) + shiftY, anchor = Math.cos(mid) > .25 ? "start" : Math.cos(mid) < -.25 ? "end" : "middle";
    const first = ly - (rows.length - 1) * style.size * .6 + style.size * .33 - (Math.sin(mid) < -.5 ? (rows.length - 1) * style.size * .6 : 0);
    rows.forEach((row, r) => {
      const node = text(lx, first + r * style.size * 1.2, row, style.size, style.fill);
      Object.assign(node.attributes, { "text-anchor": anchor, ...(style.bold ? { "font-weight": "bold" } : {}) });
      content.push(node);
    });
  });
  const result = canvas(width, height, content);
  result.attributes["font-family"] = "Times New Roman";
  result.attributes.direction = "ltr";
  return result;
}


/** Marker-only scatter chart (series line is noFill): hollow markers, per-point rich-text labels, titled value axes with explicit minimum/auto scale. */
function scatterChartPreview(root, plotArea, shape, theme) {
  const scatter = deep(plotArea, "scatterChart")[0];
  const sers = scatter ? kids(scatter).filter((n) => n.localName === "ser") : [];
  if (sers.length !== 1 || !child(child(child(sers[0], "spPr"), "ln"), "noFill")) return null;
  const ser = sers[0], width = shape.widthPt, height = shape.heightPt;
  const xs = indexedPoints(deep(child(ser, "xVal"), "numCache")[0]).map(Number), ys = indexedPoints(deep(child(ser, "yVal"), "numCache")[0]).map(Number);
  if (!(width > 100 && height > 60) || !xs.length || xs.length !== ys.length || [...xs, ...ys].some((v) => !Number.isFinite(v))) return null;
  const axes = deep(plotArea, "valAx"), xAx = axes.find((a) => child(a, "axPos")?.getAttribute("val") === "b"), yAx = axes.find((a) => child(a, "axPos")?.getAttribute("val") === "l");
  if (!xAx || !yAx) return null;
  const fixed = (axis, name) => { const v = Number(child(child(axis, "scaling"), name)?.getAttribute("val")); return Number.isFinite(v) ? v : null; };
  const scaleOf = (axis, values) => {
    const lo = fixed(axis, "min"), hi = fixed(axis, "max"), base = autoScale(lo ?? Math.min(...values), hi ?? Math.max(...values), lo !== null);
    const unit = Number(child(axis, "majorUnit")?.getAttribute("val")) || base.unit;
    return { unit, min: lo ?? Math.floor(base.min / unit) * unit, max: hi ?? Math.ceil(base.max / unit) * unit };
  };
  const sx = scaleOf(xAx, xs), sy = scaleOf(yAx, ys);
  const titleNode = child(child(root, "chart"), "title"), titleStyle = textStyle(child(titleNode, "txPr"), theme, { size: 14, bold: true });
  const titleText = deep(titleNode, "t").map((t) => t.textContent || "").join("").trim(), title = titleStyle.caps ? titleText.toLocaleUpperCase("tr-TR") : titleText;
  const frameLine = child(child(root, "spPr"), "ln"), frameColor = child(frameLine, "noFill") ? "none" : transformedColor(child(frameLine, "solidFill"), theme, "#d9d9d9");
  const content = [el("rect", { x: .375, y: .375, width: width - .75, height: height - .75, fill: "#ffffff", ...(frameColor === "none" ? {} : { stroke: frameColor, "stroke-width": .75 }) })];
  if (title) {
    const node = text(width / 2, 4 + titleStyle.size * .95, title, titleStyle.size, titleStyle.fill);
    Object.assign(node.attributes, { "text-anchor": "middle", ...(titleStyle.bold ? { "font-weight": "bold" } : {}) });
    content.push(node);
  }
  const manual = child(child(plotArea, "layout"), "manualLayout"), frac = (name) => Number(child(manual, name)?.getAttribute("val"));
  const plot = manual && [frac("x"), frac("y"), frac("w"), frac("h")].every(Number.isFinite) ? { x: width * frac("x"), y: height * frac("y"), w: width * frac("w"), h: height * frac("h") } : { x: 34, y: 28, w: width - 50, h: height - 56 };
  const px = (v) => plot.x + plot.w * (v - sx.min) / (sx.max - sx.min), py = (v) => plot.y + plot.h * (sy.max - v) / (sy.max - sy.min);
  const axisLine = (axis) => transformedColor(child(child(child(axis, "spPr"), "ln"), "solidFill"), theme, "#d9d9d9");
  // Both axes cross at zero when it lies inside the other axis' range (crosses=autoZero), else at the range edge.
  const crossX = Math.min(Math.max(0, sy.min), sy.max), crossY = Math.min(Math.max(0, sx.min), sx.max);
  content.push(el("line", { x1: plot.x, y1: py(crossX), x2: plot.x + plot.w, y2: py(crossX), stroke: axisLine(xAx), "stroke-width": .75 }), el("line", { x1: px(crossY), y1: plot.y, x2: px(crossY), y2: plot.y + plot.h, stroke: axisLine(yAx), "stroke-width": .75 }));
  const tick = (axis, scale, along) => {
    const style = textStyle(child(axis, "txPr"), theme, { size: 9, fill: "#595959" });
    for (let v = Math.ceil(scale.min / scale.unit - 1e-9) * scale.unit; v <= scale.max + 1e-9; v += scale.unit) {
      const value = Math.round(v * 1e6) / 1e6, label = along ? text(px(v), py(crossX) + style.size + 2, String(value).replace(".", ","), style.size, style.fill) : text(px(crossY) - 5, py(v) + style.size * .33, String(value).replace(".", ","), style.size, style.fill);
      label.attributes["text-anchor"] = along ? "middle" : "end";
      label.attributes['font-family']=style.family;
      content.push(label);
    }
  };
  tick(xAx, sx, true);
  tick(yAx, sy, false);
  const axisTitle = (axis, x, y, rotate) => {
    const run = child(axis, "title"), value = deep(run, "t").map((t) => t.textContent || "").join("").trim();
    if (!value) return;
    const style = textStyle(child(run, "txPr"), theme, { size: 9, bold: true }), label = text(x, y, style.caps ? value.toLocaleUpperCase("tr-TR") : value, style.size, style.fill);
    Object.assign(label.attributes, { "text-anchor": "middle", ...(style.bold ? { "font-weight": "bold" } : {}), ...(rotate ? { transform: `rotate(-90 ${x} ${y})` } : {}) });
    content.push(label);
  };
  axisTitle(xAx, plot.x + plot.w / 2, plot.y + plot.h - 3, false);
  axisTitle(yAx, 9, plot.y + plot.h * .45, true);
  const marker = child(ser, "marker"), markerSize = Number(child(marker, "size")?.getAttribute("val")) || 5;
  const markerLine = child(child(marker, "spPr"), "ln"), strokeWidth = Number(markerLine?.getAttribute("w")) / 12700 || 1;
  const strokeHolder = child(child(markerLine, "solidFill"), "schemeClr") || child(child(markerLine, "solidFill"), "srgbClr");
  const alpha = Number(child(strokeHolder, "alpha")?.getAttribute("val")), stroke = transformedColor(child(markerLine, "solidFill"), theme, "#70ad47");
  const fill = transformedColor(child(child(marker, "spPr"), "solidFill"), theme, "#ffffff");
  const labels = child(ser, "dLbls"), pointLabels = new Map(kids(labels).filter((n) => n.localName === "dLbl").map((n) => [Number(child(n, "idx")?.getAttribute("val")), n]));
  const labelStyle = textStyle(child(labels, "txPr"), theme, { size: 10, bold: true, fill: "#404040" });
  xs.forEach((x, i) => {
    const cx = px(x), cy = py(ys[i]);
    content.push(el("circle", { cx, cy, r: markerSize / 2, fill, stroke, "stroke-width": strokeWidth, ...(Number.isFinite(alpha) ? { "stroke-opacity": alpha / 100000 } : {}) }));
    const node = pointLabels.get(i), rich = deep(node, "t").map((t) => t.textContent || "").join("").trim();
    if (!rich) return;
    const position = child(node, "dLblPos")?.getAttribute("val") || "r", reach = markerSize / 2 + strokeWidth / 2 + 2;
    const manual=child(child(node,'layout'),'manualLayout'),dx=attr(child(manual,'x'),'val')*width,dy=attr(child(manual,'y'),'val')*height;
    const label = text((position === "r" ? cx + reach : position === "l" ? cx - reach : cx)+dx, (position === "t" ? cy - reach - 1 : position === "b" ? cy + reach + labelStyle.size : cy + labelStyle.size * .33)+dy, rich, labelStyle.size, labelStyle.fill);
    label.attributes['font-family']=labelStyle.family;
    Object.assign(label.attributes, { "text-anchor": position === "r" ? "start" : position === "l" ? "end" : "middle", ...(labelStyle.bold ? { "font-weight": "bold" } : {}) });
    content.push(label);
  });
  const result = canvas(width, height, content);
  result.attributes["font-family"] = "Times New Roman";
  result.attributes.direction = "ltr";
  return result;
}

/** Connector overlays anchored to chart fractions (not the EMU size of the
 * cached drawing). A zero-width/height anchor is a valid vertical/horizontal line. */
export function chartUserShapesPreview(root, shape, theme = {}) {
  return kids(root).filter(n=>n.localName==='relSizeAnchor').flatMap(anchor=>{
    const from=child(anchor,'from'),to=child(anchor,'to'),connector=child(anchor,'cxnSp');
    const coords=[child(from,'x'),child(from,'y'),child(to,'x'),child(to,'y')].map(n=>n?.textContent?.trim()?Number(n.textContent):NaN);
    if(!connector || !coords.every(Number.isFinite) || coords.some(v=>Math.abs(v)>10))return [];
    const line=child(child(connector,'spPr'),'ln');
    if(child(line,'noFill'))return [];
    const [x1,y1,x2,y2]=coords;
    return [el('line',{x1:x1*shape.widthPt,y1:y1*shape.heightPt,x2:x2*shape.widthPt,y2:y2*shape.heightPt,stroke:transformedColor(child(line,'solidFill'),theme,'#000000'),'stroke-width':attr(line,'w',12700)/12700,fill:'none'})];
  });
}

export function chartPreview(root, shape, theme = {}) {
  if (root?.namespaceURI === "http://schemas.microsoft.com/office/drawing/2014/chartex") return paretoPreview(root, shape, theme);
  const chart = deep(root, "plotArea")[0];
  if (!chart) return null;
  const styledBars = barChartPreview(root, chart, shape, theme);
  if (styledBars) return styledBars;
  const styledPie = pieChartPreview(root, chart, shape, theme);
  if (styledPie) return styledPie;
  const styledScatter = scatterChartPreview(root, chart, shape, theme);
  if (styledScatter) return styledScatter;
  if (!["barChart", "lineChart", "scatterChart"].some((name) => deep(chart, name).length)) return null;
  const horizontal = deep(chart, "barDir").some(n => n.getAttribute("val") === "bar");
  // A stacked or mixed-axis chart needs a different data model. Keep the explicit
  // unsupported preview rather than silently drawing it as clustered bars.
  if (horizontal && (deep(chart, "grouping").some(n => ["stacked", "percentStacked"].includes(n.getAttribute("val"))) || deep(chart, "lineChart").length || deep(chart, "scatterChart").length)) return null;
  const series = deep(chart, "ser").map((ser, i) => {
    const points = (n) => deep(n, "pt").sort((a, b) => attr(a, "idx") - attr(b, "idx")).map((p) => child(p, "v")?.textContent || "");
    return { title: deep(child(ser, "tx"), "v")[0]?.textContent || `Seri ${i + 1}`, categories: points(child(ser, "cat") || child(ser, "xVal")), values: points(child(ser, "val") || child(ser, "yVal")).map(Number), color: color(child(child(ser, "spPr"), "solidFill"), theme, PALETTE[i % PALETTE.length]) };
  }).filter((s) => s.values.length && s.values.every(Number.isFinite));
  if (!series.length) return null;
  if (horizontal) return horizontalBarPreview(root, chart, shape, series);
  const width = shape.widthPt, height = shape.heightPt, left = 34;
  const title = deep(child(child(root, "chart"), "title"), "t").map(n => n.textContent || "").join("").trim();
  const top = title ? 36 : 20;
  const categoryRotation = Number(deep(deep(chart, "catAx")[0], "bodyPr")[0]?.getAttribute("rot")) / 60000;
  const rotated = Math.abs(categoryRotation) === 90;
  const categoryRoom = rotated ? Math.min(height * 0.5, Math.max(45, ...series[0].categories.map(s => s.length * 4 + 28))) : 45;
  const plotW = Math.max(1, width - 50), plotH = Math.max(1, height - top - categoryRoom);
  const min = Math.min(0, ...series.flatMap((s) => s.values)), max = Math.max(1, ...series.flatMap((s) => s.values));
  const y = (v) => top + plotH * (max - v) / (max - min), zero = y(0), n = Math.max(...series.map((s) => s.values.length));
  const content = [el("rect", { x: 0, y: 0, width, height, fill: "#ffffff" }), el("path", { d: `M${left} ${top}V${top + plotH}M${left} ${zero}H${left + plotW}`, fill: "none", stroke: "#444444" })];
  if (title) {
    const label = text(width / 2, 16, title, 10);
    label.attributes["text-anchor"] = "middle";
    if (title.length * 5 > width - 16) Object.assign(label.attributes, { textLength: String(width - 16), lengthAdjust: "spacingAndGlyphs" });
    content.push(label);
  }
  content.push(text(2, top + 8, max), text(2, top + plotH, min));
  const line = deep(chart, "lineChart").length || deep(chart, "scatterChart").length;
  for (const [sIndex, ser] of series.entries()) {
    if (line) content.push(el("polyline", { points: ser.values.map((v, i) => `${left + plotW * (i + 0.5) / n},${y(v)}`).join(" "), fill: "none", stroke: ser.color, "stroke-width": 1.5 }));
    else ser.values.forEach((v, i) => {
      const x = left + plotW * (i + 0.1 + sIndex * 0.8 / series.length) / n, w = plotW * 0.8 / n / series.length;
      content.push(el("rect", { x, y: Math.min(zero, y(v)), width: w, height: Math.abs(y(v) - zero), fill: ser.color }));
      if (deep(chart, "showVal").some(n => n.getAttribute("val") === "1")) {
        const label = text(x + w / 2, y(v) + (v < 0 ? 10 : -3), v, 8);
        label.attributes["text-anchor"] = "middle";content.push(label);
      }
    });
    content.push(text(left + sIndex * Math.max(60, plotW / series.length), height - 8, ser.title, 9, ser.color));
  }
  series[0].categories.forEach((label, i) => {
    const x = left + plotW * (i + 0.5) / n, y = top + plotH + 10, node = text(x, y, label, 8);
    if (rotated) {
      Object.assign(node.attributes, { transform: `rotate(${categoryRotation} ${x} ${y})`, "text-anchor": categoryRotation < 0 ? "end" : "start" });
      if (label.length * 4 > categoryRoom - 28) Object.assign(node.attributes, { textLength: String(categoryRoom - 28), lengthAdjust: "spacingAndGlyphs" });
    } else {
      node.attributes["text-anchor"] = "middle";
      if (label.length * 4 > plotW / n - 2) Object.assign(node.attributes, { textLength: String(Math.max(1, plotW / n - 2)), lengthAdjust: "spacingAndGlyphs" });
    }
    content.push(node);
  });
  return canvas(width, height, content);
}

/** Cached, aggregated Pareto data only. Unknown ChartEx layouts keep the source fallback. */
function paretoPreview(root, shape, theme) {
  const region = deep(root, "plotAreaRegion")[0], series = kids(region).filter(n => n.localName === "series");
  const column = series.find(n => n.getAttribute("layoutId") === "clusteredColumn"), line = series.find(n => n.getAttribute("layoutId") === "paretoLine");
  if (series.length !== 2 || !column || !line || Number(line.getAttribute("ownerIdx")) !== series.indexOf(column) || !deep(column, "aggregation").length) return null;
  const data = deep(child(root, "chartData"), "data").find(n => n.getAttribute("id") === child(column, "dataId")?.getAttribute("val"));
  const strings = kids(data).filter(n => n.localName === "strDim" && n.getAttribute("type") === "cat"), numbers = kids(data).filter(n => n.localName === "numDim" && n.getAttribute("type") === "val");
  if (strings.length !== 1 || numbers.length !== 1 || kids(strings[0]).filter(n => n.localName === "lvl").length !== 1 || kids(numbers[0]).filter(n => n.localName === "lvl").length !== 1) return null;
  const points = n => deep(n, "pt").map(p => ({ index: Number(p.getAttribute("idx")), value: p.textContent || "" })).sort((a,b) => a.index-b.index);
  const labels = points(strings[0]), values = points(numbers[0]);
  if (!labels.length || labels.length !== values.length || labels.some((p,i) => p.index !== i || values[i].index !== i) || values.some(p => !p.value.trim() || !Number.isFinite(Number(p.value)) || Number(p.value) < 0)) return null;
  // Aggregation combines duplicate categories before descending, stable Pareto ordering.
  const grouped = new Map();labels.forEach((p,i) => grouped.set(p.value, (grouped.get(p.value) || 0) + Number(values[i].value)));
  const rows = [...grouped].map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value), total = rows.reduce((n,r) => n+r.value,0);
  const width = shape.widthPt, height = shape.heightPt;
  if (![total,width,height].every(Number.isFinite) || !(total > 0 && width > 100 && height > 100)) return null;
  const axes=deep(root,'axis'),categoryAxis=axes.find(n=>child(n,'catScaling'));
  const categoryStyle=textStyle(child(categoryAxis,'txPr'),theme,{size:7});
  const valueStyle=textStyle(child(axes.find(n=>child(n,'valScaling')&&!child(n,'units')),'txPr'),theme,{size:8});
  const percentStyle=textStyle(child(axes.find(n=>child(n,'units')),'txPr'),theme,{size:8});
  const labelStyle=textStyle(child(child(column,'dataLabels'),'txPr'),theme,{size:8});
  const styled=(x,y,value,style,extra={})=>{
    const result=text(x,y,value,style.size,style.fill);
    Object.assign(result.attributes,{'font-family':style.family},style.bold?{'font-weight':'bold'}:{},extra);return result;
  };
  const niceStep = value => {const power=10**Math.floor(Math.log10(value));return [1,2,5,10].find(n => n*power>=value)*power;};
  const step=niceStep(rows[0].value/6), max=Math.ceil(rows[0].value/step)*step;
  if (![step,max].every(Number.isFinite) || !(step > 0 && max > 0 && max/step <= 100)) return null;
  const left=38,right=70,top=33,labelRoom=Math.min(height*.4,Math.max(50,...rows.map(r=>r.label.length*categoryStyle.size*.43+12))),bottom=height-labelRoom,plotW=width-left-right,plotH=bottom-top;
  if (!(plotW > 0 && plotH > 0)) return null;
  const x=i=>left+plotW*(i+.5)/rows.length,y=v=>bottom-v/max*plotH;
  const content=[el("rect",{x:0,y:0,width,height,fill:"#ffffff"})];
  const titleNode=child(child(root,"chart"),"title"),title=deep(titleNode,"t").map(n=>n.textContent).join("").trim();
  if(title){const label=text(width/2,19,title,12);Object.assign(label.attributes,{"text-anchor":"middle","font-weight":"bold","letter-spacing":1.5});if(deep(titleNode,"defRPr").some(n=>n.getAttribute("cap")==="all"))label.children=[{text:title.toLocaleUpperCase("tr-TR")}];content.push(label);}
  for(let v=0;v<=max;v+=step){const py=y(v);content.push(el("line",{x1:left,y1:py,x2:left+plotW,y2:py,stroke:"#d9d9d9","stroke-width":.5}));content.push(styled(left-6,py+valueStyle.size*.33,v,valueStyle,{'text-anchor':'end'}));}
  for(let v=0;v<=100;v+=10)content.push(styled(left+plotW+7,bottom-v/100*plotH+percentStyle.size*.33,`${v}%`,percentStyle));
  const fill=transformedColor(child(child(column,"spPr"),"solidFill"),theme,PALETTE[0]);
  const outline=child(child(column,'spPr'),'ln'),stroke=child(outline,'noFill')?'none':transformedColor(child(outline,'solidFill'),theme,'none');let cumulative=0;
  const gap=Number(child(deep(root,"axis").find(n=>child(n,"catScaling")),"catScaling")?.getAttribute("gapWidth"));
  const barWidth=plotW/rows.length/(1+(Number.isFinite(gap)&&gap>=0?gap:1.5));
  rows.forEach((row,i)=>{content.push(el("rect",{x:x(i)-barWidth/2,y:y(row.value),width:barWidth,height:bottom-y(row.value),fill,stroke,'stroke-width':attr(outline,'w',12700)/12700}));if(child(column,"dataLabels"))content.push(styled(x(i),y(row.value)-3,row.value,labelStyle,{'text-anchor':'middle'}));const label=styled(x(i)+categoryStyle.size*.33,bottom+6,row.label.trim(),categoryStyle);Object.assign(label.attributes,{transform:`rotate(-90 ${x(i)+categoryStyle.size*.33} ${bottom+6})`,"text-anchor":"end"});const available=height-bottom-10;if(row.label.length*categoryStyle.size*.43>available)Object.assign(label.attributes,{textLength:available,lengthAdjust:"spacingAndGlyphs"});content.push(label);});
  content.push(el("polyline",{points:rows.map((row,i)=>{cumulative+=row.value;return`${x(i)},${bottom-cumulative/total*plotH}`}).join(" "),fill:"none",stroke:PALETTE[1],"stroke-width":1.5}));
  for(const axis of axes){const title=child(axis,"title");if(!title)continue;const value=deep(child(title,"tx"),"t").map(n=>n.textContent).join("")||deep(child(title,"tx"),"v").map(n=>n.textContent).join("");if(!value.trim())continue;const secondary=child(axis,"units")?.getAttribute("unit")==="percentage",tx=secondary?width-23:12,ty=top+plotH/2,style=textStyle(child(title,'txPr')||child(title,'tx'),theme,{size:9,bold:true}),label=styled(tx,ty,value.trim(),style);Object.assign(label.attributes,{transform:`rotate(-90 ${tx} ${ty})`,"text-anchor":"middle"});content.push(label);}
  // The multicol container uses RTL to place columns; it must not reverse SVG text anchors.
  const result=canvas(width,height,content);result.attributes["font-family"]="Times New Roman";result.attributes.direction="ltr";return result;
}
