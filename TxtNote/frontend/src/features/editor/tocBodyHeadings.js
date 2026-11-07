// İçindekiler satırı ile gövdedeki gerçek başlığın bağı. Satırdan eklenen başlık, `data-toc-row` ile satırın
// kalıcı kimliğini taşır; ad/sayfa değişince bu başlık güncellenir veya taşınır, satır silinince başlık kalkar
// (altındaki metne dokunulmaz). Başlığa şablonun kendi başlık stili ve numaralandırması uygulanır; yazılan
// "2.1" öneki yalnız düzeyi belirler, gövdeye ikinci bir numara yazılmaz.
import { contentsPageKey, contentsTitleParts } from "../../../../../engine/src/manualToc.js";

export const TOC_ROW_ATTR = "data-toc-row";
const selector = (id) => `[${TOC_ROW_ATTR}="${String(id).replace(/["\\]/g, "\\$&")}"]`;
const parse = (html) => { const template = document.createElement("template"); template.innerHTML = html || ""; return template; };

export function tocHeadingSpec(row) {
  const parts = contentsTitleParts(row?.title);
  return { text: parts.title.replace(/\s+/g, " ").trim(), level: parts.level || 1, numbered: Boolean(parts.label) };
}

export const hasTocHeading = (html, id) => Boolean(html) && parse(html).content.querySelector(selector(id)) !== null;

export function removeTocHeading(html, id) {
  const template = parse(html);
  const node = template.content.querySelector(selector(id));
  if (!node) return html;
  node.remove();
  return template.innerHTML;
}

/** Updates the linked heading in place, or (when `place` is given) removes it and inserts it at `place.index` / the end. */
export function upsertTocHeading(html, { id, text, level, numbered = true }, place = null) {
  const template = parse(html);
  const existing = template.content.querySelector(selector(id));
  const heading = document.createElement(`h${level}`);
  heading.setAttribute(TOC_ROW_ATTR, id);
  // Başlığa sayı yazılmadıysa (Özet, Giriş…) şablon bölüm numarası/sayfa sonu uygulamaz; yazıldıysa şablon kendi numarasını verir.
  if (!numbered) heading.setAttribute("data-unnumbered", "true");
  heading.textContent = text;
  if (existing && !place) { existing.replaceWith(heading); return template.innerHTML; }
  existing?.remove();
  const blocks = [...template.content.children];
  const before = place && !place.atEnd ? blocks[place.index] : null;
  if (before) { template.content.insertBefore(heading, before); return template.innerHTML; }
  template.content.append(heading);
  const paragraph = document.createElement("p");
  paragraph.append(document.createElement("br"));
  template.content.append(paragraph);
  return template.innerHTML;
}

/** Finds where a printed page label starts inside the editable flow of its page group. */
export function locateTocPage(root, label) {
  const key = contentsPageKey(label);
  const sheet = key === null ? null : [...root.querySelectorAll(".thesis-sheet[data-thesis-page-label]")].find((node) => contentsPageKey(node.dataset.thesisPageLabel) === key);
  if (!sheet) return { error: "missing" };
  const stack = sheet.closest(".thesis-page-stack");
  const bodies = [...(stack?.querySelectorAll('[data-thesis-flow-section] .rich-text-body[contenteditable="true"]') || [])];
  if (!bodies.length) return { error: "static" };
  const page = sheet.getBoundingClientRect();
  const body = bodies.length === 1 ? bodies[0] : bodies.find((node) => { const r = node.getBoundingClientRect(); return r.bottom > page.top && r.top < page.bottom; });
  if (!body) return { error: "static" };
  const blocks = [...body.children];
  const index = blocks.findIndex((node) => { const r = node.getBoundingClientRect(); return r.top >= page.top - 2 && r.top < page.bottom; });
  return { sectionId: body.closest("[data-thesis-flow-section]").dataset.thesisFlowSection, index, atEnd: index < 0, blockCount: blocks.length, flowSectionIds: [...stack.querySelectorAll("[data-thesis-flow-section]")].map((node) => node.dataset.thesisFlowSection) };
}
