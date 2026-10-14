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
/** Header-only repeat (no continuation caption): the row carrying this starts its page. */
export const HEADER_BREAK_ROW = "data-thesis-head-break";
/** First/last injected row of a continued table's fragment (border and break edges). */
export const FRAG_FIRST_ROW = "data-thesis-frag-first";
export const FRAG_LAST_ROW = "data-thesis-frag-last";
/** Table that spans pages: `break-inside:auto` (pageLayout.js) lets it start on the page it is reached, like Word. */
export const TALL_TABLE = "data-thesis-tall";
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
 * numbers and titles (its index sources; captions carry the anchor). Two opt-in forms, both mirroring
 * what Word does with `w:tblHeader` rows on continued tables: `tables.continuation` puts a caption row
 * plus the header rows in front of every page-start row, and `repeatHeader !== false` repeats just the
 * header rows (Chrome's multicol fragmentation repeats neither). Returns a signature of the result for
 * the editor's stabilization loop.
 */
export function layoutTableContinuations(root, groups, model) {
  const signature = [];
  let tallChanged = false;
  for (const group of groups) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    if (!article) continue;
    clearTableContinuations(article);
    if (article.dataset.thesisLayout !== "paged") continue;
    const stack = article.parentElement;
    const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const origin = stack.getBoundingClientRect().top;
    const stride = pageMetrics(group.rules.page).stridePx;
    const metrics = pageMetrics(group.rules.page);
    const pageAt = (y) => Math.floor(((y - origin) / zoom + 0.5) / stride);
    const pageOf = (element) => pageAt(element.getBoundingClientRect().top);
    for (const section of group.sections) {
      const rule = section.rules.tables;
      const captions = Boolean(rule.continuation && rule.position === "above");
      const headers = rule.repeatHeader !== false;
      const host = article.querySelector(`[data-thesis-flow-section="${section.id}"] .thesis-body`);
      for (const [tableIndex, table] of [...(host?.querySelectorAll("table") || [])].entries()) {
        // Mark tables the layout splits across pages (a table moved whole to a page start and still splitting is the case that leaves a gap).
        const dataRows = [...table.rows].filter((row) => !row.hasAttribute(CONTINUATION_ROW));
        // Word requires the declared minimum row height to fit before starting a
        // splittable row. Chrome applies that minimum only to the whole row and
        // otherwise places a short first fragment at the preceding column's foot.
        for (const row of dataRows) row.removeAttribute("data-thesis-row-min-break");
        const minimumStarts = [];
        for (const [index, row] of dataRows.entries()) {
          const value = getComputedStyle(row).getPropertyValue("--thesis-source-row-min").trim();
          const minimum = value.endsWith("mm") ? parseFloat(value) * 96 / 25.4 : 0;
          if (!(minimum > 0 && minimum <= metrics.contentHeightPx)) continue;
          const y = (row.getClientRects()[0]?.top - origin) / zoom;
          const inPage = ((y % stride) + stride) % stride;
          const remaining = metrics.topMarginPx + metrics.contentHeightPx - inPage;
          if (inPage > metrics.topMarginPx + 1 && remaining + 0.5 < minimum) {
            row.setAttribute("data-thesis-row-min-break", "");
            minimumStarts.push(index);
          }
        }
        if (minimumStarts.length) signature.push(`${section.id}:${tableIndex}:min:${minimumStarts.join(",")}`);
        if (dataRows.length && !table.parentElement?.closest("table")) {
          // A single splittable row can occupy several columns too. Its top alone
          // cannot reveal that; the last row's bottom is the end of the table.
          const spans = pageOf(dataRows[0]) !== pageAt(dataRows.at(-1).getBoundingClientRect().bottom - zoom);
          if (spans !== table.hasAttribute(TALL_TABLE)) { table.toggleAttribute(TALL_TABLE, spans); tallChanged = true; }
        }
        if (!captions && !headers) continue;
        const anchor = table.querySelector(":scope > caption")?.dataset.thesisAnchor;
        const entry = anchor && model.indexSources.find((source) => source.anchor === anchor);
        const parts = captions && entry ? continuationParts(rule, entry) : [];
        let head = table.tHead ? [...table.tHead.rows] : [];
        // Imported Word tables have no <thead>: their leading w:tblHeader rows (data-docx-header="1") repeat the same way.
        if (!head.length) { const lead = []; for (const row of table.rows) { if (row.getAttribute("data-docx-header") !== "1" || row.hasAttribute(CONTINUATION_ROW)) break; lead.push(row); } head = lead; }
        const body = [...table.rows].filter((row) => !head.includes(row) && !row.hasAttribute(CONTINUATION_ROW));
        if (body.length < 2 || (!parts.length && !(headers && head.length))) continue;
        const columns = Math.max(1, ...[...table.rows].map((row) => [...row.cells].reduce((sum, cell) => sum + (cell.colSpan || 1), 0)));
        const starts = [];
        let previous = pageOf(body[0]);
        for (let i = 1; i < body.length && starts.length < MAX_FRAGMENTS; i += 1) {
          const page = pageOf(body[i]);
          if (page > previous) {
            const rows = parts.length ? [captionRow(table, parts, columns)] : [];
            if (parts.length) rows[0].setAttribute("data-thesis-cont-at", String(head.length + i));
            rows.push(...head.map((source, index) => {
              const copy = source.cloneNode(true);
              copy.removeAttribute("id");
              copy.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
              copy.setAttribute(CONTINUATION_ROW, "head");
              copy.setAttribute("contenteditable", "false");
              if (index === 0) copy.setAttribute(FRAG_FIRST_ROW, "");
              if (index === head.length - 1) copy.setAttribute(FRAG_LAST_ROW, "");
              return copy;
            }));
            // Without a caption row the repeated header starts the page itself.
            if (!parts.length) rows[0]?.setAttribute(HEADER_BREAK_ROW, "");
            for (const row of rows) body[i].parentNode.insertBefore(row, body[i]);
            const caption = parts.length ? rows[0] : null;
            if (caption) {
              // A hanging indent under the label is the measured width of the (longer) continuation label.
              if (rule.hangingIndent === "label") caption.firstElementChild.setAttribute("data-thesis-caption-hang", String(Math.round(caption.querySelector(".thesis-cont-label").offsetWidth * 1000) / 1000));
              if (rule.captionAlignment === "auto") {
                const range = table.ownerDocument.createRange(); range.selectNodeContents(caption.firstElementChild);
                const tops = new Set([...range.getClientRects()].filter((r) => r.width && r.height).map((r) => Math.round(r.top)));
                caption.firstElementChild.setAttribute("data-thesis-caption-auto", tops.size > 1 ? "justify" : "center");
              }
            }
            starts.push(head.length + i);
            previous = pageOf(body[i]);
          } else previous = page;
        }
        if (starts.length) signature.push(`${anchor || `${section.id}:${tableIndex}`}:${starts.join(",")}`);
      }
    }
  }
  return signature.join(";") + (tallChanged ? "|tall" : "");
}

