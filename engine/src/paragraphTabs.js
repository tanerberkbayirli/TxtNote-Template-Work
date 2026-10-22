import { resolveIndent, resolveTabStops } from "./typography.js";

const PX_PER_MM = 96 / 25.4;
const quote = (s) => String(s).replace(/["\\]/g, "\\$&");
const nativeRowCache = new WeakMap();

/** Word advances leader glyphs in whole 1/600-inch device units (hyphen 12 pt TNR: 3.996 pt -> 33 units = 3.96 pt in Word's PDF). CSS px in, CSS px out. */
export const wordLeaderAdvancePx = (nominalPx) => nominalPx > 0 ? Math.max(1, Math.round(nominalPx * 0.75 * 600 / 72)) * 72 / 600 / 0.75 : 0;

/**
 * Word draws leader glyphs on a grid of whole advances anchored at the page's left edge (measured: glyph origins are multiples of the advance and
 * identical on every row): the first grid point at/after the tab start, keeping only glyphs that end inside the tab. startPx is the tab start from the page edge.
 */
export function leaderGrid(startPx, widthPx, advancePx) {
  if (!(advancePx > 0)) return { offset: 0, count: 0 };
  const offset = Math.max(0, Math.ceil(startPx / advancePx - 1e-4) * advancePx - startPx);
  return { offset, count: Math.max(0, Math.floor((widthPx - offset) / advancePx + 1e-4)) };
}

/** Source text always retains a tab. Leader glyphs and widths are presentation only. */
export function measureParagraphTabsCss(root, model) {
  if (!root || !model) return "";
  const doc = root.ownerDocument;
  const rules = [];
  let ordinal = 0;
  let sourceRows = new Map();
  if (model.nativeDocument?.formatMode === 'source') {
    const cached = nativeRowCache.get(model.nativeDocument);
    if (cached) { sourceRows = cached.rows; rules.push(...cached.rules); }
    else {
    const sourceTabRules = [];
    const pageReference = n => /^\s*PAGEREF\b/i.test(n.attributes?.['data-docx-instruction'] || '') || (n.children || []).some(pageReference);
    const visit = nodes => { for (const n of nodes || []) {
      if (n.type === 'paragraph' && pageReference(n)) {
        sourceRows.set(n.id, n.properties?.resolvedSource || {});
        const tabsOnly = children => { for (const child of children || []) {
          if (child.type === 'run' && child.children?.length && child.children.every(c => c.type === 'tab')) sourceTabRules.push(`.thesis-paper .thesis-body [data-txt-node-id="${quote(child.id)}"][data-txt-node-id]{line-height:0}`);
          else if (child.type !== 'paragraph' && child.type !== 'drawing') tabsOnly(child.children);
        } };
        // Tabs carry spacing and leaders, but no glyph ascent/descent. A small
        // fallback font on a tab must not enlarge the enclosing text line.
        tabsOnly(n.children);
      }
      visit(n.children);
    } };
    model.nativeDocument.sections.forEach(s => visit(s.nodes));
    nativeRowCache.set(model.nativeDocument, { rows: sourceRows, rules: sourceTabRules });
    rules.push(...sourceTabRules);
    }
  }
  // One document pass grouped by owning section (a selector per section was O(sections x nodes) on every measurement).
  const sectionIds = new Set((model.sections || []).map((section) => String(section.id)));
  const hostsBySection = new Map();
  for (const paragraph of root.querySelectorAll(".thesis-body p")) {
    const host = paragraph.closest("[data-thesis-section],[data-thesis-flow-section]");
    if (!host) continue;
    const id = host.getAttribute("data-thesis-section") ?? host.getAttribute("data-thesis-flow-section");
    if (!sectionIds.has(id)) continue;
    (hostsBySection.get(id) || hostsBySection.set(id, []).get(id)).push(paragraph);
  }
  for (const section of model.sections || []) {
    const hosts = hostsBySection.get(String(section.id)) || [];
    for (const paragraph of hosts) {
      // Cached native index rows carry their own left/right leader stops.
      // Default repeating browser tabs can wrap only the final page reference
      // onto another line, pushing the last index entry onto a blank sheet.
      const style = { ...section.rules.body, ...section.rules.paragraphStyles?.[paragraph.dataset.thesisStyle], ...sourceRows.get(paragraph.dataset.txtNodeId) };
      const stops = resolveTabStops(style);
      if (!stops.length) continue;
      const walker = doc.createTreeWalker(paragraph, 4);
      const texts = [];
      while (walker.nextNode()) if (walker.currentNode.data.includes("\t") && !walker.currentNode.parentElement.closest("[data-thesis-tab]")) texts.push(walker.currentNode);
      for (const text of texts) {
        const fragment = doc.createDocumentFragment();
        text.data.split("\t").forEach((part, i) => {
          if (i) {
            const tab = doc.createElement("span");
            tab.dataset.thesisTab = "";
            const leader = doc.createElement("i");
            leader.dataset.thesisTabLeader = "";
            leader.setAttribute("aria-hidden", "true");
            tab.append(leader, doc.createTextNode("\t"));
            fragment.append(tab);
          }
          if (part) fragment.append(doc.createTextNode(part));
        });
        text.replaceWith(fragment);
      }
      const tabs = [...paragraph.querySelectorAll("[data-thesis-tab]")];
      if (!tabs.length) continue;
      const box = paragraph.getBoundingClientRect();
      const css = getComputedStyle(paragraph);
      const scale = box.width / (paragraph.offsetWidth || box.width || 1);
      const left = box.left + parseFloat(css.paddingLeft || 0) * scale;
      for (const [i, tab] of tabs.entries()) {
        const tabBox = tab.getBoundingClientRect();
        const current = (tabBox.left - left) / scale + resolveIndent(style).left * PX_PER_MM;
        const stop = stops.find((item) => item.positionMm * PX_PER_MM > current + 0.1) || stops.at(-1);
        const range = doc.createRange();
        range.setStartAfter(tab);
        if (tabs[i + 1]) range.setEndBefore(tabs[i + 1]); else range.setEnd(paragraph, paragraph.childNodes.length);
        const following = range.getBoundingClientRect().width / scale;
        let correction = stop.align === "right" ? following : stop.align === "center" ? following / 2 : 0;
        if (stop.align === "decimal") {
          const text = range.toString(), decimal = text.indexOf(stop.decimalCharacter || (/^tr(?:-|$)/i.test(model.language || "") ? "," : "."));
          const canvas = doc.createElement("canvas"), context = canvas.getContext("2d");
          context.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
          correction = context.measureText(decimal < 0 ? text : text.slice(0, decimal)).width;
        }
        const width = Math.max(0, stop.positionMm * PX_PER_MM - current - correction);
        if (tab.style.width !== `${width}px`) tab.style.width = `${width}px`;
        const id = `tab-${ordinal++}`;
        if (tab.dataset.thesisTab !== id) tab.dataset.thesisTab = id;
        const leader = tab.querySelector("[data-thesis-tab-leader]");
        const glyph = { dots: ".", dot: ".", hyphen: "-", underscore: "_" }[stop.leader];
        const leaderCanvas = doc.createElement("canvas"), leaderContext = leaderCanvas.getContext("2d");
        leaderContext.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        // Word advances leader glyphs in whole 1/600-inch device units (hyphen 12 pt: 3.996 pt -> 33 units = 3.96 pt in Word's PDF).
        const glyphWidth = wordLeaderAdvancePx(glyph ? leaderContext.measureText(glyph).width : 0);
        const { offset, count } = leaderGrid((section.rules.page?.margins?.leftMm || 0) * PX_PER_MM + current, width, glyphWidth);
        const leaderText = glyph ? glyph.repeat(count) : "";
        if (leader.textContent !== leaderText) leader.textContent = leaderText;
        const leaderLeft = `${Math.round(offset * 10000) / 10000}px`;
        if (leader.style.left !== leaderLeft) leader.style.left = leaderLeft;
        rules.push(`[data-thesis-tab="${id}"]{display:inline-block;width:${Math.round(width * 10000) / 10000}px;text-indent:0;white-space:pre;vertical-align:baseline;position:relative}[data-thesis-tab="${id}"]>i{position:absolute;inset:0;font:inherit;white-space:nowrap;pointer-events:none}`);
      }
    }
  }
  return rules.join("\n");
}
