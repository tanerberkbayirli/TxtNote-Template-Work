/** Read the typography the browser actually paints, in document units.
 * CSS transforms (page zoom) do not change computed font-size, so px -> pt
 * needs no zoom correction. Decorations/backgrounds may live on ancestors.
 */
import { FORMAT_COLORS, FORMAT_HIGHLIGHTS } from "../config/format.js";

export function renderedTextFormat(node, boundary) {
  const element = node?.nodeType === 3 ? node.parentElement : node;
  if (!element?.isConnected) return {};
  const computed = getComputedStyle(element);
  const colorHex = value => {
    const channels = value?.match(/^rgba?\(([^)]+)\)/)?.[1].match(/[\d.]+/g)?.map(Number);
    if (!channels || channels.length < 3 || (channels.length > 3 && channels[3] === 0)) return "";
    return `#${channels.slice(0, 3).map(channel => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
  };
  const decoration = new Set();
  let highlight = "";
  for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    for (const line of style.textDecorationLine.split(/\s+/)) if (line !== "none") decoration.add(line);
    highlight ||= colorHex(style.backgroundColor);
    if (ancestor === boundary || ancestor.matches('[contenteditable="true"],[contenteditable="plaintext-only"]')) break;
  }
  const px = parseFloat(computed.fontSize);
  return {
    sizePt: Number.isFinite(px) ? Math.round(px * .75 * 1000) / 1000 : undefined,
    fontFamily: computed.fontFamily,
    bold: parseInt(computed.fontWeight, 10) >= 600,
    italic: /italic|oblique/.test(computed.fontStyle),
    underline: decoration.has("underline"), strike: decoration.has("line-through"), overline: decoration.has("overline"),
    decoration: [...decoration].join(" ") || "none",
    color: FORMAT_COLORS.find(item => item.swatch === colorHex(computed.color))?.id || colorHex(computed.color) || computed.color,
    highlight: FORMAT_HIGHLIGHTS.find(item => item.swatch === highlight)?.id || highlight,
    align: computed.textAlign === "start" ? "left" : computed.textAlign === "end" ? "right" : computed.textAlign,
  };
}
