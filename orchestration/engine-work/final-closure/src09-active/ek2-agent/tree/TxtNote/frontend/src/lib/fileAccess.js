/**
 * Open or download an uploaded file without executing it.
 * Executables, archives and unknown binaries are handed to the OS / browser
 * download path — they are never eval'd, iframed or navigated to as a page.
 */

import { encodeFileText } from "./fileText.js";
import { FILE_KIND, resolveItemKind } from "./fileType.js";
import { peekSessionFile } from "./fileSession.js";

const isTauri = () => {
  if (typeof window === "undefined") return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
};

export async function openOrDownloadFile(item) {
  if (!item) {
    throw new Error("Dosya bulunamadı.");
  }

  if (isTauri() && item.id) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_media", { id: item.id });
      return { method: "os" };
    } catch (error) {
      if (item.url) return downloadViaAnchor(item);
      const message = error?.message || String(error || "");
      throw new Error(message || "Dosya açılamadı. İşletim sistemi izin vermedi.");
    }
  }

  if (!item.url) {
    const session = peekSessionFile(item.id);
    if (session?.file) {
      const url = URL.createObjectURL(session.file);
      try {
        return downloadViaAnchor({ ...item, url });
      } finally {
        if (typeof window !== "undefined") {
          window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
      }
    }
    throw new Error("Bu dosyaya kalıcı olarak erişilemiyor. Lütfen dosyayı yeniden seç.");
  }

  const kind = resolveItemKind(item);
  if (kind === FILE_KIND.BINARY || kind === FILE_KIND.ARCHIVE || kind === FILE_KIND.CODE) {
    return downloadViaAnchor(item);
  }

  try {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return { method: "tab" };
  } catch {
    return downloadViaAnchor(item);
  }
}

export function downloadViaAnchor(item) {
  if (!item?.url) {
    throw new Error("Bu dosyaya kalıcı olarak erişilemiyor. Lütfen dosyayı yeniden seç.");
  }
  if (typeof document === "undefined") {
    throw new Error("Dosya indirilemedi.");
  }
  const link = document.createElement("a");
  link.href = item.url;
  link.download = item.fileName || item.title || "dosya";
  link.rel = "noopener";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return { method: "download" };
}

export function exportTextFile({ fileName, text, encoding, mimeType }) {
  const bytes = encodeFileText(text, encoding);
  const blob = new Blob([bytes], { type: mimeType || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    downloadViaAnchor({ url, fileName, title: fileName });
  } finally {
    if (typeof window !== "undefined") {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
