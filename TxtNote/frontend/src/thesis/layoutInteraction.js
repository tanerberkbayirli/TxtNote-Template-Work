/** Pure helpers for the page-layout editor interaction lifecycle. */

export const DRAG_THRESHOLD_PX = 3;
export const MIN_LAYOUT_MM = 1;

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
