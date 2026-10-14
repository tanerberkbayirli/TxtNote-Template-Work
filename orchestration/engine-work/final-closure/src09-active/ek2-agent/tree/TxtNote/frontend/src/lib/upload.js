/**
 * Turning a picked `File` into a sidebar item.
 *
 * Bytes may live in IndexedDB, on disk, behind a file-picker handle, or only
 * for this session. `url` is always a temporary object URL — it is stripped
 * before anything is written to disk.
 */

import { stampCreated } from "./entity.js";
import { detectFileKind, getFileExtension, mimeFromExtension, titleFromFileName } from "./fileType.js";
import { createId } from "./id.js";

/** Item type for anything that came in through the file picker. */
export const ITEM_TYPE_FILE = "file";

/**
 * An object URL, not a data URL: a 20 MB video as base64 would be a 27 MB
 * string sitting in React state.
 */
const createPreviewUrl = (file) => {
  try {
    if (!file) return null;
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
};

/** Everything the sidebar, the tab bar and the canvas need to draw the file. */
export const createUploadedItem = (file, workspaceId, extra = {}) => {
  const fileName = extra.fileName || file?.name || "Adsız dosya";
  const mimeType = extra.mimeType || file?.type || mimeFromExtension(fileName) || "";
  const fileSize = Number.isFinite(extra.fileSize) ? extra.fileSize : file?.size ?? 0;
  return stampCreated({
    id: extra.id || createId("itm"),
    workspaceId,
    title: extra.title || titleFromFileName(fileName),
    type: ITEM_TYPE_FILE,
    fileKind: extra.fileKind || detectFileKind({ name: fileName, type: mimeType }),
    fileName,
    fileExtension: extra.fileExtension || getFileExtension(fileName),
    fileSize,
    mimeType,
    url: extra.url !== undefined ? extra.url : createPreviewUrl(file),
    parentId: extra.parentId ?? null,
    relativePath: extra.relativePath || "",
    storageMode: extra.storageMode || "inline",
    accessKind: extra.accessKind || "session",
    mediaPath: extra.mediaPath || null,
    persistentAccess: extra.persistentAccess ?? false,
    needsReselect: extra.needsReselect ?? false,
    encoding: extra.encoding || null,
    isPinned: false,
    isPrivate: false,
    isFavorite: false,
  });
};

export const tabFieldsFromItem = (item) => {
  if (!item) return {};
  return {
    title: item.title,
    type: item.type,
    noteType: item.noteType,
    fileKind: item.fileKind,
    fileName: item.fileName,
    fileExtension: item.fileExtension,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    url: item.url,
    storageMode: item.storageMode,
    accessKind: item.accessKind,
    mediaPath: item.mediaPath,
    persistentAccess: item.persistentAccess,
    needsReselect: item.needsReselect,
    encoding: item.encoding,
    parentId: item.parentId,
  };
};

/**
 * Hands the bytes back to the browser. Call this only when an item is gone for
 * good — a revoked URL renders as a broken preview, so the bin must keep its
 * entries' URLs alive for the whole retention window.
 */
export const revokePreviewUrl = (item) => {
  if (!item?.url || typeof item.url !== "string" || !item.url.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(item.url);
  } catch {
    // Already revoked, or no URL API in this environment. Nothing to undo.
  }
};
