/**
 * Overflow detection for special pages (cover, approval, declaration, ...).
 *
 * Rule (advisory only; nothing is clipped, hidden or shrunk):
 * - A block is FIXED when the template anchors it (`layoutMode` absolute/anchored); every
 *   other block is FLOWING and follows the previous one.
 * - Flowing content may grow until it reaches the next fixed block below it or the bottom
 *   margin of the content box. Reaching a fixed block (rectangles intersect) is an overlap;
 *   passing the bottom margin is overflow, measured in mm. Fixed blocks are checked against
 *   the physical page edge instead, because anchored items may legitimately sit in a margin.
 * - A block that lies completely inside another one (frame around text) is containment,
 *   not an overlap.
 */
import { convertLength } from "./units.js";
import { specialPageSpacerMinMm, walkSpecialPage } from "./specialPages.js";

const TOLERANCE_PX = 0.75;
const PX_PER_MM = convertLength(1, "mm", "px");
const toMm = (px) => px / PX_PER_MM;
const round1 = (value) => Math.round(value * 10) / 10;

const contains = (outer, inner) => inner.left >= outer.left - TOLERANCE_PX && inner.right <= outer.right + TOLERANCE_PX && inner.top >= outer.top - TOLERANCE_PX && inner.bottom <= outer.bottom + TOLERANCE_PX;
const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOLERANCE_PX && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOLERANCE_PX;

/**
 * @param {{contentBox:{top:number,bottom:number}, pageBox?:{top:number,bottom:number},
 *          blocks:Array<{id:string,label?:string,fixed:boolean,left:number,top:number,right:number,bottom:number}>}} input px values
 * @returns {{overflowMm:number, overlaps:Array<{a:string,b:string,overlapMm:number}>, status:'ok'|'overflow'|'overlap'}}
 *          `overflow` wins over `overlap` when both occur.
 */
export function evaluateSpecialPageFit({ contentBox, pageBox, blocks = [] } = {}) {
  const limit = (block) => (block.fixed ? (pageBox?.bottom ?? contentBox.bottom) : contentBox.bottom);
  let overflowPx = 0;
  for (const block of blocks) overflowPx = Math.max(overflowPx, block.bottom - limit(block));
  const overlaps = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const flowing = blocks[index];
    for (const fixed of blocks.slice(index + 1)) {
      // Positioned titles and labels can collide with one another as they grow, too.
      if (!flowing.fixed && !fixed.fixed) continue;
      if (fixed.top < flowing.top - TOLERANCE_PX && fixed.bottom <= flowing.top + TOLERANCE_PX) continue;
      if (!intersects(flowing, fixed) || contains(fixed, flowing) || contains(flowing, fixed)) continue;
      const depth = Math.min(flowing.bottom, fixed.bottom) - Math.max(flowing.top, fixed.top);
      overlaps.push({ a: flowing.id, b: fixed.id, overlapMm: round1(toMm(depth)) });
    }
  }
  const overflowMm = overflowPx > TOLERANCE_PX ? round1(toMm(overflowPx)) : 0;
  return { overflowMm, overlaps, status: overflowMm > 0 ? "overflow" : overlaps.length ? "overlap" : "ok" };
}

const formatMm = (value) => String(value).replace(".", ",");

/** Turkish advisory messages for one measured page; empty when everything fits. */
export function specialPageKindLabel(type) {
  const key = String(type || "").toLowerCase();
  if (/cover|kapak/.test(key)) return "Kapak";
  if (/approval|onay/.test(key)) return "Onay";
  if (/ethic|etik/.test(key)) return "Etik";
  if (/declar|bildir/.test(key)) return "Bildirim";
  return "Özel";
}

export function specialPageFitWarnings(fit, title, type) {
  const kind = specialPageKindLabel(type);
  if (!fit || fit.status === "ok") return [];
  const out = [];
  if (fit.overflowMm > 0) out.push(`${kind} sayfasında içerik ${formatMm(fit.overflowMm)} mm taşıyor: ${title}`);
  if (fit.overlaps.length) out.push(`${kind} sayfasında ${fit.overlaps.length} öğe üst üste biniyor (en çok ${formatMm(Math.max(...fit.overlaps.map((item) => item.overlapMm)))} mm): ${title}`);
  return out;
}

/**
 * Measure the rendered special-page sections inside `root` (the editor's page stack).
 * `groups` are the page groups ({ sections:[{id,title,type,specialPage}], rules:{page} }); `pageMetrics`
 * converts a page rule to px metrics. Returns [{ sectionId, title, type, fit, messages }].
 */
