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
/** List container whose last paragraph and the paragraph after it are chained by contextual spacing: the list adds no gap of its own. */
export const LIST_FLUSH = "data-thesis-list-flush";
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
  root.querySelectorAll("[data-thesis-row-tail]").forEach((spacer) => spacer.remove());
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
  const flushed = [];
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
        // Word: paragraphs of one style with "don't add space between paragraphs of the same style" sit flush, a list
        // included (SRC09 EK-2: empty list-style paragraphs follow the bullets at the plain line pitch). The paragraph
        // chain already zeroes both outer margins; the list container's own bottom margin must not bring the gap back.
        for (const list of table.querySelectorAll("td>:is(ul,ol),th>:is(ul,ol)")) {
          const lastParagraph = list.lastElementChild?.querySelector("p");
          const next = list.nextElementSibling;
          // A list that ends its cell is flush when its last paragraph carries no space after (Word drops it at a cell's end).
          const chained = next ? next.tagName === "P" && !next.hasAttribute("data-thesis-cont")
            && (next.getAttribute("data-docx-style") || "") === (lastParagraph?.getAttribute("data-docx-style") || "")
            && parseFloat(getComputedStyle(next).marginTop) === 0 : true;
          const flush = Boolean(lastParagraph && chained && parseFloat(getComputedStyle(lastParagraph).marginBottom) === 0);
          if (flush !== list.hasAttribute(LIST_FLUSH)) list.toggleAttribute(LIST_FLUSH, flush);
          if (flush) flushed.push(tableIndex);
        }
        // Mark tables the layout splits across pages (a table moved whole to a page start and still splitting is the case that leaves a gap).
        const dataRows = [...table.rows].filter((row) => !row.hasAttribute(CONTINUATION_ROW));
        // Word requires the declared minimum row height to fit before starting a
        // splittable row. Chrome applies that minimum only to the whole row and
        // otherwise places a short first fragment at the preceding column's foot.
        for (const row of dataRows) {
          row.removeAttribute(FRAG_LAST_ROW);
          row.removeAttribute("data-thesis-row-min-break");
        }
        const minimumStarts = [];
        for (const [index, row] of dataRows.entries()) {
          const value = getComputedStyle(row).getPropertyValue("--thesis-source-row-min").trim();
          const minimum = value.endsWith("mm") ? parseFloat(value) * 96 / 25.4 : 0;
          const rowTop = row.getClientRects()[0]?.top;
          if (rowTop === undefined) continue;
          const y = (rowTop - origin) / zoom;
          const inPage = ((y % stride) + stride) % stride;
          // Terminal leading lets a final text line use its own extra leading,
          // but is not additional space for a declared minimum row height.
          const remaining = metrics.topMarginPx + metrics.contentHeightPx - metrics.trailingLeadingPx - inPage;
          // An exact-height row cannot split and must end inside the page frame (the frame already stops above the footer, as
          // Word's body does). Chrome leaves such a row at the page foot with its bottom past the frame (SRC09 EK-2's 22.7 pt
          // header: 3.7 pt past it, where Word starts it on the next page); the row moves whole.
          const rects = row.getClientRects();
          const exactNeed = row.hasAttribute("data-docx-exact") && rects.length === 1 ? rects[0].height / zoom : 0;
          const minimumFits = minimum > 0 && minimum <= metrics.contentHeightPx;
          if (inPage > metrics.topMarginPx + 1 && ((minimumFits && remaining + 0.5 < minimum) || (exactNeed > 0 && exactNeed <= metrics.contentHeightPx && remaining < exactNeed))) {
            row.setAttribute("data-thesis-row-min-break", "");
            minimumStarts.push(index);
          }
          // Word reserves trHeight for each physical continuation, too. Reserve
          // only the short final fragment, using its actual post-break geometry.
          // Padding changes every fragment; a trailing empty block changes only
          // the remainder. A spanning origin belongs to several logical rows.
          if ([...row.cells].some((cell) => cell.rowSpan > 1)) continue;
          let spacer = null, reserve = 0;
          for (let attempt = 0; attempt < 4; attempt += 1) {
            const fragments = [...row.getClientRects()].filter((rect) => rect.height > zoom * 0.5 && rect.width > 0);
            const tail = fragments.at(-1);
            if (fragments.length < 2 || tail.height / zoom + 0.5 >= minimum) break;
            if (!spacer) {
              let target = null, bottom = -Infinity;
              for (const cell of row.cells) {
                if (getComputedStyle(cell).display === "none") continue;
                const range = row.ownerDocument.createRange(); range.selectNodeContents(cell);
                const end = range.getBoundingClientRect().bottom;
                if (end > bottom) { target = cell; bottom = end; }
              }
              if (!target) break;
              spacer = row.ownerDocument.createElement("div");
              spacer.setAttribute("data-thesis-row-tail", "");
              spacer.setAttribute("contenteditable", "false");
              spacer.setAttribute("aria-hidden", "true");
              target.append(spacer);
            }
            reserve += minimum - tail.height / zoom;
            spacer.style.cssText = `display:block!important;height:${reserve}px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;break-inside:avoid!important`;
          }
          if (spacer) minimumStarts.push(`${index}t${Math.round(reserve * 1000)}`);
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
            body[i - 1].setAttribute(FRAG_LAST_ROW, "");
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
  return signature.join(";") + (tallChanged ? "|tall" : "") + (flushed.length ? `|flush${flushed.length}` : "");
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