/** For the DOCX writer: table caption anchor → { rows: first row index of every continuation fragment, hang: label hang in CSS px, spansPages }. */
export function tableContinuationRows(root) {
  const map = {};
  const anchorOf = (row) => row.closest("table")?.querySelector(":scope > caption")?.dataset.thesisAnchor;
  // Page spanning is independent of repeated headers/captions. Word must not
  // chain all rows of a tall table whose template disables both repeat options.
  root?.querySelectorAll(`table[${TALL_TABLE}]`).forEach((table) => {
    const anchor = table.querySelector(":scope > caption")?.dataset.thesisAnchor;
    if (anchor) (map[anchor] ||= { rows: [], hang: 0 }).spansPages = true;
  });
  root?.querySelectorAll(`tr[${CONTINUATION_ROW}="caption"]`).forEach((row) => {
    const anchor = anchorOf(row);
    if (!anchor) return;
    const entry = (map[anchor] ||= { rows: [], hang: 0 });
    entry.rows.push(Number(row.dataset.thesisContAt));
    entry.hang ||= Number(row.firstElementChild?.dataset.thesisCaptionHang || 0);
  });
  // Repeated-header clones also prove page spanning, including continuation
  // fragments that became tall only after their repeated rows were inserted.
  root?.querySelectorAll(`tr[${HEADER_BREAK_ROW}]`).forEach((row) => {
    const anchor = anchorOf(row);
    if (!anchor) return;
    (map[anchor] ||= { rows: [], hang: 0 }).spansPages = true;
  });
  return map;
}
