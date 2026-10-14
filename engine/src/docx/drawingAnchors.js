/** Resolve page/margin anchors against the sheet containing their paragraph.
 * This is a display-only stylesheet: no measured position enters saved content.
 */
import { flowPagePitchPx, pageMetrics } from "../pageLayout.js";

const PT_MM = 72 / 25.4;
const SAFE_ID = /^[\w:-]+$/;
const SHEET = new Set(["page", "margin", "topMargin", "bottomMargin", "leftMargin", "rightMargin", "insideMargin", "outsideMargin"]);
// A paragraph may start slightly above the nominal content margin when its
// leading guard collapses. It still belongs to this physical sheet.
export const drawingPageIndex = (y, pitch) => Math.max(0, Math.floor((y + .5) / pitch));
export function drawingAnchorOffset(shape, page, { paragraphLeftPt, paragraphTopPt, evenPage = false }) {
  const margins = page.docxMargins || page.margins, width = page.widthMm * PT_MM, height = page.heightMm * PT_MM;
  const left = margins.leftMm * PT_MM, right = width - margins.rightMm * PT_MM, top = margins.topMm * PT_MM, bottom = height - margins.bottomMm * PT_MM;
  const axis = (position = {}, size, horizontal, origin) => {
    if (!SHEET.has(position.relativeFrom)) return undefined;
    let a = 0, b = horizontal ? width : height;
    const from = position.relativeFrom;
    if (from === "margin") { a = horizontal ? left : top; b = horizontal ? right : bottom; }
    else if (from === "topMargin") b = top;
    else if (from === "bottomMargin") a = bottom;
    else if (from === "leftMargin" || from === "insideMargin" && !evenPage || from === "outsideMargin" && evenPage) b = left;
    else if (from === "rightMargin" || from === "insideMargin" && evenPage || from === "outsideMargin" && !evenPage) a = right;
    let align = position.align;
    if (align === "inside") align = evenPage ? "right" : "left";
    if (align === "outside") align = evenPage ? "left" : "right";
    return (align === "center" ? (a + b - size) / 2 : ["right", "bottom"].includes(align) ? b - size : a + (position.offsetPt || 0)) - origin;
  };
  return { leftPt: axis(shape.horizontal, shape.widthPt, true, paragraphLeftPt), topPt: axis(shape.vertical, shape.heightPt, false, paragraphTopPt) };
}

export function layoutImportedDrawingAnchors(root, groups, nativeDocument) {
  if (!root) return "";
  if (nativeDocument?.source?.format !== "docx") { root.querySelector("style[data-thesis-drawing-anchors]")?.remove(); return ""; }
  const byId = new Map();
  const walk = (nodes) => { for (const n of nodes || []) { if (n.type === "drawing" && n.properties?.shape) byId.set(n.id, n.properties.shape); walk(n.children); } };
  nativeDocument.sections.forEach((s) => walk(s.nodes));
  const rules = [];
  for (const group of groups) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    if (!article) continue;
    const page = group.rules.page, metrics = pageMetrics(page), rect = article.getBoundingClientRect();
    const sheets = Array.from(article.parentElement?.querySelectorAll(".thesis-sheets > .thesis-sheet[data-thesis-page]") || []);
    const scale = article.offsetWidth ? rect.width / article.offsetWidth || 1 : 1, pitch = flowPagePitchPx(metrics), pxPt = 72 / 96;
    for (const element of article.querySelectorAll('[data-native-object="drawing"][data-txt-node-id]')) {
      const id = element.getAttribute("data-txt-node-id"), shape = byId.get(id);
      if (!SAFE_ID.test(id) || shape?.kind !== "anchor" || shape.wrap === "topAndBottom") continue;
      const paragraph = element.closest("p,h1,h2,h3,h4,h5,h6,li");
      if (!paragraph) continue;
      const box = paragraph.getBoundingClientRect(), y = (box.top - rect.top) / scale;
      const pageIndex = drawingPageIndex(y, pitch);
      const physicalPage = Number(sheets[pageIndex]?.getAttribute("data-thesis-page")) || pageIndex + 1;
      const offset = drawingAnchorOffset(shape, page, { paragraphLeftPt: (box.left - rect.left) / scale * pxPt, paragraphTopPt: (y - pageIndex * pitch) * pxPt, evenPage: physicalPage % 2 === 0 });
      const declarations = [];
      if (Number.isFinite(offset.leftPt)) declarations.push(`left:${offset.leftPt.toFixed(3)}pt!important`);
      if (Number.isFinite(offset.topPt)) declarations.push(`top:${offset.topPt.toFixed(3)}pt!important`);
      const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(`txn-${id}`) : `txn-${id}`.replace(/([^\w-])/g, "\\$1");
      if (declarations.length) rules.push(`.thesis-paper .thesis-body .${escaped}{${declarations.join(";")}}`);
    }
  }
  let sheet = root.querySelector("style[data-thesis-drawing-anchors]");
  const css = rules.join("\n");
  if (!sheet && css) { sheet = root.ownerDocument.createElement("style"); sheet.setAttribute("data-thesis-drawing-anchors", ""); root.append(sheet); }
  if (sheet && sheet.textContent !== css) sheet.textContent = css;
  return css;
}
