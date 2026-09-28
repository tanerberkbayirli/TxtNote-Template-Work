/**
 * Where an uploaded file's bytes are allowed to live.
 *
 * IndexedDB (and the snapshot JSON) may hold text and modest binaries. Video,
 * archives, executables and anything past the inline ceiling keep only
 * metadata plus an access reference — a disk path on desktop, a file-picker
 * handle in Chromium, or a session blob that the user must re-select later.
 */

import {
  UPLOAD_INLINE_MAX_BYTES,
  UPLOAD_MAX_BYTES,
  UPLOAD_TEXT_MAX_BYTES,
} from "../config/limits.js";
import { detectFileKind, FILE_KIND } from "./fileType.js";

const NEVER_INLINE_KINDS = new Set([FILE_KIND.VIDEO, FILE_KIND.ARCHIVE, FILE_KIND.BINARY]);

const KNOWN_KINDS = new Set(Object.values(FILE_KIND));

const kindOf = ({ name = "", type = "", kind } = {}) =>
  kind && KNOWN_KINDS.has(kind) ? kind : detectFileKind({ name, type });

export function isOverHardLimit(size) {
  return !Number.isFinite(size) || size < 0 || size > UPLOAD_MAX_BYTES;
}

export function shouldStoreBytesInline({ name = "", type = "", size = 0, kind } = {}) {
  if (!Number.isFinite(size) || size < 0) return false;
  if (size > UPLOAD_INLINE_MAX_BYTES) return false;
  const resolved = kindOf({ name, type, kind });
  if (NEVER_INLINE_KINDS.has(resolved)) return false;
  return true;
}

/**
 * Desktop writes media to the app data folder, which is not IndexedDB, so
 * large files may still persist there. The browser only persists when the
 * bytes would have been inlined anyway.
 */
export function shouldPersistBytes({
  name = "",
  type = "",
  size = 0,
  kind,
  isTauri = false,
} = {}) {
  if (isOverHardLimit(size)) return false;
  if (isTauri) return true;
  return shouldStoreBytesInline({ name, type, size, kind });
}

export function shouldOpenInCodeEditor({ name = "", type = "", size = 0, kind, bytes } = {}) {
  if (!Number.isFinite(size) || size < 0 || size > UPLOAD_TEXT_MAX_BYTES) return false;
  const resolved = kindOf({ name, type, kind });
  if (NEVER_INLINE_KINDS.has(resolved)) return false;
  if (resolved === FILE_KIND.IMAGE || resolved === FILE_KIND.VIDEO || resolved === FILE_KIND.AUDIO) {
    return false;
  }
  if (resolved === FILE_KIND.PDF) return false;
  if (bytes && bytes.length > 0 && bytes[0] === 0) return false;
  return resolved === FILE_KIND.CODE || resolved === FILE_KIND.DOCUMENT || resolved === FILE_KIND.SHEET;
}

export function storageModeFor({
  name = "",
  type = "",
  size = 0,
  kind,
  isTauri = false,
  hasHandle = false,
} = {}) {
  if (shouldStoreBytesInline({ name, type, size, kind })) return "inline";
  if (isTauri && shouldPersistBytes({ name, type, size, kind, isTauri })) return "reference";
  if (hasHandle) return "reference";
  return "session";
}

export function accessKindFor({
  name = "",
  type = "",
  size = 0,
  kind,
  isTauri = false,
  hasHandle = false,
} = {}) {
  const persist = shouldPersistBytes({ name, type, size, kind, isTauri });
  if (persist && isTauri) return "mediaPath";
  if (persist && shouldStoreBytesInline({ name, type, size, kind })) return "idb";
  if (hasHandle) return "fileHandle";
  return "session";
}
