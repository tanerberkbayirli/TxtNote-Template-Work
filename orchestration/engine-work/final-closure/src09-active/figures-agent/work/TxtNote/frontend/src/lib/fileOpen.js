/**
 * Load file bytes only when that file is the visible document.
 */

import { UPLOAD_TEXT_MAX_BYTES } from "../config/limits.js";
import { stampCreated } from "./entity.js";
import { peekSessionFile, rememberSessionFile } from "./fileSession.js";
import { shouldPersistBytes, shouldStoreBytesInline } from "./fileStorage.js";
import { decodeFileBytes, isProbablyText, readFileBytes } from "./fileText.js";
import { isTextEditableFile } from "./fileType.js";

const previewUrlOf = (file) => {
  try {
    return file ? URL.createObjectURL(file) : null;
  } catch {
    return null;
  }
};

const unwrapWritten = (written) => {
  if (!written) return { url: null, mediaPath: null };
  if (typeof written === "string") return { url: written, mediaPath: null };
  return { url: written.url || null, mediaPath: written.mediaPath || null };
};

export async function materializeFileItem({
  item,
  isTauri = false,
  writeMedia,
  hydrateFileUrl,
  saveNote,
  skipNote = false,
} = {}) {
  if (!item || item.type !== "file") return { url: item?.url || null, mediaPath: item?.mediaPath || null, note: null };

  const session = peekSessionFile(item.id);
  let file = session?.file || null;
  let url = item.url && !String(item.url).startsWith("blob:") ? item.url : item.url || null;
  let mediaPath = item.mediaPath || null;

  if (!url && file) url = previewUrlOf(file);

  if (!url && typeof hydrateFileUrl === "function") {
    try {
      const hydrated = await hydrateFileUrl(item.id, mediaPath);
      if (hydrated?.file) {
        file = hydrated.file;
        rememberSessionFile(item.id, hydrated.file, hydrated.handle || null);
        if (!url) url = previewUrlOf(hydrated.file);
      }
      if (hydrated?.url) url = hydrated.url;
    } catch {
      // Permission or missing bytes — the preview will ask to reselect.
    }
  }

  if (file && typeof writeMedia === "function" && !mediaPath) {
    const meta = {
      name: item.fileName || file.name,
      type: item.mimeType || file.type,
      size: file.size ?? item.fileSize ?? 0,
      kind: item.fileKind,
      isTauri,
    };
    const persist = shouldPersistBytes(meta);
    const inline = shouldStoreBytesInline(meta);
    if (persist && (inline || isTauri)) {
      const run = async () => unwrapWritten(await writeMedia(item.id, file, item.mimeType || file.type));
      if (inline) {
        try {
          const written = await run();
          if (written.mediaPath) mediaPath = written.mediaPath;
          if (written.url && !url) url = written.url;
        } catch {
          // Preview URL from the session file is enough.
        }
      } else {
        void run().catch(() => {});
      }
    }
  }

  let note = null;
  const size = file?.size ?? item.fileSize ?? 0;
  if (!skipNote && file && isTextEditableFile(item) && size <= UPLOAD_TEXT_MAX_BYTES) {
    try {
      const bytes = await readFileBytes(file);
      if (isProbablyText(bytes)) {
        const decoded = decodeFileBytes(bytes);
        note = stampCreated({
          title: item.title,
          content: decoded.text,
          encoding: decoded.encoding,
        });
        if (typeof saveNote === "function") {
          try {
            await saveNote(item.id, note);
          } catch {
            // In-memory note still opens the editor.
          }
        }
      }
    } catch {
      note = null;
    }
  }

  return { url, mediaPath, note };
}
