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
  /** Authored table-cell fmt-align-* classes override cellStyle.align in editor/PDF/DOCX and retain table-cell display. */
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  lineSpacing?: CanonicalLineSpacing;
  contextualSpacing?: boolean;
  indent?: { firstLineMm?: Length; hangingMm?: Length; leftMm?: Length; rightMm?: Length; mirror?: boolean };
  mirrorIndents?: boolean;
  tabStops?: { positionMm: Length; align: "left" | "center" | "right" | "decimal"; leader?: "none" | "dots" | "hyphen" | "underscore"; decimalCharacter?: string }[];
  keepLines?: boolean;
  widowControl?: boolean;
  characterSpacingPt?: number;
  spaceBeforePt?: number;
  spaceAfterPt?: number;
  firstLineIndentMm?: Length;
  leftIndentMm?: Length;
  rightIndentMm?: Length;
  /** Every line but the first starts this far right of the left indent (Word "hanging"); overrides firstLineIndentMm. */
  hangingIndentMm?: Length;
  /** Tab stop (mm from the text's left edge) for typed tabs, e.g. definitions aligned in a symbols list. */
  tabStopMm?: Length;
  /** Text colour, #rrggbb (e.g. a grey signature placeholder). */
  color?: string;
  /** Optional inline highlight for document-local special-page text overrides; preset id or #rrggbb. */
  highlight?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  /**
   * Words that stay lower-case inside an uppercase/capitalize transform (locale of the template), e.g. ["ve", "veya", "ile"]
   * for "MATERYAL ve METOT". Applied to headings in the editor/print/PDF (their exception words are drawn lower-case),
   * to generated TOC rows and to Word runs. Other elements styled with CSS text-transform only honour it in generated text.
   */
  textTransformExceptions?: string[];
  pageBreakBefore?: boolean;
  /** With pageBreakBefore on a heading: no break when the heading directly follows another heading (e.g. EKLER and its first appendix share a page). */
  pageBreakUnlessAfterHeading?: boolean;
  keepWithNext?: boolean;
}
export interface NumberingRule {
  enabled: boolean;
  position: "top" | "bottom";
  align: "left" | "center" | "right";
  format: NumberFormat;
  startAt?: number;
  restart?: boolean;
  /** A counted page whose number is not printed (enabled false) still shows its number in generated contents/lists. */
  indexLabelWhenHidden?: boolean;
  /** Page-number typography when it differs from the body (e.g. Times New Roman 10 pt). */
  style?: { fontFamily?: string; fontSizePt?: number };
  /** Optional page-top baseline for the number glyph; when absent, the existing edge placement is preserved. */
  baselineFromTopMm?: Length;
  /** Optional page-anchored text box for the number. Both values are required together. */
  xMm?: Length;
  widthMm?: Length;
  /** With align "center" and no xMm/widthMm box: centre the number on the physical page instead of the text frame (matters when left and right margins differ). Vertical placement is unchanged. Default false. */
  centerOnPage?: boolean;
  /** Opt-in (default false): a page that opens a chapter (level-1 heading starting its own page, or the first content of a page group) is counted but prints no number. Editor and layout PDF read the rendered pages; Word gets one section per chapter (next page, titlePg, number-free first-page footer/header, numbering continued). Contents/list page labels still show the counted number. */
  omitOnChapterStart?: boolean;
}
export interface PageChromePosition { xMm: Length; yMm: Length; widthMm: Length; heightMm: Length; }
export interface PageChromeParagraph { text: string; style: Partial<TextStyle>; }
export interface PageChromeImage extends PageChromePosition { src: string; alt?: string; }
export interface PageChromeRule {
  heightMm: Length;
  distanceMm: Length;
  content?: string;
  firstContent?: string;
  evenContent?: string;
  firstPage?: "same" | "omit";
  trailingBlankLines?: number;
  style?: Partial<TextStyle>;
  firstStyle?: Partial<TextStyle>;
  evenStyle?: Partial<TextStyle>;
  paragraphs?: PageChromeParagraph[];
  firstParagraphs?: PageChromeParagraph[];
  evenParagraphs?: PageChromeParagraph[];
  images?: PageChromeImage[];
  firstImages?: PageChromeImage[];
  evenImages?: PageChromeImage[];
  position?: PageChromePosition;
  firstPosition?: PageChromePosition;
  evenPosition?: PageChromePosition;
}
export interface PageRule {
  size: string;
  widthMm: Length;
  heightMm: Length;
  /** Default "word" under the Word line-spacing model ("off" opts out): lets a body page accept its last line when it fits without its extra leading (Word); the engine derives `lastLineLeadingMm` from the body style. Headings, figures and tables are guarded; special pages ignore it. */
  lastLineFit?: "word" | "off";
  orientation: "portrait" | "landscape";
  margins: { topMm: Length; bottomMm: Length; leftMm: Length; rightMm: Length };
  /** Word-only page-anchored content frame, independent of section text margins. Height opts into fixed-frame flow text. */
  docxMargins?: Partial<PageRule["margins"]>;
  docxContentFrame?: { xMm: Length; yMm: Length; widthMm: Length; heightMm?: Length; zIndex?: number; id?: string };
  /** Source Word uses logical parity unless separate even headers are enabled. */
  sectionParity?: "physical" | "logical";
  differentFirstPage?: boolean;
  header?: PageChromeRule;
  footer?: PageChromeRule & { docxDistanceMm?: Length };
  numbering: NumberingRule;
}
export type PageOverride = Partial<Omit<PageRule, "margins" | "header" | "footer" | "numbering" | "docxMargins" | "docxContentFrame">> & {
  margins?: Partial<PageRule["margins"]>;
  docxMargins?: Partial<NonNullable<PageRule["docxMargins"]>>;
  docxContentFrame?: PageRule["docxContentFrame"];
  header?: Partial<NonNullable<PageRule["header"]>>;
  footer?: Partial<NonNullable<PageRule["footer"]>>;
  numbering?: Partial<PageRule["numbering"]>;
};
export type LayoutMode = "flow" | "anchored" | "absolute";
export type ThesisLayoutTextStyle = Partial<TextStyle> & { /** Restricted to #RRGGBB when imported. */ color?: string };
export interface ThesisLayoutElementOverride {
  /** Containing-block origin for page-coordinate presentation frames in static output. */
  originXMm?: number;
  originYMm?: number;
  flowMarginTopMm?: number;
  flowMarginBottomMm?: number;
  xMm?: Length;
  yMm?: Length;
  widthMm?: Length;
  heightMm?: Length;
  layoutMode?: LayoutMode;
  style?: ThesisLayoutTextStyle;
  editableContent?: boolean;
  editableLayout?: boolean;
  locked?: boolean;
  lockAspectRatio?: boolean;
  zIndex?: number;
  deleted?: boolean;
  /** Replaces resolved text on a template text node; output remains plain text. */
  content?: string;
  /** Accepted compatibility alias for callers that already use a `text` field. */
  text?: string;
}
export type ThesisLayoutAddition = ThesisLayoutElementOverride & (
  | { id: string; sectionId: string; type: "text"; content?: string; text?: string }
  | { id: string; sectionId: string; type: "image"; source: string }
  | { id: string; sectionId: string; type: "separator"; thicknessPt?: number; lengthPercent?: number; align?: "left" | "center" | "right" }
);
export interface ThesisLayoutGuide {
  id: string;
  axis: "x" | "y";
  positionMm: Length;
  locked?: boolean;
  sectionId?: string;
  pageIndex?: number;
}
/** User layout state is optional on old documents and is always resolved against template rules. */
export interface ThesisLayout {
  version: 1;
  elements: Record<string, ThesisLayoutElementOverride>;
  additions: ThesisLayoutAddition[];
  guides: ThesisLayoutGuide[];
  page: PageOverride;
  sections: Record<string, PageOverride>;
  pages: Record<`${string}:${number}`, PageOverride>;
  typography?: { document?: ThesisLayoutTextStyle; sections?: Record<string, ThesisLayoutTextStyle> };
}
export interface ThesisDocumentState {
  layout?: ThesisLayout;
  /** Mission 02 persistent content; separate from template schemaVersion. */
  document?: ThesisContentDocument;
}
export type ThesisJson = null | boolean | number | string | ThesisJson[] | { [key: string]: ThesisJson };
/** Text is encoded HTML text verbatim: entity spelling, tabs and whitespace survive. */
export interface ThesisContentText { type: "text"; text: string }
export interface ThesisContentNode {
  /** Unique within the document; projected as data-txt-node-id for editor reconciliation. */
  id: string;
  type: "paragraph" | "run" | "heading" | "list" | "listItem" | "table" | "row" | "cell" | "image" | "equation" | "footnoteReference" | "endnoteReference" | "reference" | "nativeObject" | (string & {});
  tag: string;
  attributes: Record<string, string>;
  children: Array<ThesisContentNode | ThesisContentText>;
  /** Native adapter data, never derived from measured PDF/page/line fragments.
   * styleId resolves through document.styles; direct retains explicit false/zero.
   * Opaque XML/relationship IDs and unsupported objects remain available to adapters.
   */
  properties?: { styleId?: string; direct?: Partial<TextStyle>; [key: string]: unknown };
  [key: string]: unknown;
}
export interface ThesisContentSection {
  id: string;
  type: string;
  nodes: Array<ThesisContentNode | ThesisContentText>;
  properties?: { rules?: Record<string, ThesisJson>; [key: string]: ThesisJson | undefined };
  [key: string]: unknown;
}
/** Only finite, acyclic JSON is accepted. Unknown model versions are rejected. */
export interface ThesisContentDocument {
  version: 1;
  nextId: number;
  mainSectionId?: string;
  /** Compatibility sectionContent key → model section ID; distinct from main body. */
  sectionKeys?: Record<string, string>;
  formatMode: "template" | "source";
  sections: ThesisContentSection[];
  styles: Record<string, { basedOn?: string; properties?: Partial<TextStyle>; [key: string]: unknown }>;
  numbering: Record<string, ThesisJson>;
  notes: Record<string, ThesisJson>;
  resources: Record<string, ThesisJson>;
  references: Record<string, ThesisJson>;
  /** Native imports populate DocxImportSource or PdfImportSource. */
  source: Record<string, ThesisJson>;
  /** Detached native payloads permit HTML undo; never rendered as active content. */
  retainedNodes?: Record<string, ThesisContentNode>;
  [key: string]: unknown;
}

