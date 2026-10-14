/** Picture properties of imported Word drawings (`wp:inline` / `wp:anchor` around a `pic:pic`).
 *
 * The reader turns size, crop (`a:srcRect`), text wrapping, anchor position and the alt text/title into plain `data-img-*`
 * attributes on the editor's <img>, so they survive HTML projection, copy/paste and the DOCX writer (`imageRuns.js`).
 * Units: `width`/`height` in CSS px (the picture's displayed, cropped extent); crop in thousandths of a percent
 * of the source picture (the OOXML unit); offsets in points. No docx dependency: the import worker uses this file. */

const EMU_PX = 9525, EMU_PT = 12700;
const elementsOf = (node) => Array.from(node?.childNodes || []).filter((n) => n.nodeType === 1);
const kid = (node, name) => elementsOf(node).find((n) => n.localName === name);
const deep = (node, name) => { const out = []; const walk = (n) => { for (const c of elementsOf(n)) { if (c.localName === name) out.push(c); walk(c); } }; if (node) walk(node); return out; };
const clampInt = (value) => { const n = Math.round(Number(value)); return Number.isFinite(n) ? Math.max(0, Math.min(100000, n)) : 0; };
const WRAPS = { wrapSquare: "square", wrapTight: "tight", wrapThrough: "through", wrapTopAndBottom: "topAndBottom", wrapNone: "none" };

/** The drawing's `wp:inline` / `wp:anchor` frame around a picture, or null. */
export function pictureFrame(drawing) {
  return elementsOf(drawing).find((n) => n.localName === "inline" || n.localName === "anchor") || null;
}

/** Attributes for the editor `<img>` of one `a:blip` inside `drawing`, from the frame it sits in (size, crop, wrap, anchor, alt). */
export function readPictureAttributes(drawing, blip) {
  const frame = pictureFrame(drawing) || drawing;
  const extent = kid(frame, "extent"), props = kid(frame, "docPr");
  const out = {};
  const cx = Number(extent?.getAttribute("cx")), cy = Number(extent?.getAttribute("cy"));
  if (cx > 0 && cy > 0) { out.width = String(Math.round(cx / EMU_PX * 100) / 100); out.height = String(Math.round(cy / EMU_PX * 100) / 100); }
  // `wp:effectExtent` (l,t,r,b in pt) is room Word reserves around an inline picture in its line (the top/bottom edges add to the line height).
  const effect = frame.localName === "inline" ? kid(frame, "effectExtent") : null;
  if (effect) {
    const edges = ["l", "t", "r", "b"].map((side) => Math.max(0, Math.round(Number(effect.getAttribute(side)) / EMU_PT * 100) / 100) || 0);
    if (edges.some(Boolean)) out["data-img-effect"] = edges.join(",");
  }
  const alt = props?.getAttribute("descr") || "", title = props?.getAttribute("title") || "";
  out.alt = alt || props?.getAttribute("name") || "";
  if (title) out.title = title;
  // The blipFill that owns this blip carries the crop rectangle.
  const fill = blip?.parentNode;
  const rect = fill ? kid(fill, "srcRect") : deep(frame, "srcRect")[0];
  if (rect) {
    const crop = ["l", "t", "r", "b"].map((side) => clampInt(rect.getAttribute(side)));
    if (crop.some(Boolean) && crop[0] + crop[2] < 100000 && crop[1] + crop[3] < 100000) {
      out["data-img-crop"] = crop.join(",");
      const [l, t, r, b] = crop.map((v) => Math.round(v / 10) / 100);
      out.style = `object-fit:fill;object-view-box:inset(${t}% ${r}% ${b}% ${l}%)`;
    }
  }
  if (frame.localName === "anchor") {
    const wrapNode = elementsOf(frame).find((n) => WRAPS[n.localName]);
    out["data-img-wrap"] = frame.getAttribute("behindDoc") === "1" ? "behind" : WRAPS[wrapNode?.localName] || "none";
    for (const [axis, key] of [["positionH", "data-img-h"], ["positionV", "data-img-v"]]) {
      const pos = kid(frame, axis);
      if (!pos) continue;
      const offset = kid(pos, "posOffset"), align = kid(pos, "align");
      const value = align ? align.textContent.trim() : String(Math.round(Number(offset?.textContent || 0) / EMU_PT * 100) / 100);
      out[key] = `${pos.getAttribute("relativeFrom") || ""}:${align ? "align" : "offset"}:${value}`;
    }
    for (const side of ["distT", "distB", "distL", "distR"]) {
      const v = Number(frame.getAttribute(side));
      if (v > 0) out[`data-img-${side}`] = String(Math.round(v / EMU_PT * 100) / 100);
    }
  }
  return out;
}

/** Crop thousandths-of-percent string "l,t,r,b" -> { l, t, r, b } or null. */
export function parseCrop(value) {
  const parts = String(value || "").split(",").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0) || parts[0] + parts[2] >= 100000 || parts[1] + parts[3] >= 100000) return null;
  const [l, t, r, b] = parts.map(Math.round);
  return l || t || r || b ? { l, t, r, b } : null;
}
