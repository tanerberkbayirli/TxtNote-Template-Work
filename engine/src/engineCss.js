import { specialPageCss, specialPageElasticCss } from "./specialPages.js";
import { ENGINE_DEFAULT_TAB_STOP_MM } from "./engineDefaults.js";
import { presentationLayoutCss } from "./presentationLayout.js";
import { ACADEMIC_FIGURE_MARGIN_PT, ACADEMIC_TABLE_CELL_PADDING_PT } from "../../TxtNote/frontend/src/lib/academicDocument.js";

import { WORD_JUSTIFY_COMPRESSION, WORD_SPACE_EM, wordBaselineCss, wordBaselineProbe } from "./wordBaseline.js";
import { tableSemanticsCss } from "./tableSemantics.js";
import { resolveLineSpacing, resolveIndent } from "./typography.js";
import { exceptionSet } from "./transformExceptions.js";
import { TABLE_WRAP_MARGIN_PT, blockDescriptors, blockGapActive, figureAlign, gapBetween, marginsGap } from "./blockGap.js";
import { indexRowStyle } from "./generatedIndex.js";
import { presentationId } from "./presentationLayout.js";

// A generated list carries its base baseline adjustment on the parent. Saved
// row typography needs its own adjustment relative to that parent, just as
// template level styles do. Register the same effective style for DOM probes.
function presentationIndexStyles(section) {
  if (!section.generatedIndex) return [];
  const nodes = new Map((section.presentationElements || []).map(node => [node.id, node]));
  return (section.indexRows || []).flatMap(row => {
    const node = nodes.get(presentationId(section.id, 'generated', `row:${row.anchor}`));
    const override = node?.override?.style;
    if (!override || !['fontFamily', 'fontSizePt', 'fontWeight', 'italic', 'lineHeight'].some(key => key in override)) return [];
    return [{ node, style: { ...section.generatedIndex.style, ...indexRowStyle(section.generatedIndex, row), ...override } }];
  });
}

/** CSS generation for thesis sections (moved out of engine.js; engine.js re-exports the public names). */
export const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const round3 = (value) => Math.round(value * 1000) / 1000;
export const cssFamily = (value) => JSON.stringify(String(value || "Times New Roman"));

/**
 * Drawn line pitch of a stored lineHeight. "multiplier" (default) is a CSS factor of the font
 * size. "word" is Word's "n lines": n × the font's single line (`singleLineEm`, e.g. Times New
 * Roman 1.15 em = 13.8 pt at 12 pt). The stored value keeps its meaning (1.5 = one and a half
 * lines), so DOCX still writes Word's own line spacing.
 */
export function effectiveLineHeight(lineHeight, spacing, style = {}) {
  return resolveLineSpacing({ ...style, lineHeight }, spacing).em;
}

export function lineHeightCss(style, spacing) {
  const resolved = resolveLineSpacing(style, spacing);
  return (style.lineSpacing?.rule || spacing?.rule) && resolved.rule !== "auto" ? `${resolved.pitchPt}pt` : resolved.em;
}

/** CSS padding shorthand for `tables.cellPadding` ({topMm,rightMm,bottomMm,leftMm}); a missing edge is 0. A string is passed through. No value -> fallback. */
export function cellPaddingCss(cellPadding, fallback) {
  if (typeof cellPadding === "string") return cellPadding;
  if (!cellPadding || typeof cellPadding !== "object") return fallback;
  const mm = (v) => `${Number(v) || 0}mm`;
  return `${mm(cellPadding.topMm)} ${mm(cellPadding.rightMm)} ${mm(cellPadding.bottomMm)} ${mm(cellPadding.leftMm)}`;
}

/** First-line indent and left padding; a hanging indent (mm) moves every line but the first right. */
export const indentMm = (style) => resolveIndent(style);

/**
 * Word fits a justified line whose natural width exceeds the measure by shrinking its spaces (up to WORD_JUSTIFY_COMPRESSION of the space width),
 * Chromium only widens them. A negative word-spacing makes the browser break where Word does; justification then widens the spaces back.
 * Known Word fonts only (unknown fonts stay UNKNOWN); `typography.justify: "browser"` keeps the old breaking.
 */
export function justifyWordSpacing(style, justify = "word", resetOthers = false) {
  if (justify === "browser") return "";
  const family = String(style.fontFamily || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const compression = WORD_JUSTIFY_COMPRESSION[family], spaceEm = WORD_SPACE_EM[family];
  if (style.align !== "justify") return (compression?'font-kerning:none;':'')+(resetOthers ? "word-spacing:0;" : "");
  // Word does not kern by default; Chromium does, which changes the natural line width the fit depends on.
  return compression && spaceEm ? `font-kerning:none;word-spacing:${(-spaceEm * compression).toFixed(5)}em;` : "";
}

function serializeStyle(style, lineSpacing, justify = "word", resetOthers = false) {
  const indent = indentMm(style);
  return `font-family:${cssFamily(style.fontFamily)};font-size:${style.fontSizePt}pt;font-weight:${style.fontWeight || 400};font-style:${style.italic ? "italic" : "normal"};text-align:${style.align || "left"};${justifyWordSpacing(style, justify, resetOthers)}line-height:${lineHeightCss(style, lineSpacing)};letter-spacing:${style.characterSpacingPt || 0}pt;text-decoration:${style.decoration || "none"};text-transform:${style.textTransform || "none"};margin-top:${style.spaceBeforePt || 0}pt;margin-bottom:${style.spaceAfterPt || 0}pt;text-indent:${indent.first}mm;padding-left:${Math.max(0, indent.left)}mm;padding-right:${Math.max(0, indent.right || 0)}mm;${indent.left < 0 ? `margin-left:${indent.left}mm;` : ""}${indent.right < 0 ? `margin-right:${indent.right}mm;` : ""}${style.color ? `color:${style.color};` : ""}${style.tabStopMm > 0 ? `tab-size:${style.tabStopMm}mm;` : ""}${style.writingMode === "vertical-rl" ? "writing-mode:vertical-rl;align-self:center;" : ""}`;
}

/** Typography of a caption label run (bold "Şekil 2.1"), when it differs from the caption text. */
const labelCss = (style = {}) => [style.fontWeight ? `font-weight:${style.fontWeight}` : "", style.italic !== undefined ? `font-style:${style.italic ? "italic" : "normal"}` : "", style.fontSizePt ? `font-size:${style.fontSizePt}pt` : "", style.fontFamily ? `font-family:${cssFamily(style.fontFamily)}` : "", style.decoration ? `text-decoration:${style.decoration}` : ""].filter(Boolean).map((rule) => `${rule};`).join("");

/** Text styles of a section that draw lines (for the opt-in Word baseline placement). */
// Positioned special-page blocks use page-origin mm coordinates; only a block that opts into
// positionOrigin "content" needs the fragment (the content box) as its containing block.
function hasContentOriginBlock(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasContentOriginBlock);
  if (value.positionOrigin === "content" && ["absolute", "anchored"].includes(value.layoutMode)) return true;
  return Object.values(value).some((child) => child && typeof child === "object" && hasContentOriginBlock(child));
}