export function measureSpecialPageFit(root, groups, pageMetrics) {
  const results = [];
  if (!root || !Array.isArray(groups)) return results;
  for (const group of groups) {
    const metrics = pageMetrics(group.rules.page);
    for (const section of group.sections || []) {
      if (!section.specialPage) continue;
      const node = root.querySelector(`[data-thesis-flow-section="${CSS.escape(section.id)}"]`);
      if (!node) continue;
      const flow = node.closest(".thesis-page-flow") || node;
      const article = flow.closest(".thesis-paper") || flow;
      // The page stack is CSS-scaled by the editor zoom: rects are in screen px, layout is in CSS px.
      const scale = article.offsetWidth ? article.getBoundingClientRect().width / article.offsetWidth : 1;
      const flowTop = flow.getBoundingClientRect().top / scale;
      const px = (rect) => ({ left: rect.left / scale, right: rect.right / scale, top: rect.top / scale, bottom: rect.bottom / scale });
      const top = node.getBoundingClientRect().top / scale;
      const blocks = [...node.querySelectorAll("[data-thesis-block]")]
        // A display:contents group has a zero rectangle; measure its leaves instead.
        // Empty spacers are gaps, never collision obstacles.
        .filter((element) => !element.classList.contains("thesis-layout-spacer") && !element.classList.contains("thesis-layout-group"))
        .map((element) => {
          const rect = px(element.getBoundingClientRect());
          // Only visible content counts: an empty spacer is a gap, never an obstacle.
          const fixed = ["absolute", "fixed"].includes(getComputedStyle(element).position);
          return { id: element.getAttribute("data-thesis-block"), fixed, ...rect };
        })
        .filter((block) => block.right - block.left > 0 && block.bottom - block.top > 0);
      const fit = evaluateSpecialPageFit({
        contentBox: { top, bottom: top + metrics.contentHeightPx },
        pageBox: { top: flowTop - metrics.topMarginPx, bottom: flowTop - metrics.topMarginPx + metrics.heightPx },
        blocks,
      });
      results.push({ sectionId: section.id, title: section.title, type: section.type, fit, messages: specialPageFitWarnings(fit, section.title, section.type) });
    }
  }
  return results;
}

const PX_PER_MM_FIT = 96 / 25.4;
export const elasticSpacerKey = (sectionId, path) => `${sectionId}:${path}`;

/** Keep source anchors until growing text meets the next anchor. Only move down;
 * the fit warning remains responsible for content beyond the physical page. */
export function reflowPositionedSpecialPage(blocks = []) {
  const placed = [];
  const shifts = {};
  for (const block of [...blocks].sort((a, b) => a.top - b.top)) {
    let top = block.top;
    if (block.fixed) {
      for (const previous of placed) {
        if (Math.min(block.right, previous.right) - Math.max(block.left, previous.left) <= TOLERANCE_PX) continue;
        // Source-overlapping boxes (e.g. a frame behind its contents) are intentional.
        if (previous.fixed && previous.top + previous.nominalHeight > block.top + TOLERANCE_PX) continue;
        if (!previous.fixed && (contains(previous, block) || contains(block, previous))) continue;
        top = Math.max(top, previous.placedBottom);
      }
      shifts[block.id] = top - block.top;
    }
    placed.push({ ...block, placedBottom: top + block.bottom - block.top });
  }
  return shifts;
}

/** Read transient measured positions without altering the saved template/model.
 * CSS translate is separate from the Word baseline's paint-only transform. */
