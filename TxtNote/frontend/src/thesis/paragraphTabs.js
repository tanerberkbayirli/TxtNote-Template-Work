import { resolveIndent, resolveTabStops } from "./typography.js";

const PX_PER_MM = 96 / 25.4;
const quote = (s) => String(s).replace(/["\\]/g, "\\$&");

/** Source text always retains a tab. Leader glyphs and widths are presentation only. */
export function measureParagraphTabsCss(root, model) {
  if (!root || !model) return "";
  const doc = root.ownerDocument;
  const rules = [];
  let ordinal = 0;
  for (const section of model.sections || []) {
    const hosts = root.querySelectorAll(`:is([data-thesis-section="${quote(section.id)}"],[data-thesis-flow-section="${quote(section.id)}"]) .thesis-body p`);
    for (const paragraph of hosts) {
      const style = { ...section.rules.body, ...section.rules.paragraphStyles?.[paragraph.dataset.thesisStyle] };
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
        const glyph = { dots: ".", hyphen: "-", underscore: "_" }[stop.leader];
        const leaderCanvas = doc.createElement("canvas"), leaderContext = leaderCanvas.getContext("2d");
        leaderContext.font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
        const glyphWidth = glyph ? leaderContext.measureText(glyph).width : 0;
        const leaderText = glyphWidth > 0 ? glyph.repeat(Math.max(0, Math.floor(width / glyphWidth))) : "";
        if (leader.textContent !== leaderText) leader.textContent = leaderText;
        rules.push(`[data-thesis-tab="${id}"]{display:inline-block;width:${Math.round(width * 10000) / 10000}px;text-indent:0;white-space:normal;vertical-align:baseline;position:relative;overflow:hidden}[data-thesis-tab="${id}"]>i{position:absolute;inset:0;font:inherit;white-space:nowrap;pointer-events:none}`);
      }
    }
  }
  return rules.join("\n");
}