/** Structural Word import provenance; layout conformance is a separate gate. */
export interface DocxImportNotice {
  code: string;
  /** Package part plus an indexed XML path (or an explicit style identifier). */
  locator: string;
  message: string;
  preserved: true;
}
export interface DocxImportSource {
  format: "docx";
  fileName: string;
  sha256: string;
  mainPart: string;
  /** Original compressed bytes retained once; never an edited-export payload. */
  packageBase64: string;
  parts: Record<string, { contentType: string; size: number }>;
  nativeCounts: Record<string, Record<string, number>>;
  mappedCounts: Record<string, number>;
  unsupported: DocxImportNotice[];
  importReport: { version: 1; status: "IMPORTED" | "IMPORTED_WITH_NOTICES"; sections: number; issues: number; elapsedMs: number };
}

export interface PdfImportSource {
  format: "pdf";
  fileName: string;
  sha256: string;
  /** Original PDF retained once. Imported content is an editable interpretation. */
  packageBase64: string;
  pages: Array<{ number: number; widthPt: number; heightPt: number;
    method: "text" | "ocr" | "mixed"; preview: string; originalPreview: string;
    ocrRotation: number; ocrConfidence: number | null; sourceTokenCount: number;
    tokens: Array<{ id: string; text: string; x: number; y: number; width: number; height: number; confidence?: number }>;
    margins: { header: ThesisContentNode[]; footer: ThesisContentNode[] }; items: ThesisJson[] }>;
  unsupported: Array<{ code: string; locator: string; page: number; message: string; preserved: true }>;
  importReport: { version: 1; status: "REVIEW_REQUIRED"; pages: number; ocrPages: number;
    reviewRequired: true; reviewed: false; acknowledged?: boolean; corrections?: number; issues: number; scope: string };
}
export interface HeadingRule extends TextStyle {
  numbering?: {
    format: string; suffix?: string; enabled?: boolean;
    /** Counter style of every {n} in `format`: arabic (default), roman-lower/upper, alpha-lower/upper, or "ordinal-tr-upper" (BİRİNCİ … ONUNCU, then "11."). Caption chapters stay digits. */
    sequence?: NumberFormat | "alpha-lower" | "alpha-upper" | "ordinal-tr-upper";
    /** "ownLine": the printed number ("BİRİNCİ BÖLÜM") is a line of its own above the title, same heading style (editor, PDF, print; Word: a line break in the heading; TOC rows likewise). Default "inline". */
    placement?: "inline" | "ownLine";
  };
}
export interface CaptionRule {
  label: string;
  position: "above" | "below";
  style: TextStyle;
  numbering: { scope: "document" | "chapter"; format: string; sequence: NumberFormat; liveField?: boolean };
  spacingBeforePt?: number;
  spacingAfterPt?: number;
  align?: "left" | "center" | "right";
  captionAlignment?: "left" | "center" | "right" | "justify" | "auto";
  /** Printed label, `{label}` and `{number}` placeholders. Default "{label} {number}." ("Şekil 2.1."). */
  labelFormat?: string;
  /** Typography of the label run only (e.g. bold "Şekil 2.1" before a regular caption text). */
  labelStyle?: Partial<TextStyle>;
  /** Continuation lines start under the caption text ("label": measured label width) or at a fixed mm. */
  hangingIndent?: "label" | Length;
  /**
   * Tables only (position "above"): a table split over pages repeats its caption above every continuation
   * fragment, followed by the repeated header row(s). `format` placeholders: {label} {number} {title}, e.g.
   * "{label} {number} (Devam) {title}", "{label} {number}. (Devam) {title}", "{label} {number}. Devam.".
   * Editor/PDF: measured after layout, presentation only (never stored). Word: the table is split at the
   * measured rows and a caption paragraph precedes each continuation fragment (Word cannot vary a repeated row).
   */
  continuation?: { format: string };
  /** Figures and caption kinds: image alignment and the figure block's outer spacing (pt); without it the editor's default figure margin applies. */
  box?: { align?: "left" | "center" | "right"; spaceBeforePt?: number; spaceAfterPt?: number };
  /** Tables only: typography of the cells (e.g. single spacing, centered values). A cell's own alignment wins; omitted keys inherit the body. */
  /** Cell paragraphs default to zero first-line indent; an explicit firstLineIndentMm applies in editor/PDF and Word. */
  cellStyle?: Partial<TextStyle>;
  /**
   * Tables only, opt-in: cell padding in mm (missing edge = 0), editor/PDF (CSS padding) and DOCX (w:tcMar on every cell). Without it the
   * defaults stay (6 pt top/bottom, 8 pt left/right; `borders.preset` tables 0 / 1.9 mm). An `overrides.tables.cellPadding` replaces the whole object.
   * Authored column widths: `<colgroup><col data-col-width="25.84">…</colgroup>` (percent of table width, one `col` per grid column, no rowspans)
   * are kept by the sanitizer and written to the editor, the PDF layout and DOCX (`tblGrid/gridCol`, `tcW`).
   */
  /**
   * Word `trHeight`: `atLeast` is a minimum content height (cell margins and the rule add on top, as in
   * Word), `exact` fixes the row at `valueMm` from the row top (its rule and top margin included) to the
   * text area's bottom — the bottom margin hangs below, so rows pitch `valueMm + cellPadding.bottomMm`.
   * Exact rows taller than their text area clip at the text area's edge and overflow-aligned content
   * falls back to top, exactly as Word renders them.
   */
  rowHeight?: { rule: "auto" | "atLeast" | "exact"; valueMm?: Length };
  cantSplit?: boolean;
  /** Header rows (`<thead>`) repeat at the top of every continuation fragment in editor/PDF and are `w:tblHeader` in DOCX (Word repeats them itself). `false` opts out on both sides. */
  repeatHeader?: boolean;
  verticalAlign?: "top" | "center" | "bottom";
  borders?: { preset?: "threeRule" | "headerRules" | "none"; widthPt?: number } & Partial<Record<"top" | "bottom" | "left" | "right" | "insideHorizontal" | "insideVertical", { style: "single" | "double" | "none" | "dashed" | "dotted"; widthPt?: number; color?: string }>>;
  cellPadding?: { topMm?: number; bottomMm?: number; leftMm?: number; rightMm?: number };
}
/**
 * Footnote typography and page-bottom area. Every key is optional; the engine falls back
 * to the body font at 9 pt, line height 1.2, left aligned, a 33 % / 0.5 pt separator and
 * an area of at most 50 % of the page body. Word footnotes use the same typography.
 */
