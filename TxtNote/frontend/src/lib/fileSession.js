/**
 * In-memory File / handle cache for this session only.
 *
 * Upload stores metadata in the sidebar and keeps the original File here.
 * Bytes are read only when that file is the visible document. Hidden files
 * drop their object URLs; the File itself stays so reopening is cheap.
 */

const SESSION_FILES = new Map();

export function rememberSessionFile(id, file, handle = null) {
  if (!id || !file) return;
  const previous = SESSION_FILES.get(id);
  SESSION_FILES.set(id, {
    file,
    handle: handle || previous?.handle || null,
  });
}

export function peekSessionFile(id) {
  if (!id) return null;
  return SESSION_FILES.get(id) || null;
}

export function hasSessionFile(id) {
  return Boolean(id) && SESSION_FILES.has(id);
}

export function forgetSessionFile(id) {
  if (!id) return;
  SESSION_FILES.delete(id);
}
