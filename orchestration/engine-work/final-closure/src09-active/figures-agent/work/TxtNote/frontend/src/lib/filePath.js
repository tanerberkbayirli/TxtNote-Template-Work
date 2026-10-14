/**
 * Relative path hygiene for folder uploads and archives.
 *
 * Names keep their Turkish letters, spaces and punctuation. What this module
 * refuses is traversal, absolute roots and a handful of Windows device names —
 * a zip that claims to write `../x` must not land outside the tree we build.
 */

const RESERVED_DEVICE = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

const SKIP_NAMES = new Set([".ds_store", "thumbs.db", "desktop.ini"]);

export const yieldToMain = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
      window.setTimeout(resolve, 0);
      return;
    }
    setTimeout(resolve, 0);
  });

const isReserved = (part) => RESERVED_DEVICE.test(part);

/**
 * Split a relative path into safe segments, or null when it must be dropped.
 * Backslashes become slashes first so a Windows zip and a folder pick agree.
 */
export function splitSafePath(input) {
  if (input == null) return null;
  let raw = String(input).replace(/\\/g, "/");
  if (!raw || raw.includes("\0")) return null;
  raw = raw.replace(/^\.\/+/, "");
  if (!raw || raw === ".") return null;
  if (raw.startsWith("/") || raw.startsWith("//")) return null;
  if (/^[a-zA-Z]:(\/|$)/.test(raw)) return null;

  const parts = [];
  for (const part of raw.split("/")) {
    if (!part || part === ".") continue;
    if (part === ".." || part === "..." ) return null;
    if (part.includes("\0")) return null;
    if (part.length > 240) return null;
    if (isReserved(part)) return null;
    parts.push(part);
  }

  if (parts.length === 0) return null;
  if (parts.join("/").length > 900) return null;
  return parts;
}

export const joinPath = (parts) => (Array.isArray(parts) ? parts.filter(Boolean).join("/") : "");

export function basenameOf(path) {
  const parts = splitSafePath(path);
  return parts ? parts[parts.length - 1] : "";
}

export function dirnameOf(path) {
  const parts = splitSafePath(path);
  if (!parts || parts.length < 2) return "";
  return parts.slice(0, -1).join("/");
}

export function shouldSkipArchiveEntry(pathParts) {
  if (!Array.isArray(pathParts) || pathParts.length === 0) return true;
  if (pathParts.some((part) => part === "__MACOSX" || String(part).startsWith("._"))) return true;
  const base = String(pathParts[pathParts.length - 1] ?? "");
  if (SKIP_NAMES.has(base.toLowerCase())) return true;
  return false;
}

/**
 * Prefix every segment of a relative path. Used so a zip named `Proje.zip`
 * unpacks under a `Proje` folder rather than spilling into the workspace root.
 */
export function prefixPath(prefix, relativePath) {
  const head = splitSafePath(prefix);
  const tail = splitSafePath(relativePath);
  if (!head) return tail;
  if (!tail) return head;
  return [...head, ...tail];
}
