import { resolveLineSpacing } from "./typography.js";
import { ACADEMIC_FIGURE_MARGIN_PT } from "../../TxtNote/frontend/src/lib/academicDocument.js";
/**
 * Vertical rhythm of a thesis body in ONE place (opt-in: `typography.lineSpacing.blockGap: "paragraphPitch"`, needs mode "word"
 * and baseline "word"). Every block kind has an entry (how a block starts) and an exit (how it ends); `gapBetween` gives the gap
 * between any two adjacent kinds. The editor/PDF CSS (`margin-top` of the next block) and the DOCX writer (`w:before` of the next
 * paragraph = gap - previous `w:after`) both read this table, so they agree by construction.
 *
 * Kinds: p (body/named paragraph styles), note (`tableNote` style), h (headings), figure (caption below), table (caption above),
 * list, eq (numbered/unnumbered block equation).
 *
 * gapBetween(prev, next), all in pt, measured between the last line box bottom of `prev` and the first line box top of `next`:
 * - next starts with a box (figure, table): one empty body line (the guide's "bir satır boşluk");
 * - paragraph/heading after paragraph/heading: space-after + space-before (Word's additive spacing);
 * - a table note right below its table: its own space-before only (guide p.14: rule to note baseline 5.46 mm);
 * - everything else (after figure/table/note/list/equation, or before an equation/list): the first baseline lies one body paragraph
 *   pitch (line + space-after, 41.4 pt) below the last baseline, exactly like after a body paragraph.
 */
export const WORD_ASCENT_EM = 0.9336;

/** Space below a list when the template has no block-gap table: the editor stylesheet's list margin and the DOCX writer's last list paragraph (space-after) read this one value. */
export const LIST_SPACE_AFTER_PT = 6;

/** Horizontal alignment of a figure's image, one rule for the editor CSS and the DOCX writer: the box rule, else `figures.align`, else centred. */
export const figureAlign = (rule) => rule?.box?.align || (["left", "right"].includes(rule?.align) ? rule.align : "center");

/** A figure's outer spacing without a block-gap table: the rule's `box` values (editor CSS `margin`), else the stylesheet default (`defaultPt`). The DOCX writer reads the same. */
export const figureMargins = (rule, defaultPt) => rule?.box
  ? { before: rule.box.spaceBeforePt || 0, after: rule.box.spaceAfterPt || 0 }
  : { before: defaultPt, after: defaultPt };

/** The editor stylesheet's outer margin of a table (`.academic-table-wrap`, index.css): one value for the CSS and the DOCX writer. */
export const TABLE_WRAP_MARGIN_PT = 12;

/**
 * Which rule gives the gap between two blocks: "paragraphPitch" (the opt-in block-gap table below, AKÜ guides) or "margins" (every other
 * template): the gap the editor's block margins give, i.e. CSS margin collapsing max(previous bottom, next top), with paragraph/heading
 * pairs summed when `lineSpacing.paragraphSpacing` is "additive" and same-style paragraphs at 0 under contextual spacing.
 */
export function blockGapPolicy(rules) {
  return blockGapActive(rules) ? "paragraphPitch" : "margins";
}

export function blockGapActive(rules) {
  const spacing = rules?.lineSpacing;
  return (spacing?.mode === "word" || spacing?.rule) && spacing.baseline === "word" && spacing.blockGap === "paragraphPitch";
}

const lineBox = (style, spacing) => resolveLineSpacing(style, spacing).pitchPt;
const round = (value) => Math.round(value * 1000) / 1000;
const textEntry = (style, before = style.spaceBeforePt || 0) => ({ mode: "text", ascent: WORD_ASCENT_EM * style.fontSizePt, before });
const textExit = (style, spacing, after = style.spaceAfterPt || 0, cssAfter = after) => ({ bottomBase: lineBox(style, spacing) - WORD_ASCENT_EM * style.fontSizePt, after, cssAfter });

/**
 * Descriptors of the block kinds a section can contain. `text` is the section's paragraph style (body, or the bibliography style);
 * `plainFigure` the CSS selector of figures without a caption kind.
 */
