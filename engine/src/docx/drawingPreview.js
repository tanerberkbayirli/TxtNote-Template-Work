/** Safe SVG views of cached DrawingML groups/SmartArt and cached chart series.
 * Only known geometry, finite coordinates, validated colors and text enter the view.
 */
const kids = (n) => Array.from(n?.childNodes || []).filter((c) => c.nodeType === 1);
const child = (n, name) => kids(n).find((c) => c.localName === name);
const deep = (n, name) => kids(n).flatMap((c) => [...(c.localName === name ? [c] : []), ...deep(c, name)]);
const attr = (n, key, fallback = 0) => { const v = Number(n?.getAttribute(key)); return Number.isFinite(v) ? v : fallback; };
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
  return result;
}
function color(fill, theme, fallback) {
  const rgb = child(fill, "srgbClr"), scheme = child(fill, "schemeClr");
  if (/^[\da-f]{6}$/i.test(rgb?.getAttribute("val") || "")) return "#" + rgb.getAttribute("val");
  const key = scheme?.getAttribute("val");
  return theme[key] || theme[{ tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" }[key]] || fallback;
}
const canvas = (width, height, children) => el("svg", { xmlns: "http://www.w3.org/2000/svg", width: "100%", height: "100%", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": "Word çizimi" }, children);

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
      const paragraphs = [...deep(node, "p")].map((p) => deep(p, "t").map((t) => t.textContent).join("")).filter(Boolean);
      paragraphs.forEach((p, i) => body.push(text(x + 4, y + 12 + i * 12, p, 10)));
      return body;
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

export function chartPreview(root, shape, theme = {}) {
  if (root?.namespaceURI === "http://schemas.microsoft.com/office/drawing/2014/chartex") return paretoPreview(root, shape, theme);
  const chart = deep(root, "plotArea")[0];
  if (!chart) return null;
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
  const niceStep = value => {const power=10**Math.floor(Math.log10(value));return [1,2,5,10].find(n => n*power>=value)*power;};
  const step=niceStep(rows[0].value/6), max=Math.ceil(rows[0].value/step)*step;
  if (![step,max].every(Number.isFinite) || !(step > 0 && max > 0 && max/step <= 100)) return null;
  const left=38,right=70,top=33,labelRoom=Math.min(height*.28,Math.max(50,...rows.map(r=>r.label.length*3+12))),bottom=height-labelRoom,plotW=width-left-right,plotH=bottom-top;
  if (!(plotW > 0 && plotH > 0)) return null;
  const x=i=>left+plotW*(i+.5)/rows.length,y=v=>bottom-v/max*plotH;
  const content=[el("rect",{x:0,y:0,width,height,fill:"#ffffff"})];
  const titleNode=child(child(root,"chart"),"title"),title=deep(titleNode,"t").map(n=>n.textContent).join("").trim();
  if(title){const label=text(width/2,19,title,12);Object.assign(label.attributes,{"text-anchor":"middle","font-weight":"bold","letter-spacing":1.5});if(deep(titleNode,"defRPr").some(n=>n.getAttribute("cap")==="all"))label.children=[{text:title.toLocaleUpperCase("tr-TR")}];content.push(label);}
  for(let v=0;v<=max;v+=step){const py=y(v);content.push(el("line",{x1:left,y1:py,x2:left+plotW,y2:py,stroke:"#d9d9d9","stroke-width":.5}));const label=text(left-6,py+2,v,8);label.attributes["text-anchor"]="end";content.push(label);}
  for(let v=0;v<=100;v+=10)content.push(text(left+plotW+7,bottom-v/100*plotH+2,`${v}%`,8));
  const fill=color(child(child(column,"spPr"),"solidFill"),theme,PALETTE[0]);let cumulative=0;
  const gap=Number(child(deep(root,"axis").find(n=>child(n,"catScaling")),"catScaling")?.getAttribute("gapWidth"));
  const barWidth=plotW/rows.length/(1+(Number.isFinite(gap)&&gap>=0?gap:1.5));
  rows.forEach((row,i)=>{content.push(el("rect",{x:x(i)-barWidth/2,y:y(row.value),width:barWidth,height:bottom-y(row.value),fill}));if(child(column,"dataLabels")){const label=text(x(i),y(row.value)-3,row.value,8);label.attributes["text-anchor"]="middle";content.push(label);}const label=text(x(i)+2,bottom+6,row.label.trim(),7);Object.assign(label.attributes,{transform:`rotate(-90 ${x(i)+2} ${bottom+6})`,"text-anchor":"end"});const available=height-bottom-10;if(row.label.length*3.5>available)Object.assign(label.attributes,{textLength:available,lengthAdjust:"spacingAndGlyphs"});content.push(label);});
  content.push(el("polyline",{points:rows.map((row,i)=>{cumulative+=row.value;return`${x(i)},${bottom-cumulative/total*plotH}`}).join(" "),fill:"none",stroke:PALETTE[1],"stroke-width":1.5}));
  for(const axis of deep(root,"axis")){const title=child(axis,"title");if(!title)continue;const value=deep(child(title,"tx"),"t").map(n=>n.textContent).join("")||deep(child(title,"tx"),"v").map(n=>n.textContent).join("");if(!value.trim())continue;const secondary=child(axis,"units")?.getAttribute("unit")==="percentage",tx=secondary?width-23:12,ty=top+plotH/2,label=text(tx,ty,value.trim(),9);Object.assign(label.attributes,{transform:`rotate(${secondary?90:-90} ${tx} ${ty})`,"text-anchor":"middle","font-weight":"bold"});content.push(label);}
  // The multicol container uses RTL to place columns; it must not reverse SVG text anchors.
  const result=canvas(width,height,content);result.attributes["font-family"]="Times New Roman";result.attributes.direction="ltr";return result;
}
