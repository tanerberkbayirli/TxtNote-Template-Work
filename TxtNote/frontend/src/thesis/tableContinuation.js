/**
 * Continuation captions of split tables ("Çizelge 3.1 (Devam) Başlık" above every continuation
 * fragment), opt-in through `tables.continuation: { format }`.
 *
 * The browser's multicol fragmentation splits a long table by row but repeats neither the caption
 * nor the header. After layout, `layoutTableContinuations` reads which rows begin a page and puts a
 * presentation-only caption row plus a copy of the header rows in front of each of them (the caption
 * row carries `break-before: column`, so it always starts the page). The rows are real table rows:
 * they take part in the flow (the reserved space is exact) and the layout PDF simply draws them.
 * They are marked `data-thesis-cont`, stripped from the saved HTML (sourceHtml.js) and rebuilt from
 * scratch on every pass: stored notes never contain them. Pages are settled in order in one
 * synchronous pass (every injection forces one layout), bounded by MAX_FRAGMENTS per table; the
 * editor loop repeats the pass under its own iteration cap.
 */
import { pageMetrics } from "./pageLayout.js";

export const CONTINUATION_ROW = "data-thesis-cont";
const MAX_FRAGMENTS = 200;

/** Continuation caption as styled segments: `{label}`, `{number}` and any other text are label text, `{title}` is the caption text. */
export function continuationParts(rule, { number = "", title = "" } = {}) {
  const format = String(rule?.continuation?.format || "");
  return format.split(/(\{title\})/).map((part) => part === "{title}" ? { text: title, title: true } : { text: part.replace(/\{label\}/g, rule.label).replace(/\{number\}/g, number), title: false }).filter((part) => part.text);
}
export const continuationText = (rule, entry) => continuationParts(rule, entry).map((part) => part.text).join("");

/** Remove every injected row (also stale ones after a template switch). */
export function clearTableContinuations(root) {
  root.querySelectorAll(`tr[${CONTINUATION_ROW}]`).forEach((row) => row.remove());
}

function captionRow(table, parts, columns) {
  const doc = table.ownerDocument;
  const row = doc.createElement("tr");
  row.setAttribute(CONTINUATION_ROW, "caption");
  row.setAttribute("contenteditable", "false");
  const cell = doc.createElement("td");
  cell.colSpan = columns;
  cell.className = "thesis-cont-caption";
  for (const part of parts) {
    const span = doc.createElement("span");
    if (!part.title) span.className = "thesis-cont-label";
    span.textContent = part.text;
    cell.append(span);
  }
  row.append(cell);
  return row;
}

/**
 * Inject the continuation rows of every table whose rule asks for them. `model` supplies the caption
 * numbers and titles (its index sources; captions carry the anchor). Returns a signature of the
 * result for the editor's stabilization loop.
 */
export function layoutTableContinuations(root, groups, model) {
  const signature = [];
  for (const group of groups) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    if (!article) continue;
    clearTableContinuations(article);
    if (article.dataset.thesisLayout !== "paged") continue;
    const stack = article.parentElement;
    const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const origin = stack.getBoundingClientRect().top;
    const stride = pageMetrics(group.rules.page).stridePx;
    const pageOf = (element) => Math.floor(((element.getBoundingClientRect().top - origin) / zoom + 0.5) / stride);
    for (const section of group.sections) {
      const rule = section.rules.tables;
      if (!rule.continuation || rule.position !== "above") continue;
      const host = article.querySelector(`[data-thesis-flow-section="${section.id}"] .thesis-body`);
      for (const table of host?.querySelectorAll("table") || []) {
        const anchor = table.querySelector(":scope > caption")?.dataset.thesisAnchor;
        const entry = anchor && model.indexSources.find((source) => source.anchor === anchor);
        if (!entry) continue;
        const parts = continuationParts(rule, entry);
        const head = table.tHead ? [...table.tHead.rows] : [];
        const body = [...table.rows].filter((row) => !head.includes(row));
        if (body.length < 2 || !parts.length) continue;
        const columns = Math.max(1, ...[...table.rows].map((row) => [...row.cells].reduce((sum, cell) => sum + (cell.colSpan || 1), 0)));
        const starts = [];
        let previous = pageOf(body[0]);
        for (let i = 1; i < body.length && starts.length < MAX_FRAGMENTS; i += 1) {
          const page = pageOf(body[i]);
          if (page > previous) {
            const caption = captionRow(table, parts, columns);
            caption.setAttribute("data-thesis-cont-at", String(head.length + i));
            const rows = [caption, ...head.map((source, index) => {
              const copy = source.cloneNode(true);
              copy.removeAttribute("id");
              copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
              copy.setAttribute(CONTINUATION_ROW, "head");
              copy.setAttribute("contenteditable", "false");
              if (index === 0) copy.setAttribute("data-thesis-cont-first", "");
              if (index === head.length - 1) copy.setAttribute("data-thesis-cont-last", "");
              return copy;
            })];
            for (const row of rows) body[i].parentNode.insertBefore(row, body[i]);
            // A hanging indent under the label is the measured width of the (longer) continuation label.
            if (rule.hangingIndent === "label") caption.firstElementChild.setAttribute("data-thesis-caption-hang", String(Math.round(caption.querySelector(".thesis-cont-label").offsetWidth * 1000) / 1000));
            if (rule.captionAlignment === "auto") {
              const range = table.ownerDocument.createRange(); range.selectNodeContents(caption.firstElementChild);
              const tops = new Set([...range.getClientRects()].filter((r) => r.width && r.height).map((r) => Math.round(r.top)));
              caption.firstElementChild.setAttribute("data-thesis-caption-auto", tops.size > 1 ? "justify" : "center");
            }
            starts.push(head.length + i);
            previous = pageOf(body[i]);
          } else previous = page;
        }
        if (starts.length) signature.push(`${anchor}:${starts.join(",")}`);
      }
    }
  }
  return signature.join(";");
}

/** For the DOCX writer: table caption anchor → { rows: first row index of every continuation fragment, hang: label hang in CSS px }. */
export function tableContinuationRows(root) {
  const map = {};
  root?.querySelectorAll(`tr[${CONTINUATION_ROW}="caption"]`).forEach((row) => {
    const anchor = row.closest("table")?.querySelector(":scope > caption")?.dataset.thesisAnchor;
    if (!anchor) return;
    const entry = (map[anchor] ||= { rows: [], hang: 0 });
    entry.rows.push(Number(row.dataset.thesisContAt));
    entry.hang ||= Number(row.firstElementChild?.dataset.thesisCaptionHang || 0);
  });
  return map;
}