export interface FootnoteRule extends Partial<Pick<TextStyle, "fontFamily" | "fontSizePt" | "fontWeight" | "italic" | "lineHeight" | "lineSpacing" | "align" | "characterSpacingPt" | "spaceBeforePt" | "spaceAfterPt" | "firstLineIndentMm" | "leftIndentMm" | "rightIndentMm">> {
  /** pageBottom (default): notes at the bottom of the physical page of their reference. sectionEnd: legacy list after the section. */
  placement?: "pageBottom" | "sectionEnd";
  /** "section" (default): every editable section numbers its notes from 1. "document": one running number through all sections (Word already numbers its notes that way). */
  numbering?: "section" | "document";
  /** Largest share of the page body the note area may take, 10–90. Longer notes continue on the next page. */
  maxAreaPercent?: number;
  /** Rule between body and notes: length as % of the text width, thickness, space above/below. */
  separator?: { enabled?: boolean; widthPercent?: number; thicknessPt?: number; spaceBeforePt?: number; spaceAfterPt?: number };
}
export interface GeneratedIndexRule {
  /** toc, figures, tables, or the id of a template caption kind (`captionKinds`, e.g. "photo"). */
  kind: "toc" | "figures" | "tables" | "appendices" | (string & {});
  title?: string;
  levels?: number[];
  maxDepth?: number;
  includePageNumbers?: boolean;
  leader?: "dots" | "none";
  /** "inline": leader dots and page number sit on the last line of a wrapped entry (default "flex": beside the whole entry, on its first line). */
  leaderFlow?: "flex" | "inline";
  pageNumberAlignment?: "left" | "center" | "right";
  /** Width (mm) of the right-aligned page-number column; with pageNumberAlignment "center" the numbers are centred in it (e.g. under a column heading). Default: 8 mm minimum. */
  pageColumnWidthMm?: Length;
  indentMm?: Length;
  style?: Partial<TextStyle>;
  /** Column heading above the page numbers (e.g. "Sayfa"), right aligned. */
  pageHeading?: string;
  pageHeadingStyle?: Partial<TextStyle>;
  /** TOC rows use their heading level's textTransform (an uppercase H1 is listed in capitals). */
  matchHeadingTransform?: boolean;
  /** Typography of the entry label ("Şekil 2.1", "1.2"), e.g. bold. */
  labelStyle?: Partial<TextStyle>;
  /** "label": wrapped entry lines start under the entry title, after the label; a length (mm): they start that far right of the first line (Word "hanging"). */
  hanging?: "label" | Length;
  /** Row style per level (weight, lineHeight, spaceBeforePt/After, leftIndentMm override, align); `includePageNumber: false` lists the level's rows without leader and page number. The key "unnumbered" styles the unnumbered title rows (section titles such as ÖZET, GİRİŞ, KAYNAKÇA; any level) and wins over the level's own style, so numbered chapter rows and title rows of level 1 can differ. */
  levelStyles?: Record<string, Partial<TextStyle> & { includePageNumber?: boolean }>;
  /** Extra space (pt) above an unnumbered title row that directly follows a numbered row, i.e. the first back-matter row after the chapters (editor, PDF and Word). */
  unnumberedAfterNumberedSpaceBeforePt?: number;
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
  /** Starts a section on a new page; "oddPage"/"evenPage" pad with an unlabelled sheet when needed. In a duplex document, numbering restarts also align to physical parity; explicit parity starts round conflicting restart numbers up. */
  pageBreakBefore?: boolean | "oddPage" | "evenPage";
  /** Blocks sections only: "bottom" anchors the page content to the bottom margin (e.g. text behind a cover window). */
  verticalAlign?: "top" | "center" | "bottom";
  /** "continueH1": the printed title is the next numbered chapter heading (e.g. "6. KAYNAKLAR"), numbered in the TOC. */
  titleNumbering?: "none" | "continueH1";
  /**
   * Blocks sections only. `false`: the block layout flows with its neighbours (lines above or
   * below an editable section on the same page) instead of being its own physical page group.
   */
  standalone?: boolean;
  /** headings (default): the section's headings are listed; title: its title too (unnumbered, level 1); none: nothing from it. */
  tocEntry?: "headings" | "title" | "none";
  generatedIndex?: GeneratedIndexRule;
  /** Exactly one operator; metadata values, no executable expressions. */
  visibleWhen?: { field: string; equals?: string | number | boolean; notEquals?: string | number | boolean; in?: Array<string | number | boolean> }
    /** Generated sections only: shown when the document has at least `gte` items of that caption kind ("tables", "figures", "equations" or a `captionKinds` id) — e.g. a list only from three tables on. Evaluated from the collected sources; a hidden list is also left out of the TOC. */
    | { count: "tables" | "figures" | "equations" | (string & {}); gte: number };
  /** Advisory minimum of visible words for an editable section. */
  minWords?: number;
  /** Advisory physical-page limit, measured after pagination settles. */
  maxPages?: number;
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
    captionKinds?: Record<string, Partial<CaptionRule>>;
    footnotes?: FootnoteRule;
  };
}
/** Common box properties. Lengths in mm; on text, margins are shorthand for spaceBefore/After. */
interface LayoutBox {
  marginTopMm?: Length; marginBottomMm?: Length; /** Width inside a row group. */ widthPercent?: number;
  /** Positioned leaf blocks use page-origin coordinates in millimetres, shared by HTML and DOCX. */
  id?: string; layoutMode?: "flow" | "absolute" | "anchored"; xMm?: Length; yMm?: Length; widthMm?: Length; heightMm?: Length;
  /** Opt-in: retain Word baseline paint correction for positioned text; legacy positioned geometry is unchanged when absent. Requires typography.lineSpacing.baseline="word". */
  wordBaseline?: boolean;
  zIndex?: number; locked?: boolean; lockAspectRatio?: boolean;
  /** Flow height a positioned template block keeps in the flow (default: its own height; 0 = no flow slot). */
  flowHeightMm?: Length;
  /** Declarative: the block (and its children) is left out when none of these metadata fields is filled. */
  visibleWhen?: { anyFilled: string[] } | { noneFilled: string[] };
}
export type SpecialPageBlock =
  | (LayoutBox & { type: "image"; source: string; widthMm: Length; heightMm: Length; align?: "left" | "center" | "right" })
  /** Static template text; `{{KEY}}` placeholders are accepted for older templates. */
  | (LayoutBox & { type: "text"; value: string; /** "inline": `**bold**` runs in the template text (metadata values are never parsed). */ markup?: "inline"; /** Optional explicit template runs; concatenated text must equal value. */ runs?: Array<{ text: string; fontFamily?: string; bold?: boolean }>; style?: Partial<TextStyle> })
  /** One metadata value from thesis.values (placeholder key). prefix/suffix are static; fallback replaces an empty value. */
  | (LayoutBox & { type: "metadata"; field: string; prefix?: string; suffix?: string; fallback?: string; style?: Partial<TextStyle> })
  | (LayoutBox & { type: "spacer"; heightMm: Length })
  | (LayoutBox & { type: "separator"; thicknessPt?: number; align?: "left" | "center" | "right" })
  /** `style` is inherited by every child. Max nesting depth 4. */
  | (LayoutBox & { type: "group"; direction?: "column" | "row"; gapMm?: Length; style?: Partial<TextStyle>;
    /** Frame: outer rule, gap, inner rule (double / thick-thin), padding; `docx` names the Word border (e.g. thickThinSmallGap, sizePt total). */
    border?: { outerPt?: number; gapPt?: number; innerPt?: number; paddingMm?: Length; color?: string; docx?: { style: string; sizePt?: number }; /** Horizontal / vertical padding (mm) overriding paddingMm. */ paddingXMm?: Length; paddingYMm?: Length; /** Opt-in table-like frame: neighbouring framed cells/rows share one rule (editor, PDF and Word) instead of doubling it. */ collapse?: boolean };
    /** Opt-in: minimum height of the group (a table row's height; Word "at least"). */ minHeightMm?: Length;
    /** Opt-in: vertical position of the content inside a framed cell (editor, PDF and Word cell alignment). */ verticalAlign?: "top" | "center" | "bottom";
    blocks: SpecialPageBlock[] });
