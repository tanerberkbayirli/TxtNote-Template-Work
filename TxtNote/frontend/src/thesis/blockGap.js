import { resolveLineSpacing } from "./typography.js";
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
  add("p", "p", "p", textEntry(text), textExit(text, spacing));
  for (const [id, named] of Object.entries(rules.paragraphStyles || {})) {
    const style = { ...text, ...named };
    add(`p:${id}`, id === "tableNote" ? "note" : "p", `p[data-thesis-style="${id}"]`, textEntry(style), textExit(style, spacing));
  }
  for (const [level, style] of Object.entries(rules.headings)) add(`h${level}`, "h", `h${level}`, { ...textEntry(style), skip: Boolean(style.pageBreakBefore) }, textExit(style, spacing));
  const figure = (key, selector, rule) => add(key, "figure", selector, { mode: "box" }, rule.position === "below" ? textExit({ ...text, ...rule.style }, spacing, rule.spacingAfterPt ?? rule.style.spaceAfterPt ?? 0) : null);
  figure("figure", plainFigure, rules.figures);
  for (const [kind, rule] of Object.entries(rules.captionKinds || {})) figure(`figure:${kind}`, `figure[data-caption-kind="${kind}"]`, rule);
  // The last table row's bottom rule takes room below its line: at least one CSS px (0.75 pt) in the browser.
  const cell = { ...text, ...rules.tables.cellStyle };
  const border = rules.tables.borders ? Math.max(0.75, rules.tables.borders.widthPt || 0.5) : 0;
  add("table", "table", ".academic-table-wrap", { mode: "box" }, rules.tables.position === "above" ? { ...textExit(cell, spacing, 0), bottomBase: lineBox(cell, spacing) - WORD_ASCENT_EM * cell.fontSizePt + border } : null);
  // List paragraphs are text lines without spacing of their own (contextual spacing): a list ends flush.
  add("list", "list", ":is(ul,ol):not(.thesis-bibliography,.thesis-toc)", textEntry(text, 0), textExit(text, spacing, 0));
  if (rules.equations) {
    // An equation is one line of the equation style (nominal: ascent 0.9336 em); a taller formula grows its own line box (Word too).
    const eq = { ...text, ...rules.equations.style };
    add("eq", "eq", ".math-formula--block", textEntry(eq), textExit(eq, spacing, eq.spaceAfterPt || 0, 0), { nominal: { ascentPt: WORD_ASCENT_EM * eq.fontSizePt, belowPt: lineBox(eq, spacing) - WORD_ASCENT_EM * eq.fontSizePt } });
  }
  return out;
}

/** Gap (pt) between the last line box of `prev` and the first line box of `next`, or null when no rule applies. */
export function gapBetween(rules, prev, next) {
  const spacing = rules.lineSpacing, body = rules.body;
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
