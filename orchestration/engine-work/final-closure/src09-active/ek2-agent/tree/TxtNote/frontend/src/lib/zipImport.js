/**
 * Safe zip extraction. Paths are sanitised, zip-slip is dropped, and a bomb
 * (too many files, too much uncompressed data, absurd ratios) is refused
 * rather than unpacked into the workspace.
 */

import {
  UPLOAD_ZIP_MAX_COMPRESSED,
  UPLOAD_ZIP_MAX_ENTRIES,
  UPLOAD_ZIP_MAX_RATIO,
  UPLOAD_ZIP_MAX_UNCOMPRESSED,
} from "../config/limits.js";
import { shouldSkipArchiveEntry, splitSafePath } from "./filePath.js";

const unzipFromFflate = async (bytes) => {
  const { unzip } = await import("fflate");
  return new Promise((resolve, reject) => {
    unzip(bytes, (error, result) => {
      if (error) reject(error);
      else resolve(result || {});
    });
  });
};

const asUint8 = (bytes) => {
  if (bytes instanceof Uint8Array) return bytes;
  if (bytes instanceof ArrayBuffer) return new Uint8Array(bytes);
  return new Uint8Array();
};

export function isZipFile({ name = "", type = "" } = {}) {
  const mime = String(type).toLowerCase();
  if (mime === "application/zip" || mime === "application/x-zip-compressed") return true;
  return /\.zip$/i.test(String(name).trim());
}

/**
 * @param {Uint8Array} bytes
 * @param {{ compressedSize?: number }} [meta]
 * @returns {Promise<{ entries: Array<{ parts: string[], name: string, bytes: Uint8Array, isDirectory: boolean }>, skipped: number, errors: string[] }>}
 */
export async function extractZipEntries(bytes, meta = {}) {
  const data = asUint8(bytes);
  const compressedSize = Number.isFinite(meta.compressedSize) ? meta.compressedSize : data.length;
  const errors = [];

  if (data.length === 0) {
    return { entries: [], skipped: 0, errors: ["Arşiv boş veya okunamadı."] };
  }
  if (compressedSize > UPLOAD_ZIP_MAX_COMPRESSED || data.length > UPLOAD_ZIP_MAX_COMPRESSED) {
    return {
      entries: [],
      skipped: 0,
      errors: ["Arşiv çok büyük. Daha küçük bir ZIP yükle."],
    };
  }

  let unzipped;
  try {
    unzipped = await unzipFromFflate(data);
  } catch {
    return { entries: [], skipped: 0, errors: ["Arşiv açılamadı. Dosya bozuk olabilir."] };
  }

  const names = Object.keys(unzipped);
  if (names.length > UPLOAD_ZIP_MAX_ENTRIES) {
    return {
      entries: [],
      skipped: names.length,
      errors: [`Arşivde çok fazla öğe var (en fazla ${UPLOAD_ZIP_MAX_ENTRIES}).`],
    };
  }

  let uncompressed = 0;
  const entries = [];
  let skipped = 0;

  for (const rawName of names) {
    const payload = asUint8(unzipped[rawName]);
    const trimmed = String(rawName).replace(/\\/g, "/");
    const isDirectory = trimmed.endsWith("/");
    const withoutSlash = trimmed.replace(/\/+$/, "");
    const parts = splitSafePath(withoutSlash);
    if (!parts || shouldSkipArchiveEntry(parts)) {
      skipped += 1;
      continue;
    }

    uncompressed += payload.length;
    if (uncompressed > UPLOAD_ZIP_MAX_UNCOMPRESSED) {
      return {
        entries: [],
        skipped: skipped + 1,
        errors: ["Arşiv açılınca çok büyüyor. İçindekiler yüklenmedi."],
      };
    }

    entries.push({
      parts,
      name: parts[parts.length - 1],
      bytes: isDirectory ? new Uint8Array() : payload,
      isDirectory,
    });
  }

  if (compressedSize > 0 && uncompressed / compressedSize > UPLOAD_ZIP_MAX_RATIO) {
    return {
      entries: [],
      skipped: entries.length + skipped,
      errors: ["Arşiv şüpheli ölçüde sıkıştırılmış. Güvenlik için açılmadı."],
    };
  }

  if (entries.length === 0 && skipped > 0) {
    errors.push("Arşivdeki yollar güvenlik nedeniyle atlandı.");
  }
  if (entries.length === 0 && errors.length === 0) {
    errors.push("Arşiv boş veya okunamadı.");
  }

  return { entries, skipped, errors };
}
