/**
 * File and folder pickers. Chromium can return File System Access handles so
 * a large binary can be re-opened later without copying it into IndexedDB.
 * Other browsers fall back to a hidden <input type="file">.
 *
 * `File` instances are often frozen, so handle / relativePath live on a
 * WeakMap rather than as own properties.
 */

const FILE_META = new WeakMap();

export const hasDirectoryPicker = () =>
  typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";

export const hasOpenFilePicker = () =>
  typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";

export function uploadMetaOf(file) {
  if (!file) return { handle: null, relativePath: "" };
  const extra = FILE_META.get(file) || {};
  return {
    handle: extra.handle || file.handle || null,
    relativePath: extra.relativePath || file.relativePath || file.webkitRelativePath || "",
  };
}

const attachMeta = (file, extra = {}) => {
  if (!file) return file;
  const previous = FILE_META.get(file) || {};
  FILE_META.set(file, { ...previous, ...extra });
  if (extra.handle) {
    try {
      file.handle = extra.handle;
    } catch {
      /* frozen File */
    }
  }
  if (extra.relativePath) {
    try {
      file.relativePath = extra.relativePath;
    } catch {
      /* ignore */
    }
  }
  return file;
};

export async function pickFilesWithHandles() {
  if (!hasOpenFilePicker()) return null;
  try {
    const handles = await window.showOpenFilePicker({ multiple: true });
    const files = [];
    for (const handle of handles) {
      const file = await handle.getFile();
      files.push(attachMeta(file, { handle, relativePath: handle.name }));
    }
    return files;
  } catch (error) {
    if (error?.name === "AbortError") return [];
    return null;
  }
}

async function walkDirectoryHandle(dirHandle, prefix) {
  const out = [];
  for await (const [name, handle] of dirHandle.entries()) {
    const relativePath = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === "directory") {
      out.push(...(await walkDirectoryHandle(handle, relativePath)));
    } else {
      const file = await handle.getFile();
      out.push(attachMeta(file, { handle, relativePath }));
    }
  }
  return out;
}

export async function pickFolderWithHandles() {
  if (!hasDirectoryPicker()) return null;
  try {
    const dir = await window.showDirectoryPicker({ mode: "read" });
    return walkDirectoryHandle(dir, dir.name);
  } catch (error) {
    if (error?.name === "AbortError") return [];
    return null;
  }
}
