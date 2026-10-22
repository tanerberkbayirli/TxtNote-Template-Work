import { attr, child, children, elements, isWord, mm, on, val } from "./importPackage.js";

const own = (o, k, v) => { if (v !== "" && v !== undefined) Object.defineProperty(o, k, { enumerable: true, writable: true, configurable: true, value: v }); };
export function readRunProperties(pr, theme = {}) {
  const result = {}, font = child(pr, "rFonts"), size = val(pr, "sz");
  own(result, "fontFamily", attr(font, "ascii") || attr(font, "hAnsi") || theme[attr(font, "asciiTheme")] || theme[attr(font, "hAnsiTheme")]);
  own(result, "fontHint", attr(font, "hint"));
  own(result, "eastAsiaFontFamily", attr(font, "eastAsia"));
  if (size !== "") result.fontSizePt = Number(size) / 2;
  for (const [tag, key] of [["b", "bold"], ["i", "italic"], ["strike", "strike"], ["caps", "caps"], ["smallCaps", "smallCaps"], ["vanish", "hidden"]]) {
    const node = child(pr, tag); if (node) result[key] = on(node);
  }
  const underline = child(pr, "u"); if (underline) result.underline = attr(underline, "val") !== "none";
  const color = val(pr, "color"); if (/^[\da-f]{6}$/i.test(color)) result.color = "#" + color;
  const highlight = val(pr, "highlight"); own(result, "highlight", highlight === "none" ? "transparent" : highlight);
  const vertical = val(pr, "vertAlign"); own(result, "verticalAlign", vertical);
  const spacing = val(pr, "spacing"); if (spacing !== "") result.characterSpacingPt = Number(spacing) / 20;
  const kern = val(pr, "kern"); if (kern !== "" && Number.isFinite(Number(kern)) && Number(kern) >= 0) result.kerningMinPt = Number(kern) / 2;
  own(result, "language", attr(child(pr, "lang"), "val"));
  return result;
}
export function readParagraphProperties(pr) {
  const result = {}, align = val(pr, "jc");
  own(result, "align", ({ both: "justify", start: "left", end: "right" })[align] || align);
  const ind = child(pr, "ind"), spacing = child(pr, "spacing");
  for (const [a, key] of [["left", "leftIndentMm"], ["right", "rightIndentMm"], ["firstLine", "firstLineIndentMm"], ["hanging", "hangingIndentMm"]]) {
    const v = attr(ind, a); if (v !== "") result[key] = mm(v);
  }
  for (const [a, key] of [["before", "spaceBeforePt"], ["after", "spaceAfterPt"]]) { const v = attr(spacing, a); if (v !== "") result[key] = Number(v) / 20; }
  const line = attr(spacing, "line");
  if (line !== "") { const rule = attr(spacing, "lineRule") || "auto"; result.lineSpacing = { rule, value: Number(line) / (rule === "auto" ? 240 : 20) }; }
  for (const [tag, key] of [["keepNext", "keepWithNext"], ["keepLines", "keepLines"], ["pageBreakBefore", "pageBreakBefore"], ["widowControl", "widowControl"], ["contextualSpacing", "contextualSpacing"], ["bidi", "bidi"]]) { const n = child(pr, tag); if (n) result[key] = on(n); }
  const level = val(pr, "outlineLvl"); if (level !== "") result.outlineLevel = Number(level);
  const num = child(pr, "numPr");
  if (num) { result.numbering = {}; own(result.numbering, "numId", val(num, "numId")); const ilvl = val(num, "ilvl"); if (ilvl !== "") result.numbering.level = Number(ilvl); }
  const tabs = child(pr, "tabs");
  if (tabs) result.tabStops = children(tabs, "tab").map(n => ({ positionMm: mm(attr(n, "pos")), align: attr(n, "val"), leader: attr(n, "leader") || "none" }));
  return result;
}
const TOGGLES = ["bold", "italic", "strike", "caps", "smallCaps", "hidden"];
function inheritRun(base, style) {
  const result = { ...base, ...style };
  for (const key of TOGGLES) if (Object.hasOwn(style, key)) result[key] = style[key] ? !Boolean(base[key]) : Boolean(base[key]);
  return result;
}
const mergeParagraph = (a, b) => ({ ...a, ...b, ...(a.numbering || b.numbering ? { numbering: { ...a.numbering, ...b.numbering } } : {}) });
export function readStyles(pkg, part, report, themePart) {
  const theme = {};
  const themeRoot = pkg.xml(themePart)?.documentElement;
  const find = (node, name) => { for (const n of elements(node)) { if (n.localName === name) return n; const nested = find(n, name); if (nested) return nested; } return null; };
  for (const kind of ["major", "minor"]) {
    const group = find(themeRoot, kind+"Font"), latin = elements(group).find(n => n.localName === "latin")?.getAttribute("typeface");
    if (latin) for (const suffix of ["Ascii", "HAnsi"]) theme[kind+suffix] = latin;
  }
  const root = pkg.xml(part)?.documentElement, styles = {};
  const defaults = child(root, "docDefaults");
  const defaultRun = readRunProperties(child(child(defaults, "rPrDefault"), "rPr"), theme);
  const defaultParagraph = readParagraphProperties(child(child(defaults, "pPrDefault"), "pPr"));
  styles.default = { properties: { ...defaultRun, ...defaultParagraph }, paragraph: defaultParagraph, run: defaultRun };
  let defaultParagraphId = "", defaultCharacterId = "";
  for (const s of children(root, "style")) {
    const id = attr(s, "styleId"); if (!id || Object.hasOwn(styles, id)) { report("duplicate-style", s, "Stil kimliği boş veya yinelenmiş"); continue; }
    const run = readRunProperties(child(s, "rPr"), theme), paragraph = readParagraphProperties(child(s, "pPr"));
    own(styles, id, { type: attr(s, "type"), name: val(s, "name"), basedOn: val(s, "basedOn"), next: val(s, "next"), link: val(s, "link"),
      default: /^(1|true|on)$/i.test(attr(s, "default")), run, paragraph, properties: { ...run, ...paragraph }, ooxml: pkg.serialize(s), locator: pkg.location(s) });
    if (styles[id].default && styles[id].type === "paragraph") defaultParagraphId = id;
    if (styles[id].default && styles[id].type === "character") defaultCharacterId = id;
  }
  const resolved = new Map();
  const resolve = (id, stack = new Set()) => {
    if (!id) return { paragraph: {}, run: {} };
    if (resolved.has(id)) return resolved.get(id);
    if (stack.has(id)) { report("style-cycle", null, `Döngüsel stil: ${[...stack, id].join(" → ")}`, part+":style:"+id); return { paragraph: {}, run: {} }; }
    const s = Object.hasOwn(styles, id) ? styles[id] : null;
    if (!s) { report("missing-style", null, `Stil bulunamadı: ${id}`, part+":style:"+id); return { paragraph: {}, run: {} }; }
    const parent = resolve(s.basedOn, new Set([...stack, id]));
    const result = { paragraph: mergeParagraph(parent.paragraph, s.paragraph), run: inheritRun(parent.run, s.run) };
    resolved.set(id, result); return result;
  };
  for (const [id, style] of Object.entries(styles)) if (id !== "default") style.resolved = resolve(id);
  return { styles, theme, defaultParagraphId, defaultCharacterId, resolve,
    paragraph: (id, direct) => mergeParagraph(mergeParagraph(defaultParagraph, resolve(id || defaultParagraphId).paragraph), direct),
    run: (paragraphId, characterId, direct) => {
      const paragraphRun = inheritRun(defaultRun, resolve(paragraphId || defaultParagraphId).run);
      return { ...inheritRun(paragraphRun, resolve(characterId || defaultCharacterId).run), ...direct };
    } };
}
export function readNumbering(pkg, part) {
  const root = pkg.xml(part)?.documentElement, abstract = {}, instances = {};
  const level = n => ({ level: Number(attr(n, "ilvl")), start: Number(val(n, "start") || 1), format: val(n, "numFmt"), text: val(n, "lvlText"),
    restart: val(n, "lvlRestart"), suffix: val(n, "suff") || "tab", paragraphStyle: val(n, "pStyle"),
    paragraph: readParagraphProperties(child(n, "pPr")), run: readRunProperties(child(n, "rPr")), ooxml: pkg.serialize(n) });
  for (const n of children(root, "abstractNum")) own(abstract, attr(n, "abstractNumId"), { id: attr(n, "abstractNumId"),
    styleLink: val(n, "styleLink"), numStyleLink: val(n, "numStyleLink"), levels: Object.fromEntries(children(n, "lvl").map(l => [attr(l, "ilvl"), level(l)])), ooxml: pkg.serialize(n) });
  for (const n of children(root, "num")) {
    const overrides = {};
    for (const o of children(n, "lvlOverride")) { const entry = {}; if (child(o, "startOverride")) entry.start = Number(val(o, "startOverride")); if (child(o, "lvl")) entry.definition = level(child(o, "lvl")); overrides[attr(o, "ilvl")] = entry; }
    own(instances, attr(n, "numId"), { id: attr(n, "numId"), abstractId: val(n, "abstractNumId"), overrides, ooxml: pkg.serialize(n) });
  }
  return { abstract, instances };
}
export function numberingLevel(numbering, numId, level = 0) {
  const instance = numbering.instances[numId]; if (!instance) return null;
  const definition = numbering.abstract[instance.abstractId]?.levels[level], override = instance.overrides[level];
  return definition || override?.definition ? { ...definition, ...override?.definition, ...(override?.start !== undefined ? { start: override.start } : {}), numId, level } : null;
}
export function readSectionProperties(pkg, sect, relationships, inherited = {}) {
  const page = {}, size = child(sect, "pgSz"), margin = child(sect, "pgMar");
  for (const [a, key] of [["w", "widthMm"], ["h", "heightMm"]]) { const n = attr(size, a); if (n !== "") page[key] = mm(n); }
  page.orientation = attr(size, "orient") || "portrait";
  page.size = "custom";
  page.margins = {};
  for (const [a, key] of [["top", "topMm"], ["bottom", "bottomMm"], ["left", "leftMm"], ["right", "rightMm"]]) { const n = attr(margin, a); if (n !== "") page.margins[key] = mm(n); }
  const refs = { header: { ...inherited.header }, footer: { ...inherited.footer } };
  for (const kind of ["header", "footer"]) {
    for (const ref of children(sect, kind+"Reference")) {
      const relationshipId = Array.from(ref.attributes || []).find(a => a.localName === "id")?.value;
      refs[kind][attr(ref, "type") || "default"] = { relationshipId, part: relationships[relationshipId]?.part || null };
    }
    const d = attr(margin, kind); if (d !== "") page[kind] = { distanceMm: mm(d) };
  }
  if (child(sect, "titlePg")) page.differentFirstPage = on(child(sect, "titlePg"));
  const num = child(sect, "pgNumType"), fmt = attr(num, "fmt");
  if (num) page.numbering = { format: ({ decimal: "arabic", lowerRoman: "roman-lower", upperRoman: "roman-upper" })[fmt] || "arabic",
    ...(attr(num, "start") !== "" ? { startAt: Number(attr(num, "start")), restart: true } : { restart: false }) };
  return { breakType: val(sect, "type") || "nextPage", page, headerFooterReferences: refs,
    columns: child(sect, "cols") ? { count: Number(attr(child(sect, "cols"), "num") || 1), spaceMm: mm(attr(child(sect, "cols"), "space") || 0), ooxml: pkg.serialize(child(sect, "cols")) } : null,
    ooxml: pkg.serialize(sect), locator: pkg.location(sect) };
}
