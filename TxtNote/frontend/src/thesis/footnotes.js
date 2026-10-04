/**
 * Page-bottom footnotes (Task 10A.1). Generic: typography, separator and area limit
 * come from the template; nothing here knows a university.
 *
 * The browser's fragmentation engine stays the only paginator. A page that shows
 * notes gets less body capacity by stamping one presentation attribute on the
 * block that crosses the reduced limit: a splittable block gets a cloned
 * (per-fragment) bottom padding, so its lines stop above the notes and continue
 * on the next page; a monolithic block (heading, figure, table row) gets a forced
 * break. The notes themselves are drawn on the sheet layer, never in the editable
 * DOM. Stamps, note areas and page assignments are presentation only; saves strip
 * the stamps (sourceHtml.js) and nothing is written to the note.
 */
import { flowPagePitchPx, pageCountFromFlowHeight, pageMetrics } from "./pageLayout.js";

export const FOOTNOTE_REF_SELECTOR = "sup.academic-footnote, span.academic-footnote";
export const FOOTNOTE_STYLE_KEYS = ["fontFamily", "fontSizePt", "fontWeight", "italic", "lineHeight", "lineSpacing", "align", "characterSpacingPt", "spaceBeforePt", "spaceAfterPt", "firstLineIndentMm", "leftIndentMm", "rightIndentMm"];
const SEPARATOR_DEFAULTS = { enabled: true, widthPercent: 33, thicknessPt: 0.5, spaceBeforePt: 6, spaceAfterPt: 3 };

/** Engine defaults, used only where a template is silent. */
export function resolveFootnoteRule(base = {}, override = {}, body = {}) {
  const rule = { ...base, ...override };
  const style = { fontFamily: body.fontFamily || "Times New Roman", fontSizePt: 9, fontWeight: 400, italic: false, lineHeight: 1.2, align: "left", characterSpacingPt: 0, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0 };
  for (const key of FOOTNOTE_STYLE_KEYS) if (rule[key] !== undefined) style[key] = rule[key];
  return {
    placement: rule.placement === "sectionEnd" ? "sectionEnd" : "pageBottom",
    // Default: one running sequence (what Word numbers from its single footnote stream); "section" restarts each editable body (editor/PDF only).
    numbering: rule.numbering === "section" ? "section" : "document",
    maxAreaPercent: Number.isFinite(rule.maxAreaPercent) ? Math.min(90, Math.max(10, rule.maxAreaPercent)) : 50,
    separator: { ...SEPARATOR_DEFAULTS, ...base.separator, ...override.separator },
    style,
  };
}

export function validateFootnoteRule(rule, path, validateStyle, body = {}) {
  if (rule === undefined) return [];
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return [`${path} nesne olmalı`];
  const errors = [];
  const allowed = new Set([...FOOTNOTE_STYLE_KEYS, "placement", "maxAreaPercent", "separator", "numbering"]);
  for (const key of Object.keys(rule)) if (!allowed.has(key)) errors.push(`${path}.${key} bilinmiyor`);
  if (rule.placement !== undefined && !["pageBottom", "sectionEnd"].includes(rule.placement)) errors.push(`${path}.placement geçersiz`);
  if (rule.numbering !== undefined && !["section", "document"].includes(rule.numbering)) errors.push(`${path}.numbering geçersiz`);
  if (rule.maxAreaPercent !== undefined && (!Number.isFinite(rule.maxAreaPercent) || rule.maxAreaPercent < 10 || rule.maxAreaPercent > 90)) errors.push(`${path}.maxAreaPercent 10-90 olmalı`);
  const separator = rule.separator;
  if (separator !== undefined) {
    if (!separator || typeof separator !== "object" || Array.isArray(separator)) errors.push(`${path}.separator nesne olmalı`);
    else {
      if (separator.enabled !== undefined && typeof separator.enabled !== "boolean") errors.push(`${path}.separator.enabled geçersiz`);
      if (separator.widthPercent !== undefined && (!Number.isFinite(separator.widthPercent) || separator.widthPercent <= 0 || separator.widthPercent > 100)) errors.push(`${path}.separator.widthPercent geçersiz`);
      for (const key of ["thicknessPt", "spaceBeforePt", "spaceAfterPt"]) if (separator[key] !== undefined && (!Number.isFinite(separator[key]) || separator[key] < 0 || separator[key] > 72)) errors.push(`${path}.separator.${key} geçersiz`);
    }
  }
  const style = Object.fromEntries(FOOTNOTE_STYLE_KEYS.filter((key) => rule[key] !== undefined).map((key) => [key, rule[key]]));
  errors.push(...validateStyle({ fontFamily: body.fontFamily || "Times New Roman", fontSizePt: 9, ...style }, path));
  return errors;
}

