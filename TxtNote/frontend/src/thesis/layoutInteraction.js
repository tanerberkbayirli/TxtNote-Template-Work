/** Pure helpers for the page-layout editor interaction lifecycle. */

export const DRAG_THRESHOLD_PX = 3;
export const MIN_LAYOUT_MM = 1;

/** Toggle one decoration without clearing another active decoration. */
export function toggleLayoutDecoration(value, line, enabled) {
  const lines = new Set(String(value || "none").split(/\s+/).filter((part) => part !== "none"));
  const next = enabled ?? !lines.has(line);
  if (next) lines.add(line); else lines.delete(line);
  return ["underline", "overline", "line-through"].filter((part) => lines.has(part)).join(" ") || "none";
}

/** A user's text alignment can target the page writing area or the existing box.
 * Template geometry is untouched until the user issues the command.
 */
export function textAlignmentPatch(item, align, scope = "page") {
  if (!["left", "center", "right", "justify"].includes(align) || !["page", "box"].includes(scope)
    || !item || item.type !== "text" || item.locked || !item.editableLayout || !item.editableContent) return null;
  const patch = { id: item.id, style: { align } };
  if (scope === "box") return patch;
  const page = item.page;
  const left = page?.margins?.leftMm;
  const right = page?.margins?.rightMm;
  const width = page?.widthMm - left - right;
  const yMm = item.measuredGeometry?.yMm ?? item.yMm;
  if (![left, right, width, yMm].every(Number.isFinite) || width <= 0) return null;
  // Keep the vertical position/flow slot while making the text a page-wide paragraph.
  // Remove box-local indents so they cannot defeat the requested page alignment.
  return { ...patch, layoutMode: "absolute", xMm: left, yMm, widthMm: width,
    style: { align, firstLineIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0 } };
}

export function clampResizeRect(start, handle, dxMm, dyMm, keepAspect = false) {
  let widthMm = Math.max(MIN_LAYOUT_MM, start.widthMm + (handle.includes("e") ? dxMm : handle.includes("w") ? -dxMm : 0));
  let heightMm = Math.max(MIN_LAYOUT_MM, start.heightMm + (handle.includes("s") ? dyMm : handle.includes("n") ? -dyMm : 0));
  if (keepAspect && start.widthMm > 0 && start.heightMm > 0) {
    const ratio = start.widthMm / start.heightMm;
    if (Math.abs(widthMm - start.widthMm) >= Math.abs(heightMm - start.heightMm) * ratio) heightMm = Math.max(MIN_LAYOUT_MM, widthMm / ratio);
    else widthMm = Math.max(MIN_LAYOUT_MM, heightMm * ratio);
  }
  const xMm = start.xMm + (handle.includes("w") ? start.widthMm - widthMm : 0);
  const yMm = start.yMm + (handle.includes("n") ? start.heightMm - heightMm : 0);
  return { ...start, xMm, yMm, widthMm, heightMm };
}

export function makeHistoryEntry(previous, next) {
  return previous === next ? null : { before: previous, after: next };
}

export function pageLocalRect(rect, pageIndex, pagePitchMm) {
  return { ...rect, yMm: rect.yMm - pageIndex * pagePitchMm, pageIndex };
}

export function patchesForRects(before, after) {
  const changed = new Map(after.map((rect) => [rect.id, rect]));
  return before.flatMap((old) => {
    const next = changed.get(old.id);
    if (!next || (old.xMm === next.xMm && old.yMm === next.yMm && old.widthMm === next.widthMm && old.heightMm === next.heightMm)) return [];
    return [{ id: old.id, xMm: next.xMm, yMm: next.yMm, widthMm: next.widthMm, heightMm: next.heightMm }];
  });
}
