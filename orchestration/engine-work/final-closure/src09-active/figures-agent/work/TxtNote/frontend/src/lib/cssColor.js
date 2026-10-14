/**
 * html2canvas cannot parse modern CSS colors (oklch, oklab, color-mix).
 * Convert them to rgb() so PDF export can paint the live page.
 */

const UNSUPPORTED = /oklch|oklab|\blch\(|\blab\(|color-mix|light-dark|\bcolor\(/i;

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function srgbEncode(channel) {
  const abs = Math.abs(channel);
  const encoded =
    abs <= 0.0031308 ? 12.92 * channel : Math.sign(channel) * (1.055 * abs ** (1 / 2.4) - 0.055);
  return clampByte(encoded * 255);
}

/** CSS Color 4 oklab → sRGB. */
export function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [srgbEncode(r), srgbEncode(g), srgbEncode(bl)];
}

function parseNumber(token, percentScale = 1) {
  const value = String(token ?? "").trim();
  if (!value) return NaN;
  if (value.endsWith("%")) return (Number.parseFloat(value) / 100) * percentScale;
  return Number.parseFloat(value);
}

function parseHue(token) {
  const value = String(token ?? "").trim();
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return 0;
  if (/turn/i.test(value)) return n * 360;
  if (/rad/i.test(value)) return (n * 180) / Math.PI;
  return n;
}

function rgbCss([r, g, b], alpha) {
  if (Number.isFinite(alpha) && alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function splitArgs(inner) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const ch of inner) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function extractFunction(css, start) {
  const open = css.indexOf("(", start);
  if (open < 0) return null;
  let depth = 1;
  let index = open + 1;
  while (index < css.length && depth > 0) {
    if (css[index] === "(") depth += 1;
    else if (css[index] === ")") depth -= 1;
    index += 1;
  }
  return { start, end: index, text: css.slice(start, index) };
}

export function oklchToRgb(cssFn) {
  const open = cssFn.indexOf("(");
  const close = cssFn.lastIndexOf(")");
  if (open < 0 || close < open) return "";
  const inner = cssFn.slice(open + 1, close).trim();
  if (!inner || /^from\b/i.test(inner)) return "";
  const [body, alphaPart] = inner.split("/");
  const tokens = body.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 3) return "";
  let lightness = parseNumber(tokens[0], 1);
  if (!tokens[0].includes("%") && lightness > 1) lightness /= 100;
  const chroma = parseNumber(tokens[1], 0.4);
  const hue = parseHue(tokens[2]);
  if (![lightness, chroma, hue].every(Number.isFinite)) return "";
  const rad = (hue * Math.PI) / 180;
  const rgb = oklabToRgb(lightness, chroma * Math.cos(rad), chroma * Math.sin(rad));
  const alpha = alphaPart != null ? parseNumber(alphaPart, 1) : 1;
  return rgbCss(rgb, alpha);
}

export function oklabToRgbCss(cssFn) {
  const open = cssFn.indexOf("(");
  const close = cssFn.lastIndexOf(")");
  if (open < 0 || close < open) return "";
  const inner = cssFn.slice(open + 1, close).trim();
  if (!inner || /^from\b/i.test(inner)) return "";
  const [body, alphaPart] = inner.split("/");
  const tokens = body.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length < 3) return "";
  let lightness = parseNumber(tokens[0], 1);
  if (!tokens[0].includes("%") && lightness > 1) lightness /= 100;
  const a = parseNumber(tokens[1]);
  const b = parseNumber(tokens[2]);
  if (![lightness, a, b].every(Number.isFinite)) return "";
  const alpha = alphaPart != null ? parseNumber(alphaPart, 1) : 1;
  return rgbCss(oklabToRgb(lightness, a, b), alpha);
}

function convertOneFunction(fn) {
  const lower = fn.slice(0, fn.indexOf("(")).trim().toLowerCase();
  if (lower === "oklch") return oklchToRgb(fn) || "rgb(17, 17, 17)";
  if (lower === "oklab") return oklabToRgbCss(fn) || "rgb(17, 17, 17)";
  if (lower === "light-dark") {
    const inner = fn.slice(fn.indexOf("(") + 1, fn.lastIndexOf(")"));
    const args = splitArgs(inner);
    return args[0] ? replaceUnsupportedCssColors(args[0]) : "#ffffff";
  }
  if (lower === "color-mix" || lower === "color" || lower === "lab" || lower === "lch") {
    return "rgb(17, 17, 17)";
  }
  return fn;
}

/** Rewrite oklch/oklab/… tokens inside a stylesheet or inline style. */
export function replaceUnsupportedCssColors(css) {
  const source = String(css ?? "");
  if (!UNSUPPORTED.test(source)) return source;
  const names = ["oklch", "oklab", "color-mix", "light-dark", "color", "lab", "lch"];
  let out = "";
  let index = 0;
  const lower = source.toLowerCase();
  while (index < source.length) {
    let next = -1;
    let name = "";
    for (const item of names) {
      const at = lower.indexOf(`${item}(`, index);
      if (at < 0) continue;
      if (next < 0 || at < next) {
        next = at;
        name = item;
      }
    }
    if (next < 0) {
      out += source.slice(index);
      break;
    }
    out += source.slice(index, next);
    const extracted = extractFunction(source, next);
    if (!extracted) {
      out += source.slice(next);
      break;
    }
    out += convertOneFunction(extracted.text);
    index = extracted.end;
    void name;
  }
  return out;
}

export function needsColorSanitizing(value) {
  return UNSUPPORTED.test(String(value ?? ""));
}

const COLOR_PROPS = [
  "color",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "columnRuleColor",
  "caretColor",
  "fill",
  "stroke",
];

/** Strip modern color functions from a cloned document before html2canvas parses it. */
export function sanitizeDocumentForHtml2Canvas(doc) {
  if (!doc) return;
  doc.querySelectorAll("style").forEach((el) => {
    const next = replaceUnsupportedCssColors(el.textContent || "");
    if (next !== el.textContent) el.textContent = next;
  });
  try {
    if (doc.adoptedStyleSheets?.length) {
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets].map((sheet) => {
        try {
          const css = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
          if (!needsColorSanitizing(css)) return sheet;
          const next = new CSSStyleSheet();
          next.replaceSync(replaceUnsupportedCssColors(css));
          return next;
        } catch {
          return sheet;
        }
      });
    }
  } catch {
    /* ignore */
  }

  const root = doc.body || doc.documentElement;
  if (!root) return;
  const view = doc.defaultView;
  const nodes = [root, ...root.querySelectorAll("*")];
  for (const node of nodes) {
    if (!(node instanceof (view?.HTMLElement ?? HTMLElement)) && node.nodeType !== 1) continue;
    const style = node.getAttribute?.("style");
    if (style && needsColorSanitizing(style)) {
      node.setAttribute("style", replaceUnsupportedCssColors(style));
    }
    if (!view?.getComputedStyle) continue;
    try {
      const computed = view.getComputedStyle(node);
      for (const prop of COLOR_PROPS) {
        const value = computed[prop];
        if (needsColorSanitizing(value)) {
          node.style[prop] = replaceUnsupportedCssColors(value);
        }
      }
    } catch {
      /* skip detached nodes */
    }
  }
}

export async function html2canvasSafe(element, options = {}) {
  const { default: html2canvas } = await import("html2canvas");
  const userOnclone = options.onclone;
  return html2canvas(element, {
    ...options,
    onclone: (clonedDoc, clonedEl) => {
      sanitizeDocumentForHtml2Canvas(clonedDoc);
      userOnclone?.(clonedDoc, clonedEl);
    },
  });
}
