import { unzipSync } from "fflate";

export const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
export const STRICT_W = "http://purl.oclc.org/ooxml/wordprocessingml/main";
export const M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
export const elements = (node) => Array.from(node?.childNodes || []).filter(n => n.nodeType === 1);
export const isWord = (node, name) => [W, STRICT_W].includes(node?.namespaceURI) && (!name || node.localName === name);
export const child = (node, name) => elements(node).find(n => isWord(n, name));
export const children = (node, name) => elements(node).filter(n => isWord(n, name));
export const attr = (node, name) => node?.getAttributeNS(W, name) || node?.getAttributeNS(STRICT_W, name) || "";
export const val = (node, name) => attr(child(node, name), "val");
export const on = (node) => Boolean(node) && !/^(?:0|false|off)$/i.test(attr(node, "val"));
export const escapeHtml = (s) => String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export const mm = (twips) => Number(twips) * 25.4 / 1440;
export function descendants(node, predicate) {
  const found = [];
  const walk = n => { for (const c of elements(n)) { if (predicate(c)) found.push(c); walk(c); } };
  walk(node); return found;
}
export function base64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(binary);
}
export function packageTarget(part, target) {
  if (!target || /[\\\u0000]/.test(target)) throw new Error("Geçersiz Word ilişkisi");
  let decoded;
  try { decoded = decodeURI(target); } catch { throw new Error("Geçersiz Word ilişki adresi"); }
  const segments = decoded.startsWith("/") ? [] : part.split("/").slice(0, -1);
  for (const segment of decoded.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") { if (!segments.length) throw new Error("Word ilişkisi paket dışına çıkıyor"); segments.pop(); }
    else segments.push(segment);
  }
  return segments.join("/");
}
export async function readDocxPackage(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length > 64 * 1024 * 1024) throw new Error("Word dosyası 64 MB sınırını aşıyor");
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("DOCX paketi okunamadı. Şifreli veya eski Word belgesini .docx olarak yeniden kaydedin.");
  let total = 0, count = 0; const names = new Set();
  const files = unzipSync(bytes, { filter(file) {
    total += file.originalSize; count++;
    if (total > 128 * 1024 * 1024 || count > 10000) throw new Error("Word paketinin açılmış boyutu güvenli sınırı aşıyor");
    if (file.name.startsWith("/") || file.name.split("/").includes("..") || /[\\\u0000]/.test(file.name)) throw new Error("Geçersiz Word paket yolu");
    if (names.has(file.name)) throw new Error("Word paketinde yinelenen parça adı");
    names.add(file.name);
    return true;
  } });
  const implementation = typeof DOMParser === "undefined" ? await import("@xmldom/xmldom") : { DOMParser, XMLSerializer };
  const serializer = new implementation.XMLSerializer();
  const cache = new Map(), locators = new WeakMap();
  const xml = part => {
    if (!files[part]) return null;
    if (cache.has(part)) return cache.get(part);
    const data = files[part], encoding = data[0] === 255 && data[1] === 254 ? "utf-16le" : data[0] === 254 && data[1] === 255 ? "utf-16be" : "utf-8";
    const source = new TextDecoder(encoding, { fatal: true }).decode(data);
    if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new Error(`Word XML dış varlık içeriyor: ${part}`);
    const errors = [];
    const parser = new implementation.DOMParser({ errorHandler: { warning: m => errors.push(m), error: m => errors.push(m), fatalError: m => errors.push(m) } });
    const doc = parser.parseFromString(source, "application/xml");
    if (errors.length || !doc.documentElement || doc.getElementsByTagName("parsererror").length) throw new Error(`Word XML okunamadı: ${part}`);
    const locate = (node, path) => {
      locators.set(node, `${part}:${path}`);
      const indexes = new Map();
      for (const c of elements(node)) { const key = c.nodeName; const n = (indexes.get(key) || 0) + 1; indexes.set(key, n); locate(c, `${path}/${key}[${n}]`); }
    };
    locate(doc.documentElement, `/${doc.documentElement.nodeName}[1]`);
    cache.set(part, doc); return doc;
  };
  const relationships = part => {
    const bits = part.split("/"), name = bits.pop();
    const path = [...bits, "_rels", name+".rels"].join("/");
    const doc = xml(path), result = {};
    for (const r of elements(doc?.documentElement)) {
      if (r.localName !== "Relationship") continue;
      const id = r.getAttribute("Id"), target = r.getAttribute("Target"), external = r.getAttribute("TargetMode") === "External";
      if (Object.hasOwn(result, id)) throw new Error(`Yinelenen Word ilişki kimliği: ${path} ${id}`);
      Object.defineProperty(result, id, { enumerable: true, configurable: true, writable: true,
        value: { id, type: r.getAttribute("Type"), target, external, part: external ? null : packageTarget(part, target) } });
    }
    return result;
  };
  const rootRels = relationships("");
  const office = Object.values(rootRels).find(r => r.type.endsWith("/officeDocument"));
  const mainPart = office?.part || "word/document.xml";
  if (office?.external || !files[mainPart]) throw new Error("Word ana belge parçası bulunamadı");
  const contentTypes = xml("[Content_Types].xml");
  const types = {}, extensions = {};
  for (const n of elements(contentTypes?.documentElement)) {
    if (n.localName === "Override") types[n.getAttribute("PartName").replace(/^\//, "")] = n.getAttribute("ContentType");
    if (n.localName === "Default") extensions[n.getAttribute("Extension").toLowerCase()] = n.getAttribute("ContentType");
  }
  return { files, mainPart, xml, relationships, location: node => locators.get(node) || "", serialize: node => node ? serializer.serializeToString(node) : "",
    type: part => types[part] || extensions[part.split(".").pop().toLowerCase()] || "application/octet-stream" };
}