export function sectionTextStyles(section) {
  const { body, headings, tables, figures, bibliography, footnotes, captionKinds, paragraphStyles } = section.rules;
  const text = section.type === "bibliography" ? bibliography.style : body;
  const styles = [text, bibliography.style, tables.style, figures.style, ...Object.values(headings), ...Object.values(captionKinds || {}).map((rule) => rule.style), ...Object.values(paragraphStyles || {}).map((style) => ({ ...text, ...style }))];
  if (tables.cellStyle) styles.push({ ...text, ...tables.cellStyle });
  if (section.generatedIndex) styles.push(section.generatedIndex.style, { ...section.generatedIndex.style, ...section.generatedIndex.pageHeadingStyle });
  styles.push(...presentationIndexStyles(section).map(entry => entry.style));
  if (footnotes?.style) styles.push(footnotes.style);
  const visit = (nodes) => { for (const node of nodes || []) { if (node.type === "text") styles.push(node.style); visit(node.blocks); } };
  visit(section.layout);
  return styles;
}

export function thesisSectionCss(section) {
  const { page, body, headings, tables, figures, lineSpacing } = section.rules;
  const lh = (value) => effectiveLineHeight(value, lineSpacing, body);
  // Opt-in Word line placement: a paint-only offset per text style (see wordBaseline.js).
  const lift = (style) => wordBaselineCss(wordBaselineProbe(style, lineSpacing, effectiveLineHeight(style?.lineHeight, lineSpacing, style)));
  const justify = section.rules.justify || "word";
  // Styles that are not justified must not inherit the negative word-spacing of a justified body.
  const resetOthers = body.align === "justify";
  const styleCss = (style) => serializeStyle(style, lineSpacing, justify, resetOthers);
  // A hanging indent belongs to the paragraphs (the `.thesis-body p` rule), never to the page/flow container around them.
  const containerCss = (style) => styleCss(style.indent ? { ...style, indent: undefined, hangingIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0 } : { ...style, hangingIndentMm: 0 });
  const textCss = (style) => serializeStyle(style, lineSpacing, justify, resetOthers) + lift(style);
  const id = section.id;
  const paperScope = `.thesis-paper[data-thesis-section="${id}"]`;
  const fragmentScope = `.thesis-flow-section[data-thesis-flow-section="${id}"]`;
  const scope = `:is(${paperScope},${fragmentScope})`;
  // What the user types in a bibliography section is bibliography entries (DOCX uses the same style).
  const text = section.type === "bibliography" ? section.rules.bibliography.style : body;
  // With template caption kinds the plain-figure caption rules must not leak into a kind's figures.
  const kindIds = Object.keys(section.rules.captionKinds || {});
  const plainFigure = kindIds.length ? `figure:not(:is(${kindIds.map((kind) => `[data-caption-kind="${kind}"]`).join(",")})) ` : "";
  const rules = [
    `${paperScope}{${containerCss(body)}box-sizing:border-box;position:relative;z-index:1;width:${page.widthMm}mm;min-height:${page.heightMm}mm;padding:${page.margins.topMm}mm ${page.margins.rightMm}mm ${page.margins.bottomMm}mm ${page.margins.leftMm}mm;margin:0;background:transparent;color:#000;text-indent:0;}`,
    `${fragmentScope}{${containerCss(body)}display:block;margin:0;text-indent:0;${hasContentOriginBlock(section.layout) ? "position:relative;" : ""}}`,
    // A special page anchored to the bottom margin fills its page and puts its content at the bottom.
    ...(["bottom", "center"].includes(section.verticalAlign) ? [`${fragmentScope}{display:flex;flex-direction:column;justify-content:${section.verticalAlign === "center" ? "center" : "flex-end"};min-height:${page.heightMm - page.margins.topMm - page.margins.bottomMm}mm}`] : []),
    // Legacy loose lines keep their geometry. New <p> blocks have real paragraph spacing.
    `${scope} .thesis-body{font-family:${cssFamily(text.fontFamily)};font-size:${text.fontSizePt}pt;line-height:${lineHeightCss(text, lineSpacing)};text-align:${text.align || "left"};margin:0;padding:0;text-indent:${text.firstLineIndentMm || 0}mm each-line;white-space:pre-wrap;overflow-wrap:break-word;}`,
    `${scope} .thesis-body [data-thesis-tab]{display:inline-block;width:0;position:relative;vertical-align:baseline;text-indent:0;white-space:pre}${scope} .thesis-body [data-thesis-tab]>i{position:absolute;inset:0;font:inherit;white-space:nowrap;pointer-events:none}`,
    `${scope} .thesis-body :is(ul,ol,table,figure,pre,.academic-code,.academic-table-wrap,.math-formula){text-indent:0;}`,
    `${scope} .thesis-body .rich-text-body{font-family:${cssFamily(text.fontFamily)};font-size:${text.fontSizePt}pt;line-height:${lineHeightCss(text, lineSpacing)};text-align:${text.align || "left"};color:${text.color || "#000"};min-height:0;padding:0;margin:0;overflow:visible;tab-size:${text.tabStopMm > 0 ? text.tabStopMm : ENGINE_DEFAULT_TAB_STOP_MM}mm;}`,
    `${scope} .thesis-body p{margin:${text.spaceBeforePt || 0}pt 0 ${text.spaceAfterPt || 0}pt;text-indent:${indentMm(text).first}mm;${text.indent || text.hangingIndentMm > 0 ? `padding-left:${indentMm(text).left}mm;` : ""}${text.indent ? `padding-right:${indentMm(text).right}mm;` : ""}tab-size:${text.tabStopMm > 0 ? text.tabStopMm : ENGINE_DEFAULT_TAB_STOP_MM}mm;${lift(text)}}`,
    ...(lift(text) ? [`${scope} .thesis-body :is(ul,ol):not(.thesis-bibliography,.thesis-toc)>li{${lift(text)}}`, `${scope} .thesis-body :is(li,td,th,figcaption,caption) p{top:0}`] : []),
    // Named paragraph styles (typography.paragraphStyles): <p data-thesis-style="id"> is the body paragraph with the style's keys on top.
    ...Object.entries(section.rules.paragraphStyles || {}).map(([id, style]) => `${scope} .thesis-body p[data-thesis-style="${id}"]{${textCss({ ...text, ...style })}${style.keepWithNext ? "break-after:avoid;" : ""}}`),
    // First paragraph after a heading (Word's separate "first body" style), e.g. without indent.
    ...(text.firstAfterHeading ? [`${scope} .thesis-body :is(h1,h2,h3,h4,h5,h6)+p{text-indent:${indentMm({ ...text, ...text.firstAfterHeading }).first}mm}`] : []),
    // Outer margins of the table wrapper and of a figure without a template box: the same constants the DOCX writer's gap table reads
    // (blockGap.js); a template `box` and the paragraph-pitch table override them below.
    `${scope} .thesis-body .academic-table-wrap{margin:${TABLE_WRAP_MARGIN_PT}pt 0}`,
    `${scope} .thesis-body figure{margin:${ACADEMIC_FIGURE_MARGIN_PT}pt 0}`,
    `${scope} .thesis-body img{max-width:100%;max-height:${page.heightMm - page.margins.topMm - page.margins.bottomMm}mm;height:auto;object-fit:contain;}`,
    `${scope} .thesis-body table{width:100%;border-collapse:collapse;}`,
    ...(["threeRule", "headerRules", "none"].includes(tables.borders?.preset) ? [
      // Three-rule table: a rule above the table, below the header row and below the table; no verticals.
      // !important: the editor's own table stylesheet (index.css) sets cell borders/padding with it.
      `${scope} .thesis-body td,${scope} .thesis-body th{border:0 !important;padding:${cellPaddingCss(tables.cellPadding, "0 1.9mm")} !important;}`,
      // headerRules: no top rule; a rule below every header-only (th) row and below the last row (AKÜ Matematik symbols table: sub-title rows).
      ...(tables.borders.preset === "headerRules" ? [
        `${scope} .thesis-body table tr:not(:has(>td))>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
        `${scope} .thesis-body table>:is(tbody,tfoot):last-child>tr:last-child>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
      ] : []),
      ...(tables.borders.preset === "threeRule" ? [
        // The rules sit on the first/last row cells: a border on the table box would also enclose an above-table caption.
        `${scope} .thesis-body table>thead:first-of-type>tr:first-child>*,${scope} .thesis-body table:not(:has(>thead))>tbody:first-of-type>tr:first-child>*{border-top:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
        `${scope} .thesis-body table>:is(tbody,tfoot):last-child>tr:last-child>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
        `${scope} .thesis-body thead tr:last-child>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
      ] : []),
    ] : [`${scope} .thesis-body td,${scope} .thesis-body th{border:1px solid #888;padding:${cellPaddingCss(tables.cellPadding, `${ACADEMIC_TABLE_CELL_PADDING_PT.vertical}pt ${ACADEMIC_TABLE_CELL_PADDING_PT.horizontal}pt`)}${tables.cellPadding ? " !important" : ""};}`]),
    // Authored column widths (<col data-col-width="percent">); the table is table-layout:fixed.
    ...tableSemanticsCss(scope, section),
    `${scope} .thesis-body caption{caption-side:${tables.position === "above" ? "top" : "bottom"};${textCss(tables.style)}text-align:${tables.captionAlignment === "auto" ? "center" : tables.captionAlignment || tables.style.align || "left"};margin-top:${tables.spacingBeforePt ?? tables.style.spaceBeforePt ?? 0}pt;margin-bottom:${tables.spacingAfterPt ?? tables.style.spaceAfterPt ?? 0}pt;}`,
    // Captions are document text: the academic editor's muted figcaption colour does not apply.
    `${scope} .thesis-body ${plainFigure}figcaption{${textCss(figures.style)}color:#000;text-align:${figures.captionAlignment === "auto" ? "center" : figures.captionAlignment || figures.style.align || "left"};margin-top:${figures.spacingBeforePt ?? figures.style.spaceBeforePt ?? 0}pt;margin-bottom:${figures.spacingAfterPt ?? figures.style.spaceAfterPt ?? 0}pt;}`,
    `${scope} [data-thesis-caption]::before{content:attr(data-thesis-caption);}`,
    ...[["caption", tables], [`${plainFigure}figcaption`, figures]].flatMap(([tag, rule]) => [
      ...(rule.labelStyle ? [`${scope} .thesis-body ${tag}[data-thesis-caption]::before{${labelCss(rule.labelStyle)}}`] : []),
      // The label is an inline box exactly as wide as the hang: justification cannot stretch the gap after it, so the caption text starts where the continuation lines start.
      ...(rule.hangingIndent === "label" ? [`${scope} .thesis-body ${tag}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px);text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`, `${scope} .thesis-body ${tag}[data-thesis-caption-hang]::before{display:inline-block;width:attr(data-thesis-caption-hang px, 0px);text-indent:0;white-space:nowrap}`]
        : rule.hangingIndent > 0 ? [`${scope} .thesis-body ${tag}[data-thesis-caption]{padding-left:${rule.hangingIndent}mm;text-indent:-${rule.hangingIndent}mm}`] : []),
    ]),
    // Figure box (opt-in `box`): image alignment and the figure's own outer spacing (the editor stylesheet's default margin is dropped).
    ...[[plainFigure ? plainFigure.trim() : "figure", figures], ...Object.entries(section.rules.captionKinds || {}).map(([kind, rule]) => [`figure[data-caption-kind="${kind}"]`, rule])].filter(([, rule]) => rule.box).flatMap(([sel, rule]) => [
      `${scope} .thesis-body ${sel}{margin:${rule.box.spaceBeforePt || 0}pt 0 ${rule.box.spaceAfterPt || 0}pt;}`,
      `${scope} .thesis-body ${sel} img{display:block;margin-left:${figureAlign(rule) === "left" ? 0 : "auto"};margin-right:${figureAlign(rule) === "right" ? 0 : "auto"};}`,
    ]),
    // Without a `box` only the horizontal position changes (vertical layout unchanged); the image sits where the DOCX writer puts it: the figure
    // paragraph is centred unless the rule says otherwise (`figures.align`), so the editor/PDF must not leave it at the left edge.
    ...[[plainFigure ? plainFigure.trim() : "figure", figures], ...Object.entries(section.rules.captionKinds || {}).map(([kind, rule]) => [`figure[data-caption-kind="${kind}"]`, rule])].filter(([, rule]) => !rule.box).map(([sel, rule]) =>
      `${scope} .thesis-body ${sel} img{margin-left:${figureAlign(rule) === "left" ? 0 : "auto"};margin-right:${figureAlign(rule) === "right" ? 0 : "auto"};}`),
    // Template caption kinds ("photo"): a figure marked data-caption-kind gets its own caption typography.
    ...Object.entries(section.rules.captionKinds || {}).flatMap(([kind, rule]) => {
      const sel = `${scope} .thesis-body figure[data-caption-kind="${kind}"] figcaption`;
      return [
        `${sel}{${textCss(rule.style)}color:#000;text-align:${rule.captionAlignment === "auto" ? "center" : rule.captionAlignment || rule.style.align || "left"};margin-top:${rule.spacingBeforePt ?? rule.style.spaceBeforePt ?? 0}pt;margin-bottom:${rule.spacingAfterPt ?? rule.style.spaceAfterPt ?? 0}pt;}`,
        ...(rule.labelStyle ? [`${sel}[data-thesis-caption]::before{${labelCss(rule.labelStyle)}}`] : []),
        ...(rule.hangingIndent === "label" ? [`${sel}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px);text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`, `${sel}[data-thesis-caption-hang]::before{display:inline-block;width:attr(data-thesis-caption-hang px, 0px);text-indent:0;white-space:nowrap}`]
          : rule.hangingIndent > 0 ? [`${sel}[data-thesis-caption]{padding-left:${rule.hangingIndent}mm;text-indent:-${rule.hangingIndent}mm}`] : []),
      ];
    }),
    // Measured auto alignment must outrank the caption rules above (same scope + .thesis-body + element; the extra attribute beats a caption-kind selector).
    `${scope} .thesis-body :is(figcaption,caption)[data-thesis-caption-auto="center"][data-thesis-anchor]{text-align:center}${scope} .thesis-body :is(figcaption,caption)[data-thesis-caption-auto="justify"][data-thesis-anchor]{text-align:justify}`,
    `${scope} .thesis-bibliography{${textCss(section.rules.bibliography.style)}padding-left:${section.rules.bibliography.hangingIndentMm || 0}mm;}`,
    `${scope} .thesis-body [data-thesis-number]::before{content:attr(data-thesis-number) " ";}`,
    // Heading numbers printed on their own line above the title (numbering.placement "ownLine"): same style, same block.
    ...Object.entries(headings).filter(([, style]) => style.numbering?.placement === "ownLine").map(([level]) => `${scope} .thesis-body h${level}[data-thesis-number]::before{content:attr(data-thesis-number);display:block}`),
    `${scope} .thesis-fixed{white-space:pre-wrap;}`,
    `${scope} .thesis-layout-text{white-space:normal;overflow-wrap:break-word;}`,
    `${scope} .thesis-layout-text .thesis-frame-list{margin:0;padding:0 0 0 1.5em;font:inherit;color:inherit;line-height:inherit;list-style-position:outside;} ${scope} .thesis-frame-list li{margin:0;padding:0;font:inherit;text-align:inherit;} ${scope} ul.thesis-frame-list{list-style-type:disc;} ${scope} ol.thesis-frame-list{list-style-type:decimal;}`,
    `${scope} .thesis-layout-spacer{display:block;max-width:100%;}`,
    `${scope} [data-thesis-margin]{display:none;}`,
    // Block rules are keyed by index per section: scoped to the section's own fragment, never the shared page paper (a later static section of the same page would inherit this section's block heights/styles).
    ...specialPageCss(`:is(${fragmentScope})`, section.layout, textCss),
    ...specialPageElasticCss(fragmentScope, section.layoutBlocks && section.standalone && !section.editable && !["bottom", "center"].includes(section.verticalAlign) ? section.layout : null, page.heightMm - page.margins.topMm - page.margins.bottomMm),
  ];
  // Continuation caption rows of split tables (tableContinuation.js): a caption cell like the table caption, then the repeated header.
  if (tables.continuation && tables.position === "above") {
    const row = `${scope} .thesis-body tr[data-thesis-cont="caption"]>td.thesis-cont-caption`;
    const align = tables.captionAlignment === "auto" ? "center" : tables.captionAlignment || tables.style.align || "left";
    rules.push(
      `${scope} .thesis-body tr[data-thesis-cont]{break-inside:avoid}`,
      `${scope} .thesis-body tr[data-thesis-cont="caption"]{break-before:column}`,
      `${row}{${textCss(tables.style)}border:0 !important;padding:0 0 ${tables.spacingAfterPt ?? tables.style.spaceAfterPt ?? 0}pt !important;text-align:${align};}`,
      `${row}[data-thesis-caption-auto="center"]{text-align:center}${row}[data-thesis-caption-auto="justify"]{text-align:justify}`,
      ...(tables.labelStyle ? [`${scope} .thesis-body .thesis-cont-label{${labelCss(tables.labelStyle)}}`] : []),
      ...(tables.hangingIndent === "label" ? [`${row}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px) !important;text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`]
        : tables.hangingIndent > 0 ? [`${row}{padding-left:${tables.hangingIndent}mm !important;text-indent:-${tables.hangingIndent}mm}`] : []),
      ...(tables.borders?.preset === "threeRule" ? [`${scope} .thesis-body tr[data-thesis-frag-first]>*{border-top:${tables.borders.widthPt || 0.5}pt solid #000 !important}${scope} .thesis-body tr[data-thesis-frag-last]>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important}`] : []),
    );
  }
  // Equations (opt-in): blocks lose the editor chrome, the formula is centered, the number sits flush right/left of the block.
  if (section.rules.equations) {
    const eq = section.rules.equations;
    const block = `${scope} .thesis-body .math-formula--block`;
    rules.push(
      // style.lineHeight (opt-in) makes the block one paragraph-like line of the equation style; its vertical placement comes from the
      // block-gap table (blockGap.js) plus measured presentation attributes (see decorateThesisSources): caret pads cancelled
      // (pad-before/after), one-line formulas lifted/dropped onto the nominal line (lift/drop), wide formulas fitted (fit).
      `${block}{background:transparent;border:0;border-radius:0;margin:${eq.style?.lineHeight ? "0" : `${eq.style?.spaceBeforePt || 0}pt`} 0 ${eq.style?.lineHeight ? "0" : `${eq.style?.spaceAfterPt || 0}pt`};padding:0;text-align:center;${eq.style?.fontFamily ? `--thesis-pdf-equation-font:${cssFamily(eq.style.fontFamily)};font-family:${cssFamily(eq.style.fontFamily)};` : ""}${eq.style?.fontSizePt ? `font-size:${eq.style.fontSizePt}pt;` : ""}${eq.style?.lineHeight ? `line-height:${lh(eq.style.lineHeight)};` : ""}}`,
      ...(eq.style?.lineHeight ? [
        `${block}[data-thesis-eq-pad-before]{margin-top:calc(0pt - attr(data-thesis-eq-pad-before px, 0px))}${block}[data-thesis-eq-pad-after]{margin-bottom:calc(0pt - attr(data-thesis-eq-pad-after px, 0px))}`,
        `${block}{padding-top:attr(data-thesis-eq-lift px, 0px);padding-bottom:attr(data-thesis-eq-drop px, 0px)}`,
        `${block}[data-thesis-eq-fit] .katex{font-size:attr(data-thesis-eq-fit em, 1em)}`,
      ] : []),
      // With the line-grid opt-in the formula wraps at its break points inside gutters the width of the number, so it never runs under it.
      `${block} .math-formula__render{padding:${eq.style?.lineHeight ? "0 3.6em" : "0"}}`,
      ...(eq.style?.lineHeight ? [`${block} .katex{white-space:normal}`] : []),
      // KaTeX's default display margin (1 em above and below) is not part of the Word equation paragraph in either mode.
      `${block} .katex-display{margin:0}`,
      // fontSizePt is the size of the formula itself (KaTeX scales its glyphs by 1.21 em by default).
      ...(eq.style?.fontSizePt ? [`${block} .katex{font-size:1em}`] : []),
      // The formula search / copy toolbar stays available on hover but takes no space in the page.
      `${block} .math-formula__toolbar{position:absolute;top:0;right:0;z-index:2;visibility:hidden}${block}:hover .math-formula__toolbar,${block}:focus-within .math-formula__toolbar{visibility:visible}`,
      `${block}[data-thesis-eq]::after{content:attr(data-thesis-eq);position:absolute;top:50%;transform:translateY(-50%);line-height:1;white-space:nowrap;text-indent:0;${eq.style?.fontFamily ? `font-family:${cssFamily(eq.style.fontFamily)},${cssFamily(body.fontFamily)};` : ""}${eq.style?.fontSizePt ? `font-size:${eq.style.fontSizePt}pt;` : ""}${eq.style?.fontWeight ? `font-weight:${eq.style.fontWeight};` : ""}${eq.style?.italic ? "font-style:italic;" : ""}}`,
      `${block}[data-thesis-eq-side="right"]::after{right:0}${block}[data-thesis-eq-side="left"]::after{left:0}`,
      // With a measured baseline the number sits on it (line-height 1 box: baseline 0.8375 em below its top for Times New Roman).
      ...(eq.style?.lineHeight ? [`${block}[data-thesis-eq][data-thesis-eq-base]::after{top:calc(attr(data-thesis-eq-base px, 0px) - 0.8375em);transform:none}`] : []),
    );
  }
  // Templates without an `equations` rule: Word writes the display formula as a plain body paragraph (one body line, the body's
  // space before/after, no box, left aligned), so the editor draws it as that paragraph. The boxed editor chrome (border, 0.35/1.05 rem
  // padding, 0.85 rem margins) and the two caret pads (line boxes of their own, cancelled with a negative margin by decorateThesisSources
  // through data-thesis-eq-pad-before/after) are what made it ~125 pt taller than the Word paragraph.
  if (!section.rules.equations) {
    const block = `${scope} .thesis-body .math-formula--block`;
    rules.push(
      `${block}{background:transparent;border:0;border-radius:0;margin:${text.spaceBeforePt || 0}pt 0 ${text.spaceAfterPt || 0}pt;padding:0;text-align:left;text-indent:0;line-height:${lineHeightCss(text, lineSpacing)}}`,
      `${block}[data-thesis-ieq-pad-before]{margin-top:calc(0px - attr(data-thesis-ieq-pad-before px, 0px))}${block}[data-thesis-ieq-pad-after]{margin-bottom:calc(0px - attr(data-thesis-ieq-pad-after px, 0px))}`,
      `${block}{padding-top:attr(data-thesis-ieq-lift px, 0px);padding-bottom:attr(data-thesis-ieq-drop px, 0px)}${block}[data-thesis-ieq-fit] .katex{font-size:attr(data-thesis-ieq-fit em, 1em)}`,
      `${block} .math-formula__render{padding:0}${block} .katex-display{margin:0;text-align:left}${block}[data-thesis-ieq-shift] .katex-display{position:relative;top:calc(0px - attr(data-thesis-ieq-shift px, 0px))}${block} .katex{font-size:1em;white-space:normal}`,
      `${block} .math-formula__toolbar{position:absolute;top:0;right:0;z-index:2;visibility:hidden}${block}:hover .math-formula__toolbar,${block}:focus-within .math-formula__toolbar{visibility:visible}`,
    );
  }
  // Section-end/browser fallback notes must use the resolved footnote typography too.
  const note = section.rules.footnotes?.style;
  if (note) rules.push(
    `${scope} .thesis-body .academic-footnote-list{font-family:${cssFamily(note.fontFamily)};font-size:${note.fontSizePt}pt;line-height:${lineHeightCss(note, lineSpacing)};text-align:${note.align};text-indent:0}`,
    `${scope} .thesis-body .academic-footnote-list>li{margin:${note.spaceBeforePt || 0}pt 0 ${note.spaceAfterPt || 0}pt;line-height:${lineHeightCss(note, lineSpacing)};${lift(note)}}`,
    `${scope} .thesis-body .academic-footnote-list>li>sup{position:relative;top:-.35em;font-size:.75em;line-height:0;vertical-align:baseline}`,
  );
  // Optional table body rule (e.g. single spacing, centered names/values); a cell's own alignment still wins.
  if (tables.cellStyle) {
    const cell = tables.cellStyle;
    rules.push(`${scope} .thesis-body :is(td,th){${cell.align ? `text-align:${cell.align};` : ""}${cell.lineHeight || cell.lineSpacing ? `line-height:${lineHeightCss({ ...text, ...cell }, lineSpacing)};` : ""}${cell.fontSizePt ? `font-size:${cell.fontSizePt}pt;` : ""}${cell.fontFamily ? `font-family:${cssFamily(cell.fontFamily)};` : ""}text-indent:0;${lift({ ...text, ...cell })}}`);
    const firstIndentMm = Number(cell.firstLineIndentMm) || 0;
    rules.push(`${scope} .thesis-body :is(td,th){text-indent:${firstIndentMm}mm;}`);
    rules.push(`${scope} .thesis-body :is(td,th) p{margin:0;text-indent:${firstIndentMm}mm;text-align:inherit;}`);
  }
  // Canonical editor alignment classes survive sanitization. Global formatting
  // classes use display:block/width:100%; cells must retain their table geometry.
  for (const align of ["left", "center", "right", "justify"]) {
    rules.push(`${scope} .thesis-body :is(td,th).fmt-align-${align}{display:table-cell;width:auto;text-align:${align};}`);
  }
  if (section.generatedIndex) {
    const index = section.generatedIndex;
    rules.push(`${scope} .thesis-toc{${textCss(index.style)}text-indent:0;list-style:none;padding:0;}`);
    // A row style's own spacing (Word paragraph spacing) applies to every generated row, not once to the list box.
    const rowBefore = Number(index.style?.spaceBeforePt) || 0, rowAfter = Number(index.style?.spaceAfterPt) || 0;
    if (rowBefore || rowAfter) rules.push(`${scope} .thesis-toc{margin-top:0;margin-bottom:0;}`);
    rules.push(`${scope} .thesis-toc li{display:flex;align-items:baseline;break-inside:avoid;margin:${rowBefore}pt 0 ${rowAfter}pt;}`);
    rules.push(`${scope} .thesis-index-text{min-width:0;white-space:normal}${scope} .thesis-index-leader{flex:1;min-width:4mm;overflow:hidden;white-space:nowrap}${scope} .thesis-index-page{flex:none;min-width:${index.pageColumnWidthMm > 0 ? `${index.pageColumnWidthMm}mm;width:${index.pageColumnWidthMm}mm` : "8mm"};text-align:${index.pageNumberAlignment};}`);
    if (index.pageHeading) rules.push(`${scope} .thesis-index-page-heading{${textCss({ ...index.style, ...index.pageHeadingStyle })}text-align:right;text-indent:0;margin:0;}`);
    // pageHeadingPlacement "row": the heading is that row's page cell, so it takes the heading weight/colour and the row stays a flex row.
    if (index.pageHeading && index.pageHeadingPlacement === "row") rules.push(`${scope} .thesis-toc li[data-index-page-heading]{display:flex!important}${scope} .thesis-index-page[data-index-page-heading]{${labelCss(index.pageHeadingStyle || {})}}`);
    // labelColumnMm: the label ("VIII.") is a right-aligned column of that width and the titles start at one x; wrapped lines hang under the title.
    // labelColumnLevels limits the column to those levels (deeper "2.1.1.1." labels would not fit a Roman-numeral column).
    if (index.labelColumnMm > 0) for (const row of (index.labelColumnLevels || [""]).map((level) => (level === "" ? "" : ` li[data-index-level="${level}"]`))) rules.push(`${scope} .thesis-toc${row} .thesis-index-text{display:flex;align-items:baseline;min-width:0}${scope} .thesis-toc${row} .thesis-index-text>.thesis-index-label{flex:none;width:${index.labelColumnMm}mm;text-align:right;margin-right:${Number(index.labelGapMm) || 0}mm;white-space:nowrap}${scope} .thesis-toc${row} .thesis-index-text>.thesis-index-title{min-width:0}`);
    for (const level of Object.keys(headings)) rules.push(`${scope} [data-index-level="${level}"]{padding-left:${(Number(level) - 1) * index.indentMm}mm;}`);
    // Optional: label typography, wrapped lines hanging under the entry title, per-level row styles.
    if (index.labelStyle) rules.push(`${scope} .thesis-index-label{${labelCss(index.labelStyle)}}`);
    if (index.hanging === "label") rules.push(`${scope} .thesis-index-text{display:flex;align-items:baseline;column-gap:0.25em}${scope} .thesis-index-text>.thesis-index-label{flex:none;white-space:nowrap}${scope} .thesis-index-text>.thesis-index-title{min-width:0}`);
    // hanging as a length: wrapped entry lines start that far right of the first line (Word "hanging"), independent of the label width.
    if (index.hanging > 0) rules.push(`${scope} .thesis-index-text{padding-left:${index.hanging}mm;text-indent:-${index.hanging}mm}`);
    // A row with its own lineHeight: its paint-only Word baseline offset replaces the one the list already carries (offsets of nested elements add up).
    const rowLift = (rowStyle) => {
      const own = wordBaselineProbe({ ...index.style, ...rowStyle }, lineSpacing, lh(rowStyle.lineHeight));
      if (!own) return "";
      const inherited = wordBaselineProbe(index.style, lineSpacing, lh(index.style?.lineHeight));
      return `position:relative;top:calc(-1 * var(--thesis-wb-${own.id}, ${own.fallbackPt}pt)${inherited ? ` + var(--thesis-wb-${inherited.id}, ${inherited.fallbackPt}pt)` : ""});`;
    };
    // "unnumbered" (rows of unnumbered titles) is emitted last, so it overrides the level rule of the same specificity.
    for (const [level, style] of Object.entries(index.levelStyles || {}).sort(([a], [b]) => Number(a === "unnumbered") - Number(b === "unnumbered"))) {
      rules.push(`${scope} .thesis-toc li[${level === "unnumbered" ? "data-index-unnumbered" : `data-index-level="${level}"`}]{${labelCss(style)}${style.spaceBeforePt !== undefined ? `margin-top:${style.spaceBeforePt}pt;` : ""}${style.spaceAfterPt !== undefined ? `margin-bottom:${style.spaceAfterPt}pt;` : ""}${Number.isFinite(style.leftIndentMm) ? `padding-left:${style.leftIndentMm}mm;` : ""}${style.align ? `text-align:${style.align};` : ""}${style.includePageNumber === false ? "display:block;" : style.includePageNumber === true && level === "unnumbered" && index.leaderFlow !== "inline" ? "display:flex;" : ""}${style.lineHeight ? `line-height:${lh(style.lineHeight)};${rowLift(style)}` : ""}}`);
    }
    // Extra space above the first unnumbered title row that follows numbered rows (back matter after the chapters).
    if (index.unnumberedAfterNumberedSpaceBeforePt > 0) rules.push(`${scope} .thesis-toc li:not([data-index-unnumbered]) + li[data-index-unnumbered]{margin-top:${index.unnumberedAfterNumberedSpaceBeforePt}pt;}`);
    // leaderFlow "inline": leader dots and page number are floats inside the title box, i.e. on the last line of a wrapped entry (Word's right tab with leader).
    if (index.leaderFlow === "inline") rules.push(
      `${scope} .thesis-toc li{display:block}`,
      `${scope} .thesis-index-text{display:flex;align-items:baseline;column-gap:0.25em}${scope} .thesis-index-text>.thesis-index-label{flex:none;white-space:nowrap}`,
      `${scope} .thesis-index-text>.thesis-index-title{flex:1 1 0;min-width:0;overflow:hidden;position:relative}`,
      // The leader is out of flow at its static position (the end of the last text line); the title box clips it and the page float covers its tail.
      `${scope} .thesis-index-title>.thesis-index-leader{position:absolute;flex:none;min-width:0;padding-left:0.25em;white-space:nowrap}`,
      `${scope} .thesis-index-title>.thesis-index-page{float:right;flex:none;min-width:0;background:#fff;padding-left:0.25em}`,
    );
    // Extend the title's overflow box left by the hanging amount while keeping
    // its content origin and right edge in place; the first line stays visible.
    if (index.leaderFlow === "inline" && index.hanging > 0) rules.push(
      `${scope} .thesis-index-text>.thesis-index-title{margin-left:-${index.hanging}mm;padding-left:${index.hanging}mm}`,
      `${scope} .thesis-index-title>.thesis-index-label{white-space:nowrap}`,
    );
    // Rows whose heading number is on its own line (numbering.placement "ownLine"): number line, then the title line.
    if (Object.values(headings).some((style) => style.numbering?.placement === "ownLine")) rules.push(`${scope} .thesis-toc li[data-index-label-line] .thesis-index-text{display:block}${scope} .thesis-toc li[data-index-label-line] .thesis-index-label{display:block}`);
  }
  // Opt-in Word paragraph spacing: the gap between two paragraphs/headings is after(prev) + before(next) instead of CSS's collapsed max().
  // The value comes from the same margins model the DOCX writer reads (blockGap.js marginsGap); the next block's top margin carries it, so
  // the collapse yields exactly that gap; unforced page breaks still truncate it (Word drops space at a page top). A heading that starts a page
  // (pageBreakBefore) keeps only its own space-before (marginsGap gives no pair gap).
  if (lineSpacing?.paragraphSpacing === "additive") {
    const textKinds = blockDescriptors(section.rules, text).filter((d) => d.kind === "p" || d.kind === "h" || d.kind === "note");
    for (const prev of textKinds) for (const next of textKinds) {
      const gap = marginsGap(section.rules, prev, next);
      if (gap !== null) rules.push(`${scope} .thesis-body ${prev.selector}+${next.selector}{margin-top:${gap}pt}`);
    }
    // A fixed-prefix section heading sits in its own wrapper, so `h+p` never reaches the first body paragraph; the heading's bottom margin
    // (collapsing with that paragraph's top margin) carries the same gap Word renders.
    const firstBody = { ...text, ...(text.firstAfterHeading || {}) };
    const firstBodyBlock = { key: "p:first", kind: "p", entry: {}, margins: { top: firstBody.spaceBeforePt || 0, bottom: firstBody.spaceAfterPt || 0, contextual: false } };
    for (const head of textKinds.filter((d) => d.kind === "h")) rules.push(`${scope} .thesis-body>div:not(.thesis-content):not(.rich-text-body)>${head.selector}:last-child{margin-bottom:${marginsGap(section.rules, head, firstBodyBlock)}pt}`);
  }
  const paragraphStyles = [["p:not([data-thesis-style])", text], ...Object.entries(section.rules.paragraphStyles || {}).map(([id, style]) => [`p[data-thesis-style="${id}"]`, { ...text, ...style }])];
  for (const [selector, style] of paragraphStyles) {
    const canonical = style.lineSpacing || lineSpacing;
    if (canonical?.rule === "exact") rules.push(`${scope} .thesis-body ${selector} :is(span,a,b,strong,i,em,u,s){line-height:inherit}`);
    if (canonical?.rule === "atLeast") rules.push(`${scope} .thesis-body ${selector} :is(span,a,b,strong,i,em,u,s){line-height:normal}`);
  }
  const contextual = [["p:not([data-thesis-style])", text], ...Object.entries(section.rules.paragraphStyles || {}).map(([id, style]) => [`p[data-thesis-style="${id}"]`, { ...text, ...style }])];
  for (const [selector, style] of contextual) {
    if (style.contextualSpacing || lineSpacing?.contextualSpacing) rules.push(`${scope} .thesis-body ${selector}:has(+${selector}){margin-bottom:0}${scope} .thesis-body ${selector}+${selector}{margin-top:0}`);
  }
  if (lineSpacing?.suppressSpaceBeforeAtPageTop) rules.push(`${scope} .thesis-body>p:first-child,${scope} .thesis-body>.rich-text-body>p:first-child{margin-top:0}`);
  // lineSpacing.blockGap "paragraphPitch": the gap between ANY two block kinds comes from one table (blockGap.js), also used by the DOCX writer.
  if (blockGapActive(section.rules)) {
    const descriptors = blockDescriptors(section.rules, text, plainFigure ? plainFigure.trim() : "figure");
    const eqKind = descriptors.find((d) => d.kind === "eq");
    // Native tables from imported/source HTML share the wrapper's gap; nested tables must not get an additional inner margin.
    const selectors = (descriptor) => descriptor.kind === "table" ? [descriptor.selector, "table:not(.academic-table-wrap table,table table)"] : [descriptor.selector];
    // Blocks own no editor margins of their own here: the table decides.
    rules.push(`${scope} .thesis-body .academic-table-wrap{margin:0}${scope} .thesis-body table{margin-bottom:0}${scope} .thesis-body :is(ul,ol):not(.thesis-bibliography,.thesis-toc){margin-top:0;margin-bottom:0}`);
    for (const prev of descriptors) {
      for (const next of descriptors) {
        const gap = gapBetween(section.rules, prev, next);
        if (gap === null) continue;
        for (const previousSelector of selectors(prev)) for (const nextSelector of selectors(next)) {
          const pair = `${scope} .thesis-body ${previousSelector}+${nextSelector}`;
          if (next.kind !== "eq") { rules.push(`${pair}{margin-top:${gap}pt}`); continue; }
          // Before an equation the caret pad (a line box between the two blocks) sits between the margins: subtract the previous
          // block's own space-after and the pad; after an equation the equation's own negative margin already cancels the pad.
          rules.push(`${pair}{margin-top:${gap}pt}`, `${pair}[data-thesis-eq-pad-before]{margin-top:calc(${round3(gap - prev.exit.cssAfter)}pt - attr(data-thesis-eq-pad-before px, 0px))}`);
          if (prev.kind === "eq") rules.push(`${pair}[data-thesis-eq-pad-before]{margin-top:${gap}pt}`);
        }
      }
    }
    void eqKind;
    // A section heading rendered as fixed prefix content lives in its own wrapper, so `h+p` above never reaches the first body paragraph:
    // the table's heading->paragraph gap is carried by the heading's own bottom margin there (the DOCX writer puts it on the paragraph's space-before).
    const bodyP = descriptors.find((d) => d.key === "p");
    if (bodyP) for (const head of descriptors.filter((d) => d.kind === "h")) {
      const gap = gapBetween(section.rules, head, bodyP);
      if (gap !== null) rules.push(`${scope} .thesis-body>div:not(.thesis-content):not(.rich-text-body)>${head.selector}:last-child{margin-bottom:${gap}pt}`);
    }
  }
  // Exception words of an uppercase/capitalized heading (transformExceptions.js) stay lower-case.
  if (Object.values(headings).some((style) => exceptionSet(style))) rules.push(`${scope} .thesis-body span[data-thesis-lower]{text-transform:lowercase}`);
  for (const [level, style] of Object.entries(headings)) {
    rules.push(`${scope} .thesis-body h${level}{${textCss(style)}break-before:${style.pageBreakBefore ? "page" : "auto"};break-after:${style.keepWithNext ? "avoid" : "auto"};}`);
    rules.push(`${scope} .thesis-body h${level}[data-unnumbered]{break-before:auto;}`);
    if (style.pageBreakBefore && style.pageBreakUnlessAfterHeading) rules.push(`${scope} .thesis-body :is(h1,h2,h3,h4,h5,h6) + h${level}{break-before:auto;}`);
  }
  if (lineSpacing?.suppressSpaceBeforeAtPageTop) {
    const first = ":is(p,h1,h2,h3,h4,h5,h6):first-child";
    rules.push(`${scope} .thesis-body>${first},${scope} .thesis-body>.rich-text-body>${first}{margin-top:0 !important}`);
    for (const [selector, style] of paragraphStyles) if (style.pageBreakBefore) rules.push(`${scope} .thesis-body ${selector}{margin-top:0 !important}`);
    for (const [level, style] of Object.entries(headings)) if (style.pageBreakBefore) {
      rules.push(`${scope} .thesis-body h${level}:not([data-unnumbered]){margin-top:0 !important}`);
      if (style.pageBreakUnlessAfterHeading) rules.push(`${scope} .thesis-body :is(h1,h2,h3,h4,h5,h6)+h${level}{margin-top:${style.spaceBeforePt || 0}pt !important}`);
    }
  }
  // A document-local alignment command outranks the template's paragraph/heading
  // style. Also honor wrappers saved before headings became alignment hosts.
  for (const align of ["left", "center", "right", "justify"]) {
    const blocks = ":is(p,h1,h2,h3,h4,h5,h6,div,li)";
    rules.push(`${scope} .thesis-body ${blocks}.fmt-align-${align},${scope} .thesis-body div.fmt-align-${align}>:is(p,h1,h2,h3,h4,h5,h6):not([class*="fmt-align-"]){text-align:${align};${["center", "right"].includes(align) ? "text-indent:0;" : ""}}`);
  }
  const rowOverrides = presentationIndexStyles(section).map(({ node, style }) => {
    const own = wordBaselineProbe(style, lineSpacing, effectiveLineHeight(style.lineHeight, lineSpacing, style));
    const parentStyle = section.generatedIndex.style;
    const inherited = wordBaselineProbe(parentStyle, lineSpacing, effectiveLineHeight(parentStyle.lineHeight, lineSpacing, parentStyle));
    const selector = `${paperScope} [data-layout-id=${JSON.stringify(node.id)}][data-layout-presentation]`;
    const offset = own && !['absolute', 'anchored'].includes(node.layoutMode)
      ? `position:relative;top:calc(-1 * var(--thesis-wb-${own.id}, ${own.fallbackPt}pt)${inherited ? ` + var(--thesis-wb-${inherited.id}, ${inherited.fallbackPt}pt)` : ''}) !important;` : '';
    return `${selector}{line-height:${lineHeightCss(style, lineSpacing)} !important;${offset}}`;
  });
  return rules.join("\n") + "\n" + presentationLayoutCss(section.presentationElements) + '\n' + rowOverrides.join('\n');
}

/** Page-bottom note area of one page group: drawn on its sheets, measured by a hidden twin. */
export function thesisFootnoteCss(group) {
  const { page, footnotes } = group.rules;
  if (!footnotes) return "";
  const { style, separator } = footnotes;
  const scope = `.thesis-footnote-area[data-thesis-footnote-group="${group.id}"]`;
  return [
    `${scope}{position:absolute;box-sizing:border-box;left:${page.margins.leftMm}mm;width:${page.widthMm - page.margins.leftMm - page.margins.rightMm}mm;margin:0;padding:${separator.enabled ? separator.spaceBeforePt : 0}pt 0 0;color:#000;font-family:${cssFamily(style.fontFamily)};font-size:${style.fontSizePt}pt;line-height:${lineHeightCss(style, group.rules.lineSpacing)};text-align:${style.align};white-space:normal;overflow-wrap:break-word;pointer-events:none}`,
    `${scope}[data-thesis-footnote-measure]{top:0;visibility:hidden}`,
    `${scope} .thesis-footnote-separator{display:block;width:${separator.widthPercent}%;height:0;margin:0 0 ${separator.spaceAfterPt}pt;border:0;border-top:${separator.thicknessPt}pt solid #111}`,
    `${scope} .thesis-footnote-list{list-style:none;margin:0;padding:0}`,
    `${scope} .thesis-footnote{margin:${style.spaceBeforePt}pt 0 ${style.spaceAfterPt}pt;padding:0 ${style.rightIndentMm}mm 0 ${style.leftIndentMm}mm;text-indent:${style.firstLineIndentMm}mm;font-weight:${style.fontWeight};font-style:${style.italic ? "italic" : "normal"};letter-spacing:${style.characterSpacingPt}pt;${wordBaselineCss(wordBaselineProbe(style, group.rules.lineSpacing, effectiveLineHeight(style.lineHeight, group.rules.lineSpacing, style)))}}`,
    `${scope} .thesis-footnote:has(>.thesis-footnote-para){margin:0}`,
    `${scope} .thesis-footnote-para{display:block;margin:${style.spaceBeforePt}pt 0 ${style.spaceAfterPt}pt}`,
    `${scope} .thesis-footnote-label{position:relative;top:-.35em;font-size:.75em;line-height:0;vertical-align:baseline}`,
  ].join("\n");
}
