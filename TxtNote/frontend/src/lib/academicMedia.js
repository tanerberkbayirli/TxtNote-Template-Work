/**
 * Turn a picked image file into a note-safe data URL.
 */

import { fitImageSize } from "./academicLayout.js";

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when every pixel is fully opaque, so JPEG loses nothing but noise. */
function isOpaque(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) return false;
  return true;
}

/** A downscaled photo kept as PNG is several MB; diagrams and screenshots stay well below. */
const PHOTO_PNG_CHARS = 1024 * 1024;

/**
 * `opaqueAsJpeg`: an opaque PNG/WebP photo is stored as JPEG when that is smaller.
 * The data URL is saved inside the note HTML, so its size is paid again on every
 * keystroke and save (a 4 MB PNG photo made typing take ~0.5 s per key). Small PNGs
 * (screenshots, diagrams) keep lossless, sharp text.
 */
export function readImageAsDataUrl(file, maxEdge = 1600, { opaqueAsJpeg = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || typeof file !== "object") {
      reject(new Error("Görsel seçilmedi"));
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      reject(new Error("Bu dosya bir görsel değil"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Görsel işlenemedi"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime = file.type === "image/png" || file.type === "image/webp" ? "image/png" : "image/jpeg";
      try {
        const url = canvas.toDataURL(mime, 0.84);
        if (!opaqueAsJpeg || mime === "image/jpeg" || url.length < PHOTO_PNG_CHARS || !isOpaque(ctx, canvas.width, canvas.height)) {
          resolve(url);
          return;
        }
        const jpeg = canvas.toDataURL("image/jpeg", 0.84);
        resolve(jpeg.length < url.length ? jpeg : url);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Görsel okunamadı"));
    };
    img.src = objectUrl;
  });
}

export function figureHtml(dataUrl, caption, dimensions, captionKind = "") {
  const label = String(caption ?? "").trim();
  const description = label.replace(/^(Şekil|Figure)\s+\d+\.\s*/i, "").trim();
  const cap = `<figcaption><span class="academic-caption-label" contenteditable="false">Şekil 1. </span>${escapeHtml(description)}</figcaption>`;
  const size = dimensions ? fitImageSize(dimensions.width, dimensions.height) : null;
  const attrs = size ? ` width="${size.width}" height="${size.height}"` : "";
  const id = `fig-${Math.random().toString(36).slice(2, 10)}`;
  return `<figure class="academic-figure" data-academic-id="${id}" data-kind="figure"${captionKind ? ` data-caption-kind="${escapeHtml(captionKind)}"` : ""} contenteditable="false"><img${attrs} src="${escapeHtml(dataUrl)}" alt="${escapeHtml(description)}">${cap}</figure>\u200B`;
}

export function imageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width:img.naturalWidth, height:img.naturalHeight });
    img.onerror = () => reject(new Error("Görsel okunamadı"));
    img.src = src;
  });
}