/** Footnote references in source HTML (regex twin of FOOTNOTE_REF_SELECTOR). */
const FOOTNOTE_REF_HTML = /(<(sup|span)\b(?=[^>]*\bclass=["'][^"']*\bacademic-footnote\b)[^>]*>)([^<]*)(<\/\2>)/gi;
export const countFootnoteRefs = (html) => (String(html || "").match(FOOTNOTE_REF_HTML) || []).length;

/** Print/static HTML of a document-numbered section: reference n becomes offset + n (text and data-fn-index). */
export function renumberFootnoteRefs(html, offset) {
  let n = offset;
  return String(html || "").replace(FOOTNOTE_REF_HTML, (whole, open, tag, text, close) => {
    n += 1;
    const opening = /\sdata-fn-index=["'][^"']*["']/.test(open) ? open.replace(/(\sdata-fn-index=)["'][^"']*["']/, `$1"${n}"`) : `${open.slice(0, -1)} data-fn-index="${n}">`;
    return `${opening}${n}${close}`;
  });
}

/** Page-bottom notes need the paged flow plus per-fragment padding and typed attr(). */
export const pageFootnotesSupported = () => typeof CSS !== "undefined" && typeof CSS.supports === "function"
  && CSS.supports("column-wrap", "wrap") && CSS.supports("box-decoration-break", "clone") && CSS.supports("padding-bottom", "attr(data-x px)");

/** Same DOM for the rendered area and the measuring box, so a measured height is the drawn height. */
export function footnoteAreaNodes(doc, items, rule) {
  const nodes = [];
  if (rule.separator.enabled) {
    const line = doc.createElement("div");
    line.className = "thesis-footnote-separator";
    nodes.push(line);
  }
  const list = doc.createElement("ol");
  list.className = "thesis-footnote-list";
  for (const item of items) {
    const entry = doc.createElement("li");
    entry.className = item.continued ? "thesis-footnote thesis-footnote-continued" : "thesis-footnote";
    if (!item.continued) {
      const label = doc.createElement("sup");
      label.className = "thesis-footnote-label";
      label.textContent = item.label;
      entry.append(label, doc.createTextNode(" "));
    }
    entry.append(doc.createTextNode(item.text));
    list.appendChild(entry);
  }
  nodes.push(list);
  return nodes;
}

/* ------------------------------------------------------------------------- *
 * Stamps. One attribute per block; values are CSS px of the unscaled page.
 * ------------------------------------------------------------------------- */
const STAMP = "data-thesis-fn-stamp";
const RESERVE = "data-thesis-fn-reserve";
const MARGIN = "data-thesis-fn-margin";
const reserves = new WeakMap();
const round = (value) => Math.round(value * 100) / 100;

function clearStamp(element) {
  element.removeAttribute(STAMP); element.removeAttribute(RESERVE); element.removeAttribute(MARGIN);
  reserves.delete(element);
}

function writeReserve(element, entry) {
  const amount = Math.max(0, ...entry.owners.values());
  element.setAttribute(STAMP, "reserve");
  element.setAttribute(RESERVE, String(round(entry.padding + amount)));
  element.setAttribute(MARGIN, String(round(entry.margin - amount)));
}

function applyStamp(cut, owner) {
  if (cut.kind === "break") { clearStamp(cut.element); cut.element.setAttribute(STAMP, "break"); return { element: cut.element, kind: "break" }; }
  let entry = reserves.get(cut.element);
  if (!entry || cut.element.getAttribute(STAMP) !== "reserve") {
    const style = getComputedStyle(cut.element);
    // The reserve (padding) replaces margin-bottom one for one only where that margin is not already collapsed into the next block's
    // margin-top (Word-additive spacing: 6 pt after + 6 pt before is one 12 pt gap): the part the neighbour's margin covers is not stamped.
    const next = cut.element.nextElementSibling;
    const nextTop = next ? Math.max(0, parseFloat(getComputedStyle(next).marginTop) || 0) : 0;
    const bottom = parseFloat(style.marginBottom) || 0;
    entry = { padding: parseFloat(style.paddingBottom) || 0, margin: bottom > 0 ? Math.max(bottom - nextTop, 0) : bottom, owners: new Map() };
    reserves.set(cut.element, entry);
  }
  entry.owners.set(owner, cut.amount);
  writeReserve(cut.element, entry);
  return { element: cut.element, kind: "reserve" };
}

function releaseStamp(stamp, owner) {
  if (!stamp?.element) return;
  const { element } = stamp;
  if (stamp.kind === "break") { if (element.getAttribute(STAMP) === "break") clearStamp(element); return; }
  const entry = reserves.get(element);
  if (!entry) { clearStamp(element); return; }
  entry.owners.delete(owner);
  if (entry.owners.size) writeReserve(element, entry);
  else clearStamp(element);
}

/* ------------------------------------------------------------------------- *
 * Geometry of the existing flow (unscaled px relative to the flow's first page).
 * ------------------------------------------------------------------------- */
function fragments(element, ctx) {
  return [...element.getClientRects()].filter((rect) => rect.width > 0 || rect.height > 0)
    .map((rect) => ({ top: (rect.top - ctx.top) / ctx.scale, bottom: (rect.bottom - ctx.top) / ctx.scale }));
}

const serials = new WeakMap();
let nextSerial = 1;
const serialOf = (node) => { if (!serials.has(node)) serials.set(node, nextSerial++); return serials.get(node); };

function readRefs(ctx) {
  const refs = [];
  for (const node of ctx.flow.querySelectorAll(FOOTNOTE_REF_SELECTOR)) {
    if (!node.closest('[contenteditable="true"]')) continue;
    const rect = [...node.getClientRects()].find((item) => item.width > 0 || item.height > 0);
    if (!rect) continue;
    const y = (rect.top - ctx.top) / ctx.scale;
    const page = pageIndexOf(y, ctx);
    const lineHeight = parseFloat(getComputedStyle(node.parentElement).lineHeight) || 24;
    refs.push({ node, key: serialOf(node), page, lineHeight, offset: y - page * ctx.stride, label: node.getAttribute("data-fn-index") || node.textContent.trim(), text: node.getAttribute("data-fn-text") || "" });
  }
  return refs;
}

/** Page of a flow position: content boxes are separated by row gaps, so half a gap of tolerance absorbs any rounding. */
const pageIndexOf = (y, ctx) => Math.max(0, Math.floor((y + ctx.rowGap / 2) / ctx.stride));
const onPage = (fragment, index, ctx) => pageIndexOf(fragment.top, ctx) === index;

const NO_CUT = "style,script,template,.thesis-footnote-tail,.academic-footnote-list,[data-export-ignore]";
const REPLACED = /^(IMG|SVG|CANVAS|VIDEO|IFRAME|OBJECT)$/i;
const blockDisplay = (display) => !/^(inline|contents|none)/.test(display) && display !== "ruby";

/**
 * The block to stamp so that page `index` ends above `limit`, or null when nothing
 * on that page reaches below it. Children are in flow order, so a binary search
 * finds the first one reaching below the limit without reading every paragraph.
 */
function cutTarget(container, index, limit, ctx) {
  const pageTop = index * ctx.stride;
  const pageEnd = pageTop + ctx.contentHeight;
  const kids = [...container.children].filter((child) => !child.matches(NO_CUT));
  const lastBottom = (i) => {
    for (let j = i; j >= 0; j -= 1) { const list = fragments(kids[j], ctx); if (list.length) return list[list.length - 1].bottom; }
    return -Infinity;
  };
  let low = 0, high = kids.length;
  while (low < high) { const mid = (low + high) >> 1; if (lastBottom(mid) > limit + 0.5) high = mid; else low = mid + 1; }
  for (let i = low; i < kids.length; i += 1) {
    const child = kids[i];
    const list = fragments(child, ctx);
    if (!list.length) continue;
    const here = list.find((fragment) => onPage(fragment, index, ctx));
    if (!here) { if (pageIndexOf(list[0].top, ctx) > index) return null; continue; }
    if (here.bottom <= limit + 0.5) continue;
    const style = getComputedStyle(child);
    const monolithic = REPLACED.test(child.tagName) || /^inline/.test(style.display)
      || ((/avoid/.test(style.breakInside) || style.display === "table-row") && list.length === 1);
    const moveBefore = (element) => {
      // Keep-with-next: a heading directly above moves with the block it introduces.
      let target = element;
      for (let previous = target.previousElementSibling; previous && /^H[1-6]$/.test(previous.tagName) && /avoid/.test(getComputedStyle(previous).breakAfter); previous = target.previousElementSibling) {
        const box = fragments(previous, ctx).find((fragment) => onPage(fragment, index, ctx));
        if (!box || box.top <= pageTop + 1) break;
        target = previous;
      }
      return { element: target, kind: "break" };
    };
    if (here.top >= limit - 0.5) return here.top <= pageTop + 1 ? null : moveBefore(child);
    if (monolithic) {
      // Already at the top of its page: moving it cannot help, keep looking after it.
      if (here.top <= pageTop + 1) continue;
      return moveBefore(child);
    }
    const hasBlocks = [...child.children].some((node) => !node.matches(NO_CUT) && blockDisplay(getComputedStyle(node).display));
    if (hasBlocks) {
      const inner = cutTarget(child, index, limit, ctx);
      if (inner) return inner;
      // A container that breaks across pages fills its column, so reaching below the
      // limit means nothing by itself; only its own loose text (legacy notes) can cross.
      if (![...child.childNodes].some((node) => node.nodeType === 3 && node.data.replace(/[​-‍⁠﻿]/g, "").trim())) return null;
    }
    return { element: child, kind: "reserve", amount: pageEnd - limit };
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Note allocation. Notes of the page's own references are placed first (Word:
 * a note starts on its reference's page); a continuation carried from the
 * previous page gets the space that is left and is drawn first.
 * ------------------------------------------------------------------------- */
/** Area height for a note list, from the hidden twin; cached per group (same rule, same width). */
function measurer(ctx) {
  const box = ctx.measure;
  return (items) => {
    const key = JSON.stringify(items.map((item) => [item.label, item.text, Boolean(item.continued)]));
    if (ctx.heights.has(key)) return ctx.heights.get(key);
    box.replaceChildren(...footnoteAreaNodes(box.ownerDocument, items, ctx.rule));
    const height = box.getBoundingClientRect().height / ctx.scale;
    if (ctx.heights.size > 4000) ctx.heights.clear();
    ctx.heights.set(key, height);
    return height;
  };
}

/** Longest word prefix of `note` that keeps the whole area within `limit`. */
function splitNote(measure, before, note, after, limit) {
  const tokens = note.text.split(/(?<=\s)/);
  let low = 0, high = tokens.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (measure([...before, { ...note, text: tokens.slice(0, mid).join("").trimEnd() }, ...after]) <= limit + 0.5) low = mid; else high = mid - 1;
  }
  if (!low) return null;
  return { head: { ...note, text: tokens.slice(0, low).join("").trimEnd() }, tail: { ...note, continued: true, text: tokens.slice(low).join("") } };
}

function allocate(ctx, own, carry, cap) {
  const measure = measurer(ctx);
  const items = [];
  const pendingOwn = [];
  let placed = 0;
  // Every reference on the page gets at least the start of its note: a long note is
  // split so that the first word of each later note still fits (Word keeps a note
  // start with its reference). Only when even those starts exceed the cap are the
  // remaining references pushed to the next page.
  const firstWord = (note) => ({ ...note, text: note.text.split(/(?<=\s)/)[0].trimEnd() });
  for (const [index, note] of own.entries()) {
    const rest = own.slice(index + 1).map(firstWord);
    if (measure([...items, note, ...rest]) <= cap + 0.5) { items.push(note); placed += 1; continue; }
    let part = splitNote(measure, items, note, rest, cap);
    // A single word wider than the whole area still starts on its page (deterministic, never lost).
    if (!part && !items.length) {
      const [first, ...tail] = note.text.split(/(?<=\s)/);
      part = { head: { ...note, text: first.trimEnd() }, tail: tail.length ? { ...note, continued: true, text: tail.join("") } : null };
    }
    if (!part) break;
    items.push(part.head); placed += 1;
    if (part.tail) pendingOwn.push(part.tail);
  }
  const carried = [];
  const pendingCarry = [];
  for (const note of carry) {
    if (pendingCarry.length) { pendingCarry.push(note); continue; }
    if (measure([...carried, note, ...items]) <= cap + 0.5) { carried.push(note); continue; }
    const part = splitNote(measure, carried, note, items, cap);
    if (part) { carried.push(part.head); pendingCarry.push(part.tail); } else pendingCarry.push(note);
  }
  const all = [...carried, ...items];
  return { items: all, placed, pending: [...pendingCarry, ...pendingOwn], height: all.length ? measure(all) : 0 };
}

const noteSig = (notes) => JSON.stringify(notes.map((note) => [note.key, note.label, note.text, Boolean(note.continued)]));
const refSig = (refs) => JSON.stringify(refs.map((ref) => [ref.key, ref.label, ref.text]));
const noteOf = (ref) => ({ key: ref.key, label: ref.label, text: ref.text });

/**
 * Where the body before a pushed reference ends: the top of a reserved block, or the
 * bottom of the content before a forced break. If text above is added or deleted it
 * moves, and the push must be decided again from the natural layout.
 */
function pushAnchor(stamp, ctx) {
  if (!stamp) return null;
  if (stamp.kind === "reserve") return fragments(stamp.element, ctx)[0]?.top ?? null;
  for (let node = stamp.element; node && node !== ctx.flow; node = node.parentElement) {
    const previous = node.previousElementSibling;
    if (previous) { const list = fragments(previous, ctx); return list.length ? list[list.length - 1].bottom : null; }
  }
  return null;
}

/**
 * "valid": page `index` still shows exactly what was computed for it and its body
 * stays above its limit. "retarget": same notes and limit, but text moved, so another
 * block now crosses the limit. false: recompute the page.
 */
function recordState(record, index, refs, carry, ctx) {
  if (!record || record.carrySig !== noteSig(carry)) return false;
  if (record.ownSig !== refSig(refs.filter((ref) => ref.page === index))) return false;
  if (record.pushed) {
    const next = refs.find((ref) => ref.page > index);
    if (!next || next.key !== record.pushed.key || next.page !== index + 1 || Math.abs(next.offset - record.pushed.offset) > 1) return false;
    const anchor = pushAnchor(record.stamp, ctx);
    if (anchor === null || record.pushed.anchor === null || Math.abs(anchor - record.pushed.anchor) > 1) return false;
  }
  if (record.stamp && (!record.stamp.element.isConnected || record.stamp.element.getAttribute(STAMP) !== record.stamp.kind || !ctx.flow.contains(record.stamp.element))) return false;
  if (record.limit >= ctx.contentHeight - 0.5) return "valid";
  const cut = cutTarget(ctx.flow, index, index * ctx.stride + record.limit, ctx);
  if (!cut) return "valid";
  // A reserved block legitimately reaches the page end with its padding, and must continue on the next page.
  if (record.stamp?.kind === "reserve" && cut.element === record.stamp.element && fragments(cut.element, ctx).some((fragment) => pageIndexOf(fragment.top, ctx) > index)) return "valid";
  // A limit set by a pushed reference is a line position, not a note height: recompute.
  return record.pushed ? false : "retarget";
}

/** Move the stamp of an otherwise valid page to the block that now crosses its limit. */
function retargetPage(ctx, index, record) {
  const owner = `${ctx.groupId}:${index}`;
  releaseStamp(record.stamp, owner);
  const cut = cutTarget(ctx.flow, index, index * ctx.stride + record.limit, ctx);
  const next = { ...record, stamp: cut ? applyStamp(cut, owner) : null };
  if (next.ownSig === refSig(readRefs(ctx).filter((ref) => ref.page === index))) return next;
  releaseStamp(next.stamp, owner);
  return null;
}

function layoutPage(ctx, index, carry, previous) {
  const owner = `${ctx.groupId}:${index}`;
  releaseStamp(previous?.stamp, owner);
  const natural = readRefs(ctx);
  const onPage = natural.filter((ref) => ref.page === index);
  const cap = ctx.contentHeight * ctx.rule.maxAreaPercent / 100;
  let count = onPage.length;
  for (let guard = 0; guard <= onPage.length + 1; guard += 1) {
    const allocation = allocate(ctx, onPage.slice(0, count).map(noteOf), carry, cap);
    const pushedRef = allocation.placed < onPage.length ? onPage[allocation.placed] : null;
    let limit = allocation.items.length ? ctx.contentHeight - allocation.height : ctx.contentHeight;
    // Push the first reference without a note start to the next page, unless it is on the
    // page's first line (pushing it would empty the page and repeat there).
    if (pushedRef && pushedRef.offset > pushedRef.lineHeight) limit = Math.min(limit, pushedRef.offset);
    const record = {
      limit, ownSig: refSig(onPage), carrySig: noteSig(carry), items: allocation.items, pending: allocation.pending, height: allocation.height,
      pushed: pushedRef ? { key: pushedRef.key, offset: 0 } : null, stamp: null,
    };
    if (limit < ctx.contentHeight - 0.5) {
      const cut = cutTarget(ctx.flow, index, index * ctx.stride + limit, ctx);
      if (cut) record.stamp = applyStamp(cut, owner);
    }
    const after = readRefs(ctx);
    const stayed = onPage.slice(0, allocation.placed).filter((ref) => after.find((item) => item.node === ref.node)?.page === index).length;
    if (stayed >= allocation.placed || guard === onPage.length + 1) {
      const next = after.find((ref) => ref.page > index);
      if (record.pushed) { record.pushed.offset = next?.key === record.pushed.key ? next.offset : -1; record.pushed.anchor = pushAnchor(record.stamp, ctx); }
      record.ownSig = refSig(after.filter((ref) => ref.page === index));
      return record;
    }
    releaseStamp(record.stamp, owner);
    count = stayed;
  }
  return null;
}

/**
 * One layout pass over one page group. `state` persists between passes (in memory
 * only) so a page whose inputs did not change keeps its stamp without relayout.
 * Returns the view: note items and area height per page index, plus the number of
 * continuation-only pages needed after the body.
 */
export function layoutGroupFootnotes({ article, group, rule, state, deadline = Infinity }) {
  const flow = article.querySelector(".thesis-page-flow");
  const stack = article.parentElement;
  const measure = stack?.querySelector("[data-thesis-footnote-measure]");
  const metrics = pageMetrics(group.rules.page);
  const view = { pages: {}, tail: 0, incomplete: false };
  if (!flow || !measure) return view;
  const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
  const ctx = { groupId: group.id, flow, measure, rule, scale, heights: state.heights ||= new Map(), top: flow.getBoundingClientRect().top, stride: flowPagePitchPx(metrics), rowGap: metrics.rowGapPx, contentHeight: Math.floor(metrics.contentHeightPx * 64) / 64 };
  const ruleSig = JSON.stringify([rule, metrics.contentHeightPx, metrics.contentWidthPx]);
  if (state.ruleSig !== ruleSig) {
    for (const record of state.pages || []) releaseStamp(record?.stamp, `${group.id}:${state.pages.indexOf(record)}`);
    state.pages = []; state.ruleSig = ruleSig; ctx.heights.clear();
  }
  // Stamps copied by the browser (Enter clones the split paragraph's attributes) or left by removed pages.
  const owned = new Set(state.pages.map((record) => record?.stamp?.element).filter(Boolean));
  for (const element of flow.querySelectorAll(`[${STAMP}]`)) if (!owned.has(element)) clearStamp(element);

  const tailCount = flow.querySelectorAll(".thesis-footnote-tail").length;
  const bodyPages = () => Math.max(1, pageCountFromFlowHeight(flow.offsetHeight, metrics) - tailCount);
  let carry = [];
  const pages = [];
  const viewOf = (record) => ({ items: record.items.map(({ label, text, continued }) => ({ label, text, continued: Boolean(continued) })), height: round(record.height) });
  let changed = false;
  for (let index = 0; index < bodyPages() && index < 2000; index += 1) {
    const refs = readRefs(ctx);
    const previous = state.pages[index];
    const hasWork = carry.length || refs.some((ref) => ref.page === index) || previous?.stamp;
    const verdict = hasWork ? recordState(previous, index, refs, carry, ctx) : "empty";
    // Frame budget: pages are re-laid from the first changed one onward (the edited,
    // visible page first). Once the budget is spent, later pages keep their previous
    // stamps and notes and the caller resumes on the next frame.
    if (verdict !== "valid" && verdict !== "empty" && changed && performance.now() > deadline) {
      view.incomplete = true;
      for (const [offset, record] of state.pages.slice(index).entries()) {
        pages[index + offset] = record;
        if (record?.items.length) view.pages[index + offset] = viewOf(record);
      }
      break;
    }
    let record;
    if (verdict === "empty") record = { limit: ctx.contentHeight, ownSig: refSig([]), carrySig: noteSig([]), items: [], pending: [], height: 0, pushed: null, stamp: null };
    else if (verdict === "valid") record = previous;
    else {
      changed = true;
      record = (verdict === "retarget" && retargetPage(ctx, index, previous)) || layoutPage(ctx, index, carry, previous)
        || { limit: ctx.contentHeight, ownSig: "", carrySig: "", items: [], pending: carry, height: 0, pushed: null, stamp: null };
    }
    pages[index] = record;
    if (record.items.length) view.pages[index] = viewOf(record);
    carry = record.pending;
  }
  if (view.incomplete) { state.pages = pages; view.tail = tailCount; measure.replaceChildren(); return view; }
  for (let index = pages.length; index < state.pages.length; index += 1) releaseStamp(state.pages[index]?.stamp, `${group.id}:${index}`);
  state.pages = pages;
  // A note longer than the rest of the document continues on continuation-only pages after the body.
  const cap = ctx.contentHeight * rule.maxAreaPercent / 100;
  for (let index = pages.length; carry.length && view.tail < 50; index += 1) {
    const allocation = allocate(ctx, [], carry, cap);
    if (!allocation.items.length) {
      const [first, ...rest] = carry;
      const part = { ...first, text: first.text.split(/(?<=\s)/)[0] };
      allocation.items = [part]; allocation.height = measurer(ctx)([part]);
      allocation.pending = [...(first.text.length > part.text.length ? [{ ...first, continued: true, text: first.text.slice(part.text.length) }] : []), ...rest];
    }
    view.pages[index] = viewOf(allocation);
    view.tail += 1;
    carry = allocation.pending;
  }
  measure.replaceChildren();
  return view;
}

/**
 * Every paged group of the editor. `views` is the view model for all sheets;
 * `incomplete` means the frame budget ran out and the caller continues next frame.
 */
export function layoutThesisFootnotes(root, groups, state, deadline = Infinity) {
  const views = {};
  let incomplete = false;
  for (const group of groups) {
    const rule = group.rules.footnotes;
    if (!rule || rule.placement !== "pageBottom") continue;
    const article = [...root.querySelectorAll(".thesis-paper[data-thesis-section]")].find((node) => node.getAttribute("data-thesis-section") === group.id);
    if (!article || article.dataset.thesisLayout !== "paged") continue;
    state[group.id] ||= {};
    const { incomplete: partial, ...view } = layoutGroupFootnotes({ article, group, rule, state: state[group.id], deadline });
    incomplete ||= partial;
    if (Object.keys(view.pages).length || view.tail) views[group.id] = view;
  }
  return { views, incomplete };
}