export interface PlaceholderDefinition {
  label: string;
  type: "text" | "date" | "number" | "multiline" | (string & {});
  required?: boolean;
  defaultValue?: string;
  /** Taken from the laid-out document at render/export time (never an input, never stored). */
  /** totalPages: all physical pages; frontLastLabel: label of the last numbered page before the Arabic restart ("ix"); mainPageCount: pages from the Arabic restart to the end. */
  derived?: "totalPages" | "frontLastLabel" | "mainPageCount";
}
/**
 * How a stored lineHeight is drawn. "multiplier" (default): CSS factor of the font size.
 * "word": Word's "n lines", n × the font's single line of `singleLineEm` (Times New Roman 1.15);
 * DOCX then writes Word's own line spacing (auto, 240 × n).
 */
export interface CanonicalLineSpacing { rule: "auto" | "exact" | "atLeast"; value: number; singleLineEm?: number; baseline?: "css" | "word"; paragraphSpacing?: "collapse" | "additive"; contextualSpacing?: boolean; suppressSpaceBeforeAtPageTop?: boolean; blockGap?: "paragraphPitch"; figureExitGap?: "pitch" | "spacing"; noteExitGap?: "pitch" | "spacing"; }
export type LineSpacing = CanonicalLineSpacing | { mode: "multiplier" } | {
  mode: "word"; singleLineEm: number;
  contextualSpacing?: boolean; suppressSpaceBeforeAtPageTop?: boolean;
  /** "word": each line's baseline at line top + lineGap + ascent (extra leading below the text), measured per text style at runtime. Default "css" (centred leading). */
  baseline?: "css" | "word";
  /** "additive": paragraphs/headings are after(prev) + before(next) apart like Word; default "collapse" (CSS max). */
  paragraphSpacing?: "collapse" | "additive";
  /** "paragraphPitch": a paragraph/heading after a figure (caption below), table (caption above) or table note starts one body paragraph pitch below the last baseline of that block, as after a paragraph. Needs baseline "word". */
  blockGap?: "paragraphPitch";
  /** With blockGap "paragraphPitch": "spacing" makes the gap from a figure caption (below the figure) to the next paragraph/heading/note exactly the body space-after (a box gap) instead of one body paragraph pitch. Default "pitch" (unchanged). */
  figureExitGap?: "pitch" | "spacing";
  /** With blockGap "paragraphPitch": "spacing" makes the gap from a table note to the next paragraph/heading/note = note space-after + body space-after + next space-before instead of one body paragraph pitch. Default "pitch" (unchanged). */
  noteExitGap?: "pitch" | "spacing";
};
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
  /** paragraph.firstAfterHeading: overrides for the first paragraph after any heading (e.g. no indent). */
  typography: {
    body: TextStyle; paragraph?: Partial<TextStyle> & { firstAfterHeading?: Partial<TextStyle> }; headings: Record<string, HeadingRule>; footnotes?: FootnoteRule; lineSpacing?: LineSpacing;
    /** Justified-text line breaking: "word" (default) fits lines like Word (spaces shrink up to a measured fraction), "browser" keeps Chromium's expand-only breaking. */
    justify?: "word" | "browser";
    /**
     * Named paragraph styles (any id, e.g. tableNote, blockQuote): the body paragraph with these keys on top, applied to
     * `<p data-thesis-style="id">` in the editor, print and PDF (CSS) and as paragraph properties in Word. The attribute is
     * source markup (saved). The editor's "Paragraf biçimi" menu offers the styles only when the template defines them.
     */
    paragraphStyles?: Record<string, Partial<TextStyle>>;
  };
  sections: ThesisSection[];
  placeholders: Record<string, PlaceholderDefinition>;
  tables: CaptionRule;
  figures: CaptionRule;
  /**
   * Further caption kinds for figures (e.g. `photo`: "Resim 4.1"). Same shape as `figures`; each kind
   * has its own counter and can have its own generated list (`generatedIndex.kind: "photo"`). A figure
   * belongs to a kind through `<figure data-caption-kind="photo">` (source markup, saved with the note);
   * an unknown/missing kind is a plain figure. The editor offers the choice only when kinds exist.
   */
  captionKinds?: Record<string, CaptionRule>;
  /**
   * Numbered display equations (`.math-formula--block[data-eq-numbered="true"]`, toggled by the author):
   * the formula is centered, its number sits flush at the right (default) or left text edge. `numbering.format`
   * uses {chapter} (counter of the numbered H1) and {n}; scope "chapter" restarts at every numbered H1.
   * The equation number is presentation (data-thesis-eq, never stored); Word: centre + right tab stops.
   */
  equations?: { /** Browser-only extra space (pt) before/after the block, compensating the formula renderer's baseline placement; Word ignores it. */ layoutAdjust?: { beforePt?: number; afterPt?: number }; numbering: { scope: "chapter" | "document"; format: string }; numberAlign?: "left" | "right"; /** fontSizePt, fontFamily/Weight/Italic of the number; lineHeight (Word lines) and spaceBeforePt/spaceAfterPt make the block one paragraph-like line. */ style?: Partial<TextStyle> };
  bibliography: { heading: string; style: TextStyle; hangingIndentMm?: Length; citationStyle?: string; numbered?: boolean };
  toc: { heading: string; levels: number[]; showPageNumbers: boolean };
  validation?: Record<string, { minItems?: number; separator?: string; severity?: "error" | "warning"; message?: string; headingSequence?: Array<string | string[]>; headingLevel?: number; numericCitations?: boolean; numberedEntries?: boolean }>;
  /**
   * Figure/table numbering methods the author may choose for the whole document (stored as
   * thesis.captionNumbering = id). The first entry should equal the template's default numbering.
   */
  captionNumberingChoices?: Array<{ id: string; label: string; numbering: Partial<CaptionRule["numbering"]> }>;
}