export function blockDescriptors(rules, text = rules.body, plainFigure = "figure") {
  const spacing = rules.lineSpacing;
  const out = [];
  const add = (key, kind, selector, entry, exit, extra = {}) => out.push({ key, kind, selector, entry, exit, ...extra });
  // Outer margins of each kind as the editor stylesheet draws them (the "margins" policy reads these).
  const textMargins = (style) => ({ top: style.spaceBeforePt || 0, bottom: style.spaceAfterPt || 0, contextual: Boolean(style.contextualSpacing || spacing?.contextualSpacing) });
  add("p", "p", "p", textEntry(text), textExit(text, spacing), { margins: textMargins(text) });
  for (const [id, named] of Object.entries(rules.paragraphStyles || {})) {
    const style = { ...text, ...named };
    add(`p:${id}`, id === "tableNote" ? "note" : "p", `p[data-thesis-style="${id}"]`, textEntry(style), textExit(style, spacing), { margins: textMargins(style) });
  }
  for (const [level, style] of Object.entries(rules.headings)) add(`h${level}`, "h", `h${level}`, { ...textEntry(style), skip: Boolean(style.pageBreakBefore) }, textExit(style, spacing), { margins: textMargins(style) });
  const figure = (key, selector, rule) => {
    const box = figureMargins(rule, ACADEMIC_FIGURE_MARGIN_PT);
    // The figure box is a flow-root in the paged editor: its caption's own margin adds to the box margin instead of collapsing with it.
    const captionTop = rule.position === "above" ? rule.spacingBeforePt ?? rule.style?.spaceBeforePt ?? 0 : 0;
    const captionBottom = rule.position === "above" ? 0 : rule.spacingAfterPt ?? rule.style?.spaceAfterPt ?? 0;
    add(key, "figure", selector, { mode: "box" }, rule.position === "below" ? textExit({ ...text, ...rule.style }, spacing, rule.spacingAfterPt ?? rule.style.spaceAfterPt ?? 0) : null, { margins: { top: box.before + captionTop, bottom: box.after + captionBottom } });
  };
  figure("figure", plainFigure, rules.figures);
  for (const [kind, rule] of Object.entries(rules.captionKinds || {})) figure(`figure:${kind}`, `figure[data-caption-kind="${kind}"]`, rule);
  // The last table row's bottom rule takes room below its line: at least one CSS px (0.75 pt) in the browser.
  const cell = { ...text, ...rules.tables.cellStyle };
  const border = rules.tables.borders ? Math.max(0.75, rules.tables.borders.widthPt || 0.5) : 0;
  add("table", "table", ".academic-table-wrap", { mode: "box" }, rules.tables.position === "above" ? { ...textExit(cell, spacing, 0), bottomBase: lineBox(cell, spacing) - WORD_ASCENT_EM * cell.fontSizePt + border } : null,
    { margins: { // Same for the table wrapper: the caption's own spacing adds to the wrapper margin on its side.
      top: TABLE_WRAP_MARGIN_PT + (rules.tables.position === "above" ? rules.tables.spacingBeforePt ?? rules.tables.style?.spaceBeforePt ?? 0 : 0),
      bottom: TABLE_WRAP_MARGIN_PT + (rules.tables.position === "above" ? 0 : rules.tables.spacingAfterPt ?? rules.tables.style?.spaceAfterPt ?? 0) } });
  // List paragraphs are text lines without spacing of their own (contextual spacing): a list ends flush.
  add("list", "list", ":is(ul,ol):not(.thesis-bibliography,.thesis-toc)", textEntry(text, 0), textExit(text, spacing, 0), { margins: { top: 0, bottom: LIST_SPACE_AFTER_PT } });
  if (rules.equations || !blockGapActive(rules)) {
    // An equation is one line of the equation style (nominal: ascent 0.9336 em); a taller formula grows its own line box (Word too).
    // Without an `equations` rule the formula is a plain body paragraph (engineCss.js), with the body's margins.
    const eq = { ...text, ...rules.equations?.style };
    const eqMargins = rules.equations ? (rules.equations.style?.lineHeight ? { top: 0, bottom: 0 } : { top: rules.equations.style?.spaceBeforePt || 0, bottom: rules.equations.style?.spaceAfterPt || 0 }) : { top: text.spaceBeforePt || 0, bottom: text.spaceAfterPt || 0 };
    add("eq", "eq", ".math-formula--block", textEntry(eq), textExit(eq, spacing, eq.spaceAfterPt || 0, 0), { nominal: { ascentPt: WORD_ASCENT_EM * eq.fontSizePt, belowPt: lineBox(eq, spacing) - WORD_ASCENT_EM * eq.fontSizePt }, margins: eqMargins });
  }
  return out;
}

