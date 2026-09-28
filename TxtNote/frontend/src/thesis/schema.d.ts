/** Thesis schema v1. Lengths are millimetres; type sizes and spacing are points. */
export type DegreeType = "undergraduate" | "master" | "phd" | "specialization" | (string & {});
export type NumberFormat = "arabic" | "roman-lower" | "roman-upper";
export type SectionKind = "outerCover" | "innerCover" | "approval" | "juryApproval" | "declaration" | "ethicsDeclaration" | "dedication" | "acknowledgements" | "preface" | "abstract" | "englishAbstract" | "tableOfContents" | "listOfTables" | "listOfFigures" | "listOfSymbols" | "listOfAbbreviations" | "mainContent" | "bibliography" | "appendices" | "curriculumVitae" | "custom";
export type Length = number; // millimetres, normalized on import
export interface TextStyle {
  fontFamily: string;
  fontSizePt: number;
  fontWeight?: number;
  italic?: boolean;
  decoration?: string;
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  characterSpacingPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  firstLineIndentMm?: Length;
  leftIndentMm?: Length;
  rightIndentMm?: Length;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  pageBreakBefore?: boolean;
  keepWithNext?: boolean;
}
export interface NumberingRule {
  enabled: boolean;
  position: "top" | "bottom";
  align: "left" | "center" | "right";
  format: NumberFormat;
  startAt?: number;
  restart?: boolean;
}
export interface PageRule {
  size: string;
  widthMm: Length;
  heightMm: Length;
  orientation: "portrait" | "landscape";
  margins: { topMm: Length; bottomMm: Length; leftMm: Length; rightMm: Length };
  header?: { heightMm: Length; distanceMm: Length; content?: string; firstPage?: "same" | "omit" };
  footer?: { heightMm: Length; distanceMm: Length; content?: string; firstPage?: "same" | "omit" };
  numbering: NumberingRule;
}
export interface HeadingRule extends TextStyle {
  numbering?: { format: string; suffix?: string; sequence?: NumberFormat | (string & {}); enabled?: boolean };
}
export interface CaptionRule {
  label: string;
  position: "above" | "below";
  style: TextStyle;
  numbering: { scope: "document" | "chapter"; format: string; sequence: NumberFormat };
  spacingBeforePt?: number;
  spacingAfterPt?: number;
  align?: "left" | "center" | "right";
  captionAlignment?: "left" | "center" | "right" | "justify" | "auto";
  /** Tables only: typography of the cells (e.g. single spacing, centered values). A cell's own alignment wins; omitted keys inherit the body. */
  cellStyle?: Partial<TextStyle>;
}
/**
 * Footnote typography and page-bottom area. Every key is optional; the engine falls back
 * to the body font at 9 pt, line height 1.2, left aligned, a 33 % / 0.5 pt separator and
 * an area of at most 50 % of the page body. Word footnotes use the same typography.
 */