export function measurePositionedSpecialPages(root, model) {
  const rules = [];
  const positions = {};
  if (!root || !model?.sections) return { css: "", positions };
  for (const section of model.sections) {
    if (!section.specialPage || !section.standalone || section.editable) continue;
    const host = root.querySelector(`[data-thesis-flow-section="${CSS.escape(section.id)}"]`);
    if (!host) continue;
    const body = host.querySelector(":scope > .thesis-body");
    // Elastic gaps are useful only when their minimum leaves enough room for all
    // content. Otherwise preserve the authored gaps and let the page fragment,
    // just as Word does; squeezing an impossible page hides its continuation.
    if (body && !["bottom", "center"].includes(section.verticalAlign)) {
      const page = section.rules?.page;
      const available = page && (page.heightMm - page.margins.topMm - page.margins.bottomMm) * PX_PER_MM;
      const nodes = new Map([...walkSpecialPage(section.layout)].map((node) => [node.path, node]));
      const flatten = (children) => [...children].flatMap((child) => getComputedStyle(child).display === "contents" ? flatten(child.children) : [child]);
      let minimum = 0;
      for (const child of flatten(body.children)) {
        const style = getComputedStyle(child);
        if (["absolute", "fixed"].includes(style.position)) continue;
        const path = child.getAttribute("data-thesis-block");
        const node = nodes.get(path);
        const marginNode = path?.endsWith("~m") ? nodes.get(path.slice(0, -2)) : null;
        minimum += child.classList.contains("thesis-layout-spacer")
          ? specialPageSpacerMinMm(node || { heightMm: marginNode?.marginTopMm || 0 }) * PX_PER_MM
          : [...child.getClientRects()].reduce((height, rect) => height + rect.height, 0) / (body.offsetWidth ? body.getBoundingClientRect().width / body.offsetWidth : 1);
        minimum += (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
      }
      if (Number.isFinite(available) && minimum > available + TOLERANCE_PX) {
        const scope = `[data-thesis-flow-section="${CSS.escape(section.id)}"]`;
        rules.push(`${scope}>.thesis-body{display:block!important;height:auto!important;contain:none!important;}`);
        // A fixed-height Word text frame cannot continue onto another page. The
        // exporter projects its authored content rectangle to section margins.
        positions[elasticSpacerKey(section.id, "~flow")] = { overflow: true };
      }
    }
    const article = host.closest(".thesis-paper") || host;
    const scale = article.offsetWidth ? article.getBoundingClientRect().width / article.offsetWidth : 1;
    const blocks = [];
    for (const node of walkSpecialPage(section.layout)) {
      if (node.type !== "text") continue;
      const element = host.querySelector(`[data-thesis-block="${CSS.escape(node.path)}"]`);
      if (!element) continue;
      const style = getComputedStyle(element);
      const fixed = ["absolute", "fixed"].includes(style.position);
      const rect = element.getBoundingClientRect();
      // Undo our last measured shift before computing again (also after title deletion).
      const previousShift = fixed ? (parseFloat(style.translate.split(/\s+/)[1]) || 0) : 0;
      const top = rect.top / scale - previousShift;
      if (!(rect.width > 0 && rect.height > 0)) continue;
      blocks.push({ id: node.path, fixed, top, bottom: top + rect.height / scale, left: rect.left / scale, right: rect.right / scale, nominalHeight: Number.isFinite(node.heightMm) ? node.heightMm * PX_PER_MM : rect.height / scale });
    }
    const shifts = reflowPositionedSpecialPage(blocks);
    for (const block of blocks.filter((item) => item.fixed)) {
      // CSS serializes computed translate values with finite precision. Undoing
      // that translation can leave tiny positive residues on every measurement,
      // producing a new stylesheet and restarting pagination indefinitely.
      // Canonicalize transient measurements far below a browser layout pixel.
      const canonicalMm = (value) => Math.round(value * 1e5) / 1e5;
      const shiftMm = canonicalMm((shifts[block.id] || 0) / PX_PER_MM);
      const heightMm = canonicalMm((block.bottom - block.top) / PX_PER_MM);
      positions[elasticSpacerKey(section.id, block.id)] = { shiftMm, heightMm };
      if (shiftMm > 0) rules.push(`[data-thesis-flow-section="${CSS.escape(section.id)}"] [data-thesis-block="${CSS.escape(block.id)}"]{translate:0 ${shiftMm}mm;}`);
    }
  }
  return { css: rules.join("\n"), positions };
}

/**
 * Effective (possibly shrunk) heights of the elastic top-level spacers and the natural content height of
 * every standalone special page, read from the rendered editor. Word has no flexbox: the DOCX writer
 * receives `{ spacers: { "<sectionId>:<blockPath>": mm }, contentMm: { "<sectionId>": mm } }`.
 */
export function measureElasticSpecialPages(root) {
  const spacers = {};
  const contentMm = {};
  if (!root?.querySelectorAll) return { spacers, contentMm };
  for (const fragment of root.querySelectorAll("[data-thesis-flow-section]")) {
    const body = fragment.querySelector(":scope > .thesis-body");
    if (!body || getComputedStyle(body).display !== "flex") continue;
    const id = fragment.getAttribute("data-thesis-flow-section");
    const scale = body.offsetWidth ? body.getBoundingClientRect().width / body.offsetWidth : 1;
    let top = Infinity; let bottom = -Infinity;
    const flatten = (nodes) => [...nodes].flatMap((child) => (getComputedStyle(child).display === "contents" ? flatten(child.children) : [child]));
    const items = flatten(body.children);
    for (const child of items) {
      if (child.classList.contains("thesis-layout-spacer")) {
        // computed height is the unscaled layout height after flex shrinking
        spacers[elasticSpacerKey(id, child.getAttribute("data-thesis-block"))] = parseFloat(getComputedStyle(child).height) / PX_PER_MM_FIT;
      }
      if (["absolute", "fixed"].includes(getComputedStyle(child).position)) continue;
      const rect = child.getBoundingClientRect();
      top = Math.min(top, rect.top); bottom = Math.max(bottom, rect.bottom);
    }
    if (bottom > top) contentMm[id] = (bottom - top) / scale / PX_PER_MM_FIT;
  }
  return { spacers, contentMm };
}
