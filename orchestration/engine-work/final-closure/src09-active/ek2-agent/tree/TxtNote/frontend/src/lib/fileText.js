/**
 * Decode and re-encode uploaded text without turning it into HTML.
 * BOM sniffing decides UTF-8 vs UTF-16; anything else is read as UTF-8.
 */

const UTF8_BOM = [0xef, 0xbb, 0xbf];
const UTF16LE_BOM = [0xff, 0xfe];
const UTF16BE_BOM = [0xfe, 0xff];

const startsWith = (bytes, sig) =>
  bytes && bytes.length >= sig.length && sig.every((value, index) => bytes[index] === value);

export function isProbablyText(bytes, sample = 4096) {
  if (!bytes || bytes.length === 0) return true;
  const n = Math.min(bytes.length, sample);
  if (startsWith(bytes, UTF8_BOM) || startsWith(bytes, UTF16LE_BOM) || startsWith(bytes, UTF16BE_BOM)) {
    return true;
  }
  let suspicious = 0;
  for (let i = 0; i < n; i += 1) {
    const code = bytes[i];
    if (code === 0) return false;
    if (code < 8 || (code < 32 && code !== 9 && code !== 10 && code !== 13)) suspicious += 1;
  }
  return suspicious / n < 0.08;
}

export function decodeFileBytes(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes ?? []);
  if (startsWith(view, UTF8_BOM)) {
    return {
      text: new TextDecoder("utf-8").decode(view.subarray(3)),
      encoding: "utf-8-bom",
    };
  }
  if (startsWith(view, UTF16LE_BOM)) {
    return {
      text: new TextDecoder("utf-16le").decode(view.subarray(2)),
      encoding: "utf-16le",
    };
  }
  if (startsWith(view, UTF16BE_BOM)) {
    return {
      text: new TextDecoder("utf-16be").decode(view.subarray(2)),
      encoding: "utf-16be",
    };
  }
  return {
    text: new TextDecoder("utf-8").decode(view),
    encoding: "utf-8",
  };
}

const utf16Encode = (text, littleEndian) => {
  const buffer = new ArrayBuffer(2 + text.length * 2);
  const view = new DataView(buffer);
  view.setUint8(0, littleEndian ? 0xff : 0xfe);
  view.setUint8(1, littleEndian ? 0xfe : 0xff);
  for (let i = 0; i < text.length; i += 1) {
    view.setUint16(2 + i * 2, text.charCodeAt(i), littleEndian);
  }
  return new Uint8Array(buffer);
};

export function encodeFileText(text, encoding = "utf-8") {
  const value = String(text ?? "");
  if (encoding === "utf-8-bom") {
    const body = new TextEncoder().encode(value);
    const out = new Uint8Array(3 + body.length);
    out.set(UTF8_BOM, 0);
    out.set(body, 3);
    return out;
  }
  if (encoding === "utf-16le") return utf16Encode(value, true);
  if (encoding === "utf-16be") return utf16Encode(value, false);
  return new TextEncoder().encode(value);
}

export async function readFileBytes(file) {
  if (!file) return new Uint8Array();
  if (file instanceof Uint8Array) return file;
  if (typeof file.arrayBuffer === "function") {
    return new Uint8Array(await file.arrayBuffer());
  }
  return new Uint8Array();
}

export async function readFileText(file) {
  const bytes = await readFileBytes(file);
  return { ...decodeFileBytes(bytes), bytes };
}