export interface FootnoteRule extends Partial<Pick<TextStyle, "fontFamily" | "fontSizePt" | "fontWeight" | "italic" | "lineHeight" | "align" | "characterSpacingPt" | "spaceBeforePt" | "spaceAfterPt" | "firstLineIndentMm" | "leftIndentMm" | "rightIndentMm">> {
  /** pageBottom (default): notes at the bottom of the physical page of their reference. sectionEnd: legacy list after the section. */
  placement?: "pageBottom" | "sectionEnd";
  /** Largest share of the page body the note area may take, 10–90. Longer notes continue on the next page. */
  maxAreaPercent?: number;
  /** Rule between body and notes: length as % of the text width, thickness, space above/below. */
  separator?: { enabled?: boolean; widthPercent?: number; thicknessPt?: number; spaceBeforePt?: number; spaceAfterPt?: number };
}
export interface GeneratedIndexRule {
  kind: "toc" | "figures" | "tables";
  title?: string;
  levels?: number[];
  maxDepth?: number;
  includePageNumbers?: boolean;
  leader?: "dots" | "none";
  pageNumberAlignment?: "left" | "center" | "right";
  indentMm?: Length;
  style?: Partial<TextStyle>;
  /** Column heading above the page numbers (e.g. "Sayfa"), right aligned. */
  pageHeading?: string;
  pageHeadingStyle?: Partial<TextStyle>;
  /** TOC rows use their heading level's textTransform (an uppercase H1 is listed in capitals). */
  matchHeadingTransform?: boolean;
}
/** editable: user HTML stored in the note by section id; static: template-owned; generated: built from the document. */
export type SectionMode = "editable" | "static" | "generated";
export interface ThesisSection {
  /** Stable identity. User content is keyed by this id, never by position. */
  id: string;
  type: SectionKind | (string & {});
  title: string;
  status: "required" | "optional" | "disabled";
  group: "cover" | "front" | "body" | "back" | (string & {});
  /** Preferred. When omitted, derived from `editable`, the type (TOC/lists → generated) and content/blocks. */
  mode?: SectionMode;
  /** Legacy flag; must agree with `mode` when both are set. */
  editable?: boolean;
  /** Display order. Omitted → array position. Ties keep array order. */
  order?: number;
  /** Render `title` as the section heading. Default: false for covers, TOC and main content. */
  showTitle?: boolean;
  pageBreakBefore?: boolean;
  /**
   * Blocks sections only. `false`: the block layout flows with its neighbours (lines above or
   * below an editable section on the same page) instead of being its own physical page group.
   */
  standalone?: boolean;
  /** headings (default): the section's headings are listed; title: its title too (unnumbered, level 1); none: nothing from it. */
  tocEntry?: "headings" | "title" | "none";
  generatedIndex?: GeneratedIndexRule;
  /** Exactly one operator; metadata values, no executable expressions. */
  visibleWhen?: { field: string; equals?: string | number | boolean; notEquals?: string | number | boolean; in?: Array<string | number | boolean> };
  content?: string;
  /**
   * Special page layout (cover, approval, declaration, ...). A section with `blocks`
   * must be static and is a standalone physical page rendered by the generic specialPages.js; page
   * margins/numbering come from `overrides.page`, page typography defaults from `overrides.body`.
   */
  blocks?: SpecialPageBlock[];
  overrides?: {
    page?: Partial<Omit<PageRule, "margins" | "numbering">> & { margins?: Partial<PageRule["margins"]>; numbering?: Partial<NumberingRule> };
    body?: Partial<TextStyle>;
    paragraph?: Partial<TextStyle>;
    headings?: Record<string, Partial<HeadingRule>>;
    tables?: Partial<CaptionRule>;
    figures?: Partial<CaptionRule>;
    footnotes?: FootnoteRule;
  };
}
/** Common box properties. Lengths in mm; on text, margins are shorthand for spaceBefore/After. */
interface LayoutBox {
  marginTopMm?: Length; marginBottomMm?: Length; /** Width inside a row group. */ widthPercent?: number;
  /** Declarative: the block (and its children) is left out when none of these metadata fields is filled. */
  visibleWhen?: { anyFilled: string[] };
}
export type SpecialPageBlock =
  | (LayoutBox & { type: "image"; source: string; widthMm: Length; heightMm: Length; align?: "left" | "center" | "right" })
  /** Static template text; `{{KEY}}` placeholders are accepted for older templates. */
  | (LayoutBox & { type: "text"; value: string; style?: Partial<TextStyle> })
  /** One metadata value from thesis.values (placeholder key). prefix/suffix are static; fallback replaces an empty value. */
  | (LayoutBox & { type: "metadata"; field: string; prefix?: string; suffix?: string; fallback?: string; style?: Partial<TextStyle> })
  | (LayoutBox & { type: "spacer"; heightMm: Length })
  | (LayoutBox & { type: "separator"; thicknessPt?: number; align?: "left" | "center" | "right" })
  /** `style` is inherited by every child. Max nesting depth 4. */
  | (LayoutBox & { type: "group"; direction?: "column" | "row"; gapMm?: Length; style?: Partial<TextStyle>; blocks: SpecialPageBlock[] });
export interface PlaceholderDefinition {
  label: string;
  type: "text" | "date" | "number" | "multiline" | (string & {});
  required?: boolean;
  defaultValue?: string;
  /** Taken from the laid-out document at render/export time (never an input, never stored). */
  derived?: "totalPages";
}
/**
 * How a stored lineHeight is drawn. "multiplier" (default): CSS factor of the font size.
 * "word": Word's "n lines", n × the font's single line of `singleLineEm` (Times New Roman 1.15);
 * DOCX then writes Word's own line spacing (auto, 240 × n).
 */
export type LineSpacing = { mode: "multiplier" } | { mode: "word"; singleLineEm: number };
export interface ThesisTemplate {
  schemaVersion: 1;
  templateVersion: string;
  id: string;
  universityId: string;
  universityName: string;
  instituteId?: string;
  instituteName?: string;
  degreeType: DegreeType;
  language: string;
  selectors?: Record<string, string>;
  status: "demo" | "generic" | "official";
  /** Official sources need `url` or `documentName` (a distributed file) plus `verifiedAt`. */
  source: { type: "official" | "manual" | "imported"; url?: string; documentName?: string; revisionDate?: string; verifiedAt?: string; notes?: string[] };
  page: PageRule;
  typography: { body: TextStyle; paragraph?: Partial<TextStyle>; headings: Record<string, HeadingRule>; footnotes?: FootnoteRule; lineSpacing?: LineSpacing };
  sections: ThesisSection[];
  placeholders: Record<string, PlaceholderDefinition>;
  tables: CaptionRule;
  figures: CaptionRule;
  bibliography: { heading: string; style: TextStyle; hangingIndentMm?: Length; citationStyle?: string };
  toc: { heading: string; levels: number[]; showPageNumbers: boolean };
  validation?: Record<string, { minItems: number; separator?: string; severity?: "error" | "warning"; message?: string }>;
  /**
   * Figure/table numbering methods the author may choose for the whole document (stored as
   * thesis.captionNumbering = id). The first entry should equal the template's default numbering.
   */
  captionNumberingChoices?: Array<{ id: string; label: string; numbering: Partial<CaptionRule["numbering"]> }>;
}