/** Measured PDF draw operations, independent of source-derived expected values. */
export interface ThesisLayoutRect {
  xMm: number; yMm: number; widthMm: number; heightMm: number;
}
export interface ThesisLayoutTextOp extends ThesisLayoutRect {
  id: string; landmarkId: string; ancestorIds: string[]; text: string; spaceAfter: boolean;
  baselineMm: number; fontFamily: string; exportedFont: string | null; fontSizePt: number; clipped: boolean;
}
export interface ThesisLayoutLandmark extends ThesisLayoutRect {
  /** Stable for the same template/content; duplicate anchors have deterministic instance suffixes. */
  id: string; kind: string; sectionId: string; text: string; fragments: ThesisLayoutRect[];
  firstBaselineMm: number | null; lastBaselineMm: number | null; linePitchMm: number | null;
  fontFamily: string | null; exportedFonts: string[]; fontSizePt: number | null; lineCount: number;
}
export interface ThesisLayoutReport {
  version: 1; origin: 'top-left'; units: { geometry: 'mm'; fontSize: 'pt' };
  pages: Array<{
    page: number; groupId: string; sectionIds: string[]; label: string; widthMm: number; heightMm: number;
    landmarks: ThesisLayoutLandmark[]; textOps: ThesisLayoutTextOp[];
    firstBodyBaselineMm: number | null; lastBodyBaselineMm: number | null;
  }>;
}
