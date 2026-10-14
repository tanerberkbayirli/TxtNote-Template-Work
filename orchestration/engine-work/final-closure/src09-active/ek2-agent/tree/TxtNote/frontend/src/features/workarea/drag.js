/**
 * Drag payload for tabs and sidebar rows heading into the work area.
 * Custom MIME types are not always listed during dragover, so the live
 * payload is also kept in memory for same-window drops.
 */

export const ITEM_DRAG_TYPE = "application/x-txtnote-item";

let liveDragItem = null;
let liveDragEpoch = 0;

const snapshotItem = (item) => ({
  id: item.id,
  workspaceId: item.workspaceId,
  title: item.title,
  type: item.type,
  noteType: item.noteType,
  parentId: item.parentId,
  fileKind: item.fileKind,
  fileName: item.fileName,
  fileSize: item.fileSize,
  mimeType: item.mimeType,
  url: item.url,
});

export const writeDragItem = (event, item) => {
  if (!item?.id) return;
  liveDragEpoch += 1;
  liveDragItem = snapshotItem(item);
  event.dataTransfer.setData(ITEM_DRAG_TYPE, JSON.stringify(liveDragItem));
  // Some WebView2 builds ignore a drag that has no text/plain payload.
  event.dataTransfer.setData("text/plain", `txtnote:${item.id}`);
  event.dataTransfer.effectAllowed = "copyMove";
};

/** Pointer-based tab drags have no dataTransfer; keep the same live payload. */
export const beginLiveDrag = (item) => {
  if (!item?.id) return;
  liveDragEpoch += 1;
  liveDragItem = snapshotItem(item);
};

export const getLiveDragItem = () => liveDragItem;

export const clearDragItem = () => {
  liveDragEpoch += 1;
  liveDragItem = null;
};

/** WebView2 can fire dragend before drop; keep the payload for the drop handler. */
export const clearDragItemSoon = () => {
  const epoch = liveDragEpoch;
  window.setTimeout(() => {
    if (liveDragEpoch === epoch) {
      liveDragItem = null;
    }
  }, 50);
};

export const readDragItem = (event) => {
  if (liveDragItem) return liveDragItem;
  const raw = event.dataTransfer.getData(ITEM_DRAG_TYPE) || event.dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    if (raw.startsWith("{")) return JSON.parse(raw);
  } catch {
    /* plain id */
  }
  if (raw.startsWith("txtnote:")) return { id: raw.slice("txtnote:".length) };
  return { id: raw };
};

export const hasDragItem = (event) =>
  Boolean(liveDragItem) ||
  [...(event.dataTransfer?.types ?? [])].includes(ITEM_DRAG_TYPE);

/** Which third of the pane the pointer is in. */
export const hitSplitEdge = (event, element) => {
  if (!element) return "center";
  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return "center";
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const band = 0.3;
  const left = x;
  const right = 1 - x;
  const top = y;
  const bottom = 1 - y;
  const nearest = Math.min(left, right, top, bottom);
  if (nearest > band) return "center";
  if (nearest === left) return "left";
  if (nearest === right) return "right";
  if (nearest === top) return "top";
  return "bottom";
};