/**
 * The "margins" policy gap (pt) between two blocks: what the editor's block margins give (CSS collapsing max), summed for paragraph/heading
 * pairs under `paragraphSpacing: "additive"`, 0 between same-style paragraphs under contextual spacing; null before a page-breaking heading.
 * The editor CSS (additive pairs) and the DOCX writer (every template without the paragraph-pitch table) both read it.
 */
export function marginsGap(rules, prev, next) {
  if (!prev?.margins || !next?.margins || next.entry?.skip) return null;
  const text = (kind) => kind === "p" || kind === "h" || kind === "note";
  if (prev.key === next.key && prev.kind === "p" && (prev.margins.contextual || next.margins.contextual)) return 0;
  if (text(prev.kind) && text(next.kind) && rules.lineSpacing?.paragraphSpacing === "additive") return round(prev.margins.bottom + next.margins.top);
  return round(Math.max(prev.margins.bottom, next.margins.top));
}

/** Gap (pt) between the last line box of `prev` and the first line box of `next`, or null when no rule applies. */
export function gapBetween(rules, prev, next) {
  const spacing = rules.lineSpacing, body = rules.body;
  if (blockGapPolicy(rules) === "margins") return marginsGap(rules, prev, next);
  if (!prev?.exit || !next?.entry || next.entry.skip) return null;
  const blank = body.spaceAfterPt || 0;
  if (next.entry.mode === "box") return round(blank);
  if ((prev.kind === "p" || prev.kind === "h") && (next.kind === "p" || next.kind === "h" || next.kind === "note")) return round(prev.exit.after + next.entry.before);
  if (prev.kind === "table" && next.kind === "note") return round(next.entry.before);
  // Opt-in `lineSpacing.figureExitGap: "spacing"`: text after a captioned figure keeps the body space-after as a plain box gap
  // (the way a template states "N pt between the figure-plus-caption block and the text") instead of the paragraph-pitch rule.
  if (prev.kind === "figure" && spacing.figureExitGap === "spacing" && (next.kind === "p" || next.kind === "h" || next.kind === "note")) return round(blank + next.entry.before);
  // Opt-in `lineSpacing.noteExitGap: "spacing"`: text after a table note (a shorter, single-spaced line) is the note's own space-after plus the body
  // space-after (the template's empty "bir satır boşluk" paragraph) plus the next space-before, instead of one body-paragraph pitch.
  if (prev.kind === "note" && spacing.noteExitGap === "spacing" && (next.kind === "p" || next.kind === "h" || next.kind === "note")) return round(prev.exit.after + blank + next.entry.before);
  const pitch = lineBox(body, spacing) + blank;
  return round(pitch - prev.exit.bottomBase - next.entry.ascent + next.entry.before);
}

/** Descriptor of a DOCX/HTML block; `block` is a parsed block ({ type, level, thesisStyle, captionKind }). */
export function describeBlock(descriptors, block) {
  const key = block.type === "heading" ? `h${block.level}` : block.type === "paragraph" ? (block.thesisStyle && descriptors.some((d) => d.key === `p:${block.thesisStyle}`) ? `p:${block.thesisStyle}` : "p")
    : block.type === "figure" ? (block.captionKind && descriptors.some((d) => d.key === `figure:${block.captionKind}`) ? `figure:${block.captionKind}` : "figure")
    : block.type === "list" && !/\bthesis-(bibliography|toc)\b/.test(block.className || "") ? "list" : block.type === "table" ? "table" : block.type === "math" ? "eq" : "";
  return descriptors.find((d) => d.key === key) || null;
}
