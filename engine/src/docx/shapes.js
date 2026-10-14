/** DrawingML / VML shape geometry for imported Word drawings (presentation only).
 *
 * The importer keeps the drawing's source XML in the package (the DOCX export writes the original parts) and the
 * text-box paragraphs as children of the `drawing` node. This module reads the frame Word lays the drawing out in
 * (extent, anchor offsets, wrap mode, simple fill/line/geometry, text-box insets) into plain JSON
 * (`properties.shape`), and turns it into node-id keyed CSS so the editor page reserves the same space as Word:
 * an inline drawing occupies its extent in the line, a floating (anchored) one takes no flow space and is drawn
 * at its offset from the anchor paragraph, top-and-bottom wrapping reserves its height. Nothing is written into
 * note.content: the rules are generated from the model like the other imported-content CSS. */

import { resolveLineSpacing } from "../typography.js";

const EMU_PT = 12700;
const elementsOf = (node) => Array.from(node?.childNodes || []).filter(n => n.nodeType === 1);
const kid = (node, name) => elementsOf(node).find(n => n.localName === name);
const deep = (node, predicate) => { const out = []; const walk = n => { for (const c of elementsOf(n)) { if (predicate(c)) out.push(c); walk(c); } }; if (node) walk(node); return out; };
const emuPt = (value) => { const n = Number(value); return Number.isFinite(n) ? Math.round(n / EMU_PT * 100) / 100 : undefined; };
// Text/background aliases of the theme's dark/light slots (DrawingML schemeClr values).
const SCHEME_ALIAS = { tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" };
const color = (fillNode, theme = {}) => {
  const rgb = kid(fillNode, "srgbClr")?.getAttribute("val");
  if (/^[0-9a-f]{6}$/i.test(rgb || "")) return "#"+rgb.toLowerCase();
  const scheme = kid(fillNode, "schemeClr")?.getAttribute("val");
  return scheme ? theme[scheme] || theme[SCHEME_ALIAS[scheme]] : undefined;
};

function readSpPr(spPr, theme) {
  if (!spPr) return {};
  const out = {}, geom = kid(spPr, "prstGeom")?.getAttribute("prst");
  if (geom) out.geometry = geom;
  if (kid(spPr, "noFill")) out.fill = "none";
  else { const c = color(kid(spPr, "solidFill"), theme); if (c) out.fill = c; }
  const ln = kid(spPr, "ln");
  if (ln) {
    if (kid(ln, "noFill")) out.line = "none";
    else { const c = color(kid(ln, "solidFill"), theme); if (c) out.line = c; }
    const w = emuPt(ln.getAttribute("w")); if (w !== undefined) out.lineWidthPt = w;
  }
  return out;
}

function position(node) {
  if (!node) return {};
  const offset = kid(node, "posOffset"), align = kid(node, "align");
  return { relativeFrom: node.getAttribute("relativeFrom") || "", ...(offset ? { offsetPt: emuPt(offset.textContent) } : {}), ...(align ? { align: align.textContent.trim() } : {}) };
}

function readDrawingMl(container, theme) {
  const frame = kid(container, "anchor") || kid(container, "inline");
  if (!frame) return null;
  const extent = kid(frame, "extent"), widthPt = emuPt(extent?.getAttribute("cx")), heightPt = emuPt(extent?.getAttribute("cy"));
  if (!(widthPt >= 0) || !(heightPt >= 0)) return null;
  const graphicData = deep(frame, n => n.localName === "graphicData")[0];
  const uri = (graphicData?.getAttribute("uri") || "").split("/").pop();
  const shapes = deep(frame, n => n.localName === "wsp");
  const shape = { kind: frame.localName, widthPt, heightPt, graphic: uri, shapes: shapes.length, hasText: deep(frame, n => n.localName === "txbxContent").length > 0 };
  if (frame.localName === "anchor") {
    shape.wrap = (elementsOf(frame).find(n => /^wrap/.test(n.localName))?.localName || "wrapNone").replace(/^wrap/, "").replace(/^./, c => c.toLowerCase());
    shape.behind = /^(?:1|true)$/.test(frame.getAttribute("behindDoc") || "");
    shape.horizontal = position(kid(frame, "positionH"));
    shape.vertical = position(kid(frame, "positionV"));
    if (["topAndBottom", "square", "tight", "through"].includes(shape.wrap)) shape.distPt = ["distT", "distR", "distB", "distL"].map(name => emuPt(frame.getAttribute(name)) || 0);
  }
  if (shapes.length === 1) {
    Object.assign(shape, readSpPr(kid(shapes[0], "spPr"), theme));
    // Shape style references (Word's default shape style: fillRef/lnRef of accent1) resolve through the document theme.
    const style = kid(shapes[0], "style");
    if (style && !shape.fill && Number(kid(style, "fillRef")?.getAttribute("idx")) > 0) { const c = color(kid(style, "fillRef"), theme); if (c) shape.fill = c; }
    if (style && !shape.line && Number(kid(style, "lnRef")?.getAttribute("idx")) > 0) shape.line = color(kid(style, "lnRef"), theme) || "style";
    const body = kid(shapes[0], "bodyPr");
    if (body) {
      const inset = (name, fallback) => body.hasAttribute(name) ? emuPt(body.getAttribute(name)) : fallback;
      shape.insetPt = [inset("tIns", 3.6), inset("rIns", 7.2), inset("bIns", 3.6), inset("lIns", 7.2)];
      const anchor = body.getAttribute("anchor"); if (anchor) shape.textAnchor = anchor;
      if (kid(body, "spAutoFit")) shape.autoFit = "shape";
      if (body.hasAttribute("vertOverflow")) shape.textOverflow = body.getAttribute("vertOverflow");
      if (body.hasAttribute("spcFirstLastPara")) shape.spaceFirstLastParagraph = /^(?:1|true)$/.test(body.getAttribute("spcFirstLastPara"));
    }
  }
  return shape;
}

const cssLength = (value) => {
  const m = /^(-?[\d.]+)\s*(pt|in|cm|mm|px|)$/.exec(String(value || "").trim());
  if (!m) return undefined;
  const n = Number(m[1]), unit = m[2] || "px";
  const pt = unit === "pt" ? n : unit === "in" ? n * 72 : unit === "cm" ? n * 72 / 2.54 : unit === "mm" ? n * 72 / 25.4 : n * 0.75;
  return Math.round(pt * 100) / 100;
};

/** VML (`w:pict`, or the `mc:Fallback` of old files): the first styled shape gives the frame. */
function readVml(pict) {
  const styled = deep(pict, n => /^(?:shape|rect|roundrect|oval|group|line)$/.test(n.localName) && /width/.test(n.getAttribute("style") || ""))[0];
  if (!styled) return null;
  const style = Object.fromEntries((styled.getAttribute("style") || "").split(";").map(s => s.split(":").map(x => x.trim())).filter(p => p.length === 2));
  const widthPt = cssLength(style.width), heightPt = cssLength(style.height);
  if (!(widthPt >= 0) || !(heightPt >= 0)) return null;
  const floating = style.position === "absolute";
  const shape = { kind: floating ? "anchor" : "inline", widthPt, heightPt, graphic: "vml", shapes: deep(pict, n => n.localName === "textbox").length || 1, hasText: deep(pict, n => n.localName === "txbxContent").length > 0 };
  if (floating) {
    const wrap = deep(styled, n => n.localName === "wrap")[0]?.getAttribute("type");
    shape.wrap = wrap === "topAndBottom" ? "topAndBottom" : wrap === "square" || wrap === "tight" ? "square" : "none";
    shape.horizontal = { relativeFrom: style["mso-position-horizontal-relative"] || "column", offsetPt: cssLength(style["margin-left"]) ?? 0, ...(style["mso-position-horizontal"] && style["mso-position-horizontal"] !== "absolute" ? { align: style["mso-position-horizontal"] } : {}) };
    shape.vertical = { relativeFrom: style["mso-position-vertical-relative"] || "paragraph", offsetPt: cssLength(style["margin-top"]) ?? 0 };
  }
  const fill = styled.getAttribute("fillcolor"), stroke = styled.getAttribute("strokecolor");
  if (/^#[0-9a-f]{6}$/i.test(fill || "")) shape.fill = fill.toLowerCase();
  if (styled.getAttribute("filled") === "f") shape.fill = "none";
  if (/^#[0-9a-f]{6}$/i.test(stroke || "")) shape.line = stroke.toLowerCase();
  if (styled.getAttribute("stroked") === "f") shape.line = "none";
  return shape;
}

/** Frame of a `w:drawing` / `w:pict` / `w:object` element, or null when it cannot be read. `theme`: clrScheme slot → #rrggbb. */
export function readDrawingShape(node, theme = {}) {
  try {
    if (node?.localName === "drawing") return readDrawingMl(node, theme);
    if (node?.localName === "pict" || node?.localName === "object") return readVml(node);
  } catch { /* presentation metadata only: an unreadable frame keeps the old inline behaviour */ }
  return null;
}

const SAFE_ID = /^[\w:-]+$/;
const pt = (n) => `${Math.round(n * 100) / 100}pt`;
const sel = (id) => `.thesis-paper .thesis-body [data-txt-node-id="${id}"][data-txt-node-id]`;
const VERTICAL_FROM_ANCHOR = new Set(["paragraph", "line", "text", ""]);

/**
 * A wrapping frame as wide as the column excludes every text line in its band.
 * The frame still remains anchored outside flow; drawingWrap displaces lines
 * while keeping the paragraph origin available to other drawings.
 */
export const blocksTextBeside = (shape, textWidthPt) => shape?.kind === "anchor" && ["square", "tight", "through"].includes(shape.wrap) && textWidthPt > 0
  && textWidthPt - shape.widthPt - ((shape.distPt?.[1] || 0) + (shape.distPt?.[3] || 0)) < 24;
// Square wrapping displaces a paragraph's lines, not its anchor. Even a
// column-wide frame must stay absolute; drawingWrap reserves the blocked lines.
export const floatsOutOfFlow = (shape) => shape?.kind === "anchor" && shape.wrap !== "topAndBottom";

function frameDecl(shape) {
  const out = ["box-sizing:border-box", "text-indent:0"];
  const lineWidth = shape.lineWidthPt > 0 ? shape.lineWidthPt : 0.75;
  if (shape.fill && shape.fill !== "none") out.push(`background-color:${shape.fill}`);
  const line = shape.line === "style" ? "#4472c4" : shape.line;
  const lineGeometry = /line|Connector/i.test(shape.geometry || "");
  if (line && line !== "none") out.push(lineGeometry ? `border-${shape.heightPt > shape.widthPt ? "left" : "top"}:${pt(lineWidth)} solid ${line}` : `border:${pt(lineWidth)} solid ${line}`);
  else if (!shape.hasPreview && (!shape.shapes || shape.shapes > 1 || (!shape.hasText && shape.graphic !== "picture" && shape.graphic !== "wordprocessingShape"))) out.push("outline:0.5pt dashed #9aa0a6");
  if (shape.geometry === "ellipse") out.push("border-radius:50%");
  else if (/^round/.test(shape.geometry || "")) out.push("border-radius:12%");
  if (shape.insetPt) out.push(`padding:${shape.insetPt.map(pt).join(" ")}`);
  if (shape.placeholder) out.push("overflow:hidden");
  if (shape.hasText && !shape.hasPreview) out.push(`overflow:${shape.textOverflow === "overflow" ? "visible" : "hidden"}`, "display:flex", "flex-direction:column", `justify-content:${shape.textAnchor === "ctr" ? "center" : shape.textAnchor === "b" ? "flex-end" : "flex-start"}`);
  return out;
}

/** Node-id keyed rules for every drawing with a readable frame in an imported document's body. */
export function importedShapeCss(document) {
  if (!["docx"].includes(document?.source?.format)) return [];
  const rules = [], anchorParagraphs = new Map(), strutParagraphs = [];
  let textWidth = 0;
  const styleOf = (node) => document.formatMode === "source" ? node.properties?.resolvedSource : node.properties?.direct;
  const hasFlowContent = (node) => {
    // A drawing whose frame could not be read (the visible fallback of an mc:AlternateContent whose twin is the floating shape) draws
    // nothing in flow by itself: only what it contains counts.
    if (node.type === "drawing" && node.properties?.shape) return !floatsOutOfFlow(node.properties.shape, textWidth);
    if (node.type === "text") return /[^\s​]/.test(node.text || "");
    if (["tab", "break", "image", "equation"].includes(node.type)) return true;
    if (node.attributes && Object.hasOwn(node.attributes, "hidden")) return false;
    return (node.children || []).some(hasFlowContent);
  };
  let base = {};
  const walk = (nodes, paragraph) => {
    for (const node of nodes || []) {
      if (node.attributes && Object.hasOwn(node.attributes, "hidden")) continue;
      const shape = node.type === "drawing" ? node.properties?.shape : null;
      if (shape && node.id && SAFE_ID.test(node.id)) {
        const decl = [...frameDecl(shape), `width:${pt(shape.widthPt)}`, `height:${pt(shape.heightPt)}`];
        // A text box is its own Word story. An omitted run property inherits
        // document defaults, not bold/italic/case from its body anchor paragraph.
        // Explicit source paragraph/run rules below still override these defaults.
        if (shape.hasText && document.formatMode === 'source') {
          const defaults = document.styles?.default?.run || document.styles?.default?.properties || {};
          decl.push(`font-weight:${defaults.bold === true ? 700 : 400}`, `font-style:${defaults.italic === true ? 'italic' : 'normal'}`, 'text-transform:none');
        }
        if (shape.autoFit === "shape" && shape.hasText && !shape.hasPreview && shape.shapes === 1) decl.push("height:auto");
        if (floatsOutOfFlow(shape, textWidth)) {
          const h = shape.horizontal || {}, v = shape.vertical || {};
          const left = h.align === "center" ? `calc(50% - ${pt(shape.widthPt / 2)})` : h.align === "right" ? `calc(100% - ${pt(shape.widthPt)})` : pt(h.align === "left" ? 0 : h.offsetPt || 0);
          const top = VERTICAL_FROM_ANCHOR.has(v.relativeFrom) && !v.align ? pt(v.offsetPt || 0) : "0pt";
          decl.unshift("position:absolute", "display:block", `left:${left}`, `top:${top}`, `z-index:${shape.behind ? 0 : 1}`);
          if (paragraph?.id && SAFE_ID.test(paragraph.id)) anchorParagraphs.set(paragraph, base);
        } else if (shape.kind === "anchor") {
          // Top-and-bottom wrapping: no text beside the shape, so it is an in-flow block of its own height. Text after it
          // starts below its bottom edge plus distB. Its vertical offset from the anchor paragraph moves that edge (a negative
          // one overlaps the content above, as in Word); page/margin-relative positions cannot be honoured in flow and keep
          // the block at the anchor (a documented limit: Word would put the band at that page position instead).
          const h = shape.horizontal || {}, v = shape.vertical || {}, dist = shape.distPt || [0, 0, 0, 0];
          const fromParagraph = VERTICAL_FROM_ANCHOR.has(v.relativeFrom) && !v.align;
          decl.unshift("display:block", "position:relative", h.align === "center" ? "margin-left:auto;margin-right:auto" : h.align === "right" ? "margin-left:auto;margin-right:0" : `margin-left:${pt(h.offsetPt || 0)}`,
            `margin-top:${pt(fromParagraph ? v.offsetPt || 0 : 0)}`, `margin-bottom:${pt(dist[2] || 0)}`);
        } else if (!deep_has_image(node)) {
          decl.unshift("display:inline-block", "vertical-align:baseline");
        } else { walk(node.children, paragraph); continue; }
        rules.push(`${sel(node.id)}{${decl.join(";")}}`);
        if (shape.hasText) rules.push(`${sel(node.id)} [data-docx-box-block]{display:block}`);
        if (shape.spaceFirstLastParagraph === false) rules.push(`${sel(node.id)} > [data-docx-box-block]:first-child{margin-top:0!important}`, `${sel(node.id)} > [data-docx-box-block]:last-child{margin-bottom:0!important}`);
      }
      walk(node.children, node.type === "paragraph" && !paragraph ? node : paragraph);
    }
  };
  document.sections?.forEach(section => {
    base = section.properties?.rules?.body || {};
    const page = section.properties?.rules?.page, margins = page?.docxMargins || page?.margins;
    textWidth = page && margins ? (page.widthMm - (margins.leftMm || 0) - (margins.rightMm || 0)) * 72 / 25.4 : 0;
    walk(section.nodes, null);
  });
  for (const [paragraph, sectionBase] of anchorParagraphs) {
    const decl = ["position:relative"];
    if (!hasFlowContent(paragraph)) {
      strutParagraphs.push(paragraph.id);
      // Word sizes such a line from its text runs (spaces included) or, without any, from the paragraph mark; a run that holds
      // only a floating shape adds no height. The projected line-height comes from the style size and only ever grows.
      const style = styleOf(paragraph) || {}, styleSize = style.fontSizePt || sectionBase.fontSizePt || 12;
      const sizes = textRunSizes(paragraph, styleOf), size = sizes.length ? Math.max(...sizes) : paragraph.properties?.paragraphMarkRun?.fontSizePt;
      if (size > 0 && size < styleSize && style.lineSpacing) {
        try { decl.push(`line-height:${pt(resolveLineSpacing({ ...sectionBase, ...style, fontSizePt: size }, { mode: "word", ...style.lineSpacing }).pitchPt)}`); } catch { /* unknown font metrics: keep the style line */ }
      }
    }
    rules.push(`${sel(paragraph.id)}{${decl.join(";")}}`);
  }
  // A paragraph holding only floating shapes is one empty line in Word (its mark); the shapes no longer give it a line box.
  for (let at = 0; at < strutParagraphs.length; at += 200) rules.push(`${strutParagraphs.slice(at, at + 200).map(id => `.thesis-body [data-txt-node-id="${id}"]::before`).join(",")}{content:"\\200b"}`);
  return rules;
}

function textRunSizes(paragraph, styleOf) {
  const sizes = [];
  const visit = (node) => {
    for (const c of node.children || []) {
      if (c.type === "drawing" || c.type === "paragraph" || (c.attributes && Object.hasOwn(c.attributes, "hidden"))) continue;
      if (c.type === "run" && (c.children || []).some(t => t.type === "textRun" && (t.children || []).some(x => x.type === "text" && x.text))) {
        const size = styleOf(c)?.fontSizePt; if (size > 0) sizes.push(size);
      }
      visit(c);
    }
  };
  visit(paragraph);
  return sizes;
}

function deep_has_image(node) {
  return (node.children || []).some(c => c.type === "image" || deep_has_image(c));
}
