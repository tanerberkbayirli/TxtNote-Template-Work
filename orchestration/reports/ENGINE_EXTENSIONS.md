# Engine extensions (generic, opt-in, backward compatible)

Every capability below is required by at least one reviewed spec (target ids in brackets). Each is
generic data in `schema.d.ts`, interpreted by the engine/editor CSS (the layout PDF reads the
editor DOM, so it follows automatically) and by the DOCX writer. Templates that do not use a key
are unchanged; MCBÜ v1 and generic/demo templates keep their behaviour.

## Done
| id | capability | key | required by |
|---|---|---|---|
| F1 | genuine system fonts embedded for official templates | `model.systemFonts` (derived) | all |
| W1 | Word line placement (first baseline = top + lineGap + ascent) | `typography.lineSpacing.baseline: "word"` | all AKU (measured on guides) |
| W2 | Word-additive paragraph spacing | `typography.lineSpacing.paragraphSpacing: "additive"` | aku-sbe, aku-cografya-lisans |

## Batch A (typography / captions / pages)
| id | capability | key | required by |
|---|---|---|---|
| A1 | page-number typography | `page.numbering.style: { fontFamily, fontSizePt }` | fbe, mbg, cografya |
| A2 | caption label format, label style, hanging indent | `CaptionRule.labelFormat` (`"{label} {number}"`), `labelStyle`, `hangingIndent: "label" \| mm` | all |
| A3 | three-rule tables, header style | `tables.borders: { preset: "grid" \| "threeRule" \| "none", widthPt }` | fbe, mbg |
| A4 | numbered section title (bibliography as next chapter) | `section.titleNumbering: "continueH1"` | fbe, mbg, cografya |
| A5 | inline bold runs in special-page text | `**bold**` in text/metadata `value/prefix/suffix` when block `markup: "inline"` | fbe, sagbil, mbg |
| A6 | hanging indent in any TextStyle | `TextStyle.hangingIndentMm` | fbe, sagbil, sbe, mbg |
| A7 | bordered special-page group | `group.border: { style: "single" \| "double" \| "thickThin", widthPt, paddingMm }` | fbe |
| A8 | text colour | `TextStyle.color` (#rrggbb) | fbe |
| A9 | derived page counts | `derived: "frontLastLabel" \| "mainPageCount"` | fbe, mbg |
| A10 | tab stops for editable paragraphs | `TextStyle.tabStopMm` (CSS tab-size / DOCX tab) | cografya, fbe |
| A11 | generated index per-level styles, label style, hanging | `generatedIndex.levelStyles`, `labelStyle`, `hanging: "label"` | sbe, sagbil, fbe, mbg |
| A12 | first paragraph after a heading | `typography.paragraph.firstAfterHeading` | sagbil |
| A13 | special page vertical anchoring | `section.verticalAlign: "top" \| "bottom"` | sagbil |

## Batch B (structures) - implemented
Every key is opt-in; templates without it (generic, demo-*, `mcbu` v1) compile and export exactly as before. Each has unit tests
(`src/lib/thesisBatchB.test.js`, 38) and a real-browser export proof (`tests/batchb-measure.py <scenario>`, custom demo templates served by
`tests/thesis-batchb.html`; editor behaviour: `tests/batchb-ui.mjs`).

| id | capability | key | required by | notes |
|---|---|---|---|---|
| B1 | additional caption kinds with own counter and list (Resim) | `captionKinds: { photo: CaptionRule }`, `<figure data-caption-kind="photo">` (source markup), `generatedIndex.kind: "photo"`, `visibleWhen.count: "photo"` | sbe, fbe, mbg | per-kind counters; unknown kind = plain figure; editor: "Resim ekle" button and a "Görsel türü" select (click a figure), both only when the template has kinds; DOCX/print/TOC use the kind's rule |
| B2 | continuation caption on split tables | `tables.continuation: { format }` (`{label} {number} {title}`, any text, e.g. `"{label} {number}. (Devam) {title}"`, `"{label} {number}. Devam."`), caption above | fbe, cografya, mbg, sagbil | see design below |
| B3 | equation numbering | `equations: { numbering: { scope: "chapter"\|"document", format: "({chapter}.{n})" }, numberAlign: "right"\|"left", style }` | fbe, mbg | number = presentation (`data-thesis-eq`), flag = source (`data-eq-numbered`); editor buttons "Denklem" / "Denklem no" only with `equations`; Word: centre + right tab stop |
| B4 | ordinal chapter label on its own line, 5 levels | `headings.N.numbering.sequence: "ordinal-tr-upper"`, `numbering.placement: "ownLine"`, `generatedIndex.levelStyles[N]: { align, includePageNumber: false }` | sbe | BİRİNCİ … ONUNCU, then "11."; caption chapter numbers stay digits; TOC row = label line + title line; Word: one heading paragraph with a line break; level 5 verified (toolbar, Heading5 outline level 5, TOC) |
| B5 | continuous footnote numbering | `typography.footnotes.numbering: "document"` (default `"section"`) | sbe | references count on through the sections (editor DOM, notes, print); Word already numbers notes continuously, unchanged |
| B6 | lists only from n items | generated section `visibleWhen: { count: "tables"\|"figures"\|"equations"\|<caption kind>, gte: n }` | sbe | evaluated from `collectIndexSources`; a hidden list also leaves the TOC. Appendices are not counted (TxtNote has no appendix object; skipped) |
| B7 | named paragraph styles | `typography.paragraphStyles: { tableNote: Partial<TextStyle>, ... }`, `<p data-thesis-style="id">` (source markup) | fbe, mbg, cografya, sbe | CSS (editor/print/PDF), Word paragraph properties, "Paragraf biçimi" menu lists them only when defined; additive spacing honoured |
| X1 | words kept lower-case in uppercase/capitalized text | `TextStyle.textTransformExceptions: ["ve","veya","ile"]` | cografya, fbe | see design below |

### Design decisions (Batch B)
- **B2 continuation captions.** Chromium's multicol fragmentation splits a table by row but neither repeats its `thead` (measured: it only does so in
  paged media) nor its caption. After layout `tableContinuation.js` reads which rows begin a page and puts a presentation-only caption row
  (`break-before: column`, so it always starts the page) plus copies of the header rows in front of each of them (`tr[data-thesis-cont]`). They are real
  table rows, so the flow is exact and the layout PDF draws them; they are stripped from saved HTML, rebuilt from scratch on every pass (page by page in one
  synchronous pass, at most 200 per table; the editor's stabilization loop keeps its 6-iteration cap) and only exist for templates with `tables.continuation`.
  Real export (`batchb-measure.py continuation`): a 120-row table over 6 pages; pages 4-8 start with "Tablo 1.1 (Devam) …" and the header row, the first page and
  the short tables do not. Word: the table is split at the rows measured in the editor; every later fragment has its caption paragraph and the header row again
  (Word cannot vary the text of a repeated header row). Word paginates itself, so like the index page numbers this is a snapshot of the editor layout. Print
  HTML (browser printing) has no continuation captions.
- **X1 text-transform exceptions.** CSS `text-transform` cannot skip words, so generated text (TOC rows, Word runs, fallback PDF) uses
  `transformThesisText`, and the exception words of headings are wrapped in `<span data-thesis-lower>` (CSS `text-transform: lowercase`) in the editor DOM
  and print HTML; the layout PDF reads that computed style. The wrapper is unwrapped by `thesisSourceHtml` (never stored), re-derived after every change,
  keeps the caret by character offset and pauses during IME composition. Limit: only headings are wrapped in the DOM; other elements styled with an
  uppercase transform honour the list in generated text only. The words are matched case-insensitively (Turkish locale), also when typed as "VE".
- **B4 chapter numbers in captions.** With an ordinal sequence `{chapter}` in caption numbers stays a digit ("Tablo 1.1", not "Tablo BİRİNCİ.1").
- **Fix found on the way (Batch A key).** `tables.borders` `threeRule`/`none` cell borders and padding were overridden by the editor stylesheet's
  `!important` table rules (grid drawn in editor/PDF; only Word was right); the template rules now carry `!important`.
- **Test seam.** `ThesisEditor` accepts an optional `templateRegistry` prop (default: the bundled registry) so fixtures can serve a custom template;
  `orchestration/tools/export.mjs` reads `THESIS_FIXTURE_PAGE` (default `/tests/thesis.html`).

## Not engine work (documented per target)
- Author choices (font 10–14 pt, table label) [sagbil]: implemented as the documented default; choice UI is a product feature, not a formatting rule.
- Landscape pages [fbe, cografya]: conditional rule ("if used"); TxtNote has no landscape page — documented limitation.
- Printing (duplex, spiral binding, paper weight, copies) [all]: physical production, recorded in `source.notes`.
- Case of H1/H2 with lower-case "ve/veya/ile": now `TextStyle.textTransformExceptions` (X1); `textTransform: "none"` with author-typed case remains possible.

## Batch C (found while integrating aku-fbe; generic, opt-in or bug fixes)
| id | change | key / place | notes |
|---|---|---|---|
| C1 | figure box (image alignment + own outer spacing) | `CaptionRule.box: { align, spaceBeforePt, spaceAfterPt }` (figures, captionKinds) | without it the editor's default figure margin (1.25 rem) and left-aligned image stay (mcbu unchanged) |
| C2 | special-page block visible only while fields are empty | `visibleWhen: { noneFilled: [...] }` | complements `anyFilled` |
| C3 | fix: hanging indent in a paragraph override padded the whole flow container | `thesisSectionCss` `containerCss` | `typography.paragraph`/`overrides.paragraph` `hangingIndentMm` now only hangs the paragraphs |
| C4 | fix: dotted leaders too short for short TOC rows | `generatedIndex.js` 80 → 400 dots | clipped by the leader box |
| C5 | fix: justified special-page text (approval sentence, ethics items) was drawn as one unjustified run in the layout PDF | `layoutPdf.js` per-word drawing for `text-align: justify` | `typography` now carries `textAlign` |
| C6 | fix: three-rule table drew its top rule above an above-table caption | `tables.borders.threeRule` rules on first/last row cells, not the `table` box | Chromium encloses the caption with a collapsed table border |
| C7 | fix: additive spacing pushed a page-starting heading down (forced break keeps the margin) | `paragraphSpacing: "additive"` rules skip `pX+hN` for headings with `pageBreakBefore` | chapter headings after a paragraph sat 7.3 mm too low |
| C8 | equation block as one paragraph-like line (opt-in) | `equations.style.lineHeight`, `spaceBeforePt`, `spaceAfterPt` | drops the KaTeX display margin; the editor's ZWSP caret pads around block formulas still add a line box (known limit, see aku-fbe notes) |
| C9 | leader and page number on the last line of a wrapped index entry (opt-in) | `generatedIndex.leaderFlow: "inline"` | leader = out-of-flow span at its static position (clipped by the title box), page number = right float; layout PDF clips dots at the page number; default unchanged |
| C10 | additive spacing after non-paragraph blocks (opt-in) | `typography.lineSpacing.blockGap: "paragraphPitch"` (`blockGap.js`) | a paragraph/heading after a figure caption, table or table note starts one body paragraph pitch (41.4 pt) below the block's last baseline; CSS margin-top and DOCX space-before agree; table adds its bottom rule (>= 0.75 pt) |
| C11 | per-side Word border styles on a framed group | `group.border.docx.sides { top, right, bottom, left }` | DOCX only (CSS frame is symmetric: outer/gap/inner widths) |
| C12 | caption label as inline box of hang width | `hangingIndent: "label"` CSS `::before{display:inline-block;width:hang}` + PDF label at `text - hang` | justification no longer stretches the gap after the label; first line starts at the margin, continuation lines align under the caption text |
| C13 | footnote numbers derived at render time | `decorateThesisSources`, print HTML | 1, 2, 3 in reading order (offset for document numbering), never trusted from stored markup |
| C14 | block equations: caret pads cancelled, 12 pt glyphs, browser adjustment | measured `data-thesis-eq-pad-before/after` (presentation, never stored), `.katex{font-size:1em}` with `equations.style.fontSizePt`, `equations.layoutAdjust { beforePt, afterPt }` | editor/PDF equal Word's paragraph spacing |
| C15 | layout PDF math glyphs | `PDF_GLYPH_ALIASES` (⋅ → ∙), radical drawn as "√" + rule, "≠" merged from KaTeX's overlay | glyphs without a Times New Roman look-alike stay unavailable (failures/aku-fbe/equation-font.md) |
| C16 | ONE block-gap table (retry 2) | `blockGap.js`: `blockDescriptors`, `gapBetween`, `describeBlock`; used by engine CSS and DOCX | kinds p/note/h/figure/table/list/eq; DOCX space-before = gap - previous space-after; replaces the per-context fixes of C10/C14; table -> note = note's own space-before |
| C17 | equations on the line grid (retry 2) | measured attributes `data-thesis-eq-pad-before/after`, `-lift`, `-drop`, `-base`, `-fit` (never stored; probe span stripped), `.katex-html` wraps inside number-wide gutters | replaces `equations.layoutAdjust`; relative paint offsets of paragraphs are corrected when measuring; first-in-column equation starts at the top line |
| C18 | layout PDF text ends where the browser's ends (retry 2) | `drawOp` spreads the difference (kerning) over the run's glyphs for genuine embedded families | max right edge <= 180.08 mm on every page (mcbu v1: 6 cover lines end up to 1.76 mm nearer to the browser's line ends) |
| C19 | no cumulative page drift (retry 2) | sheets, PDF `pageTop` and page bucketing use `flowPagePitchPx` | first baseline of page 160 of 160 = page 1 (33.95 mm); other templates: baselines move <= 0.1 mm on the last pages |
| C20 | PDF glyph fallbacks (retry 2) | `aliasGlyphs`: NFKD of Greek symbol variants, math alphanumerics, letterlike symbols; radical drawn as glyph + rule; wide formulas wrap | ∇ ∈ ⇒ ∀ ∃ ⊂ ∪ ∮ ∝ and the \vec accent arrow remain undrawable |
| C21 | DOCX index page labels are PAGEREF fields (retry 2) | bookmarks on headings, captions, index titles, special-page titles (`_ref_*`), `SimpleField` with the editor label cached | all templates; every PAGEREF target exists |
| C22 | equation caret pads never left unset (retry 3) | `equationPadAfter()` in `generatedIndex.js`: measured pad when plausible, else the flow's line height (both before and after the formula) | only templates with `equations.style.lineHeight` (aku-fbe); proven by `orchestration/tools/eq-sweep.mjs` (equations at every line position, 41.4 pt +-0.2 each side) |
| C23 | PDF text layer reads labels first (retry 3) | `pushLabel` inserts heading numbers, caption labels and list markers before the element's first text op (`label: true`, skipped when anchoring parent labels) | positions of every word identical for mcbu v1 and the demo templates; only extraction order changes ("1. GİRİŞ" is searchable) |

## Batch D (MCBÜ LEE fix-1, 2026-10-02; generic, backward compatible)

| id | change | key / place | notes |
|---|---|---|---|
| D1 | fix (HIGH): special-page block rules leaked between sections of one page group | `thesisSectionCss`: `specialPageCss` scope is `:is(.thesis-flow-section[data-thesis-flow-section=ID])` only (was `:is(paper, fragment)`) | block rules are keyed by index per section; the page paper (`data-thesis-section` = FIRST section id of the group) is an ancestor of every later static section, so the first section's `[data-thesis-block="1"]{height:..}` (a spacer) applied to a later section's block 1 (a wrapped text) and clipped its height: the following spacer overlapped the second text line (MCBÜ keywords -> year pitch 13.8 pt instead of 27.6 pt; AKÜ Coğrafya year/pages line 2.44 mm too high). DOCX was never affected. mcbu-lee/AKÜ MBG/AKÜ FBE-long89 exports otherwise identical (cmp.py) |
| D2 | fix: generated label of a justified line (heading number, caption label) drawn next to the stretched first word | `layoutPdf.js` `generatedLabelX`: justify -> line start (content box + padding + text-indent); hang and left/centre unchanged | MCBÜ long figure caption started 2.21 mm right of the margin in the PDF (DOCX firstLine 0) |
| D3 | `generatedIndex.hanging` also a length (mm) | `hanging: "label" \| Length`; CSS `.thesis-index-text{padding-left:H;text-indent:-H}`, DOCX `w:ind left/hanging` | fixed hang independent of the label width (MCBÜ lists: 1176 twips = 20.74 mm). `"label"` unchanged |
| D4 | DOCX figure paragraph honours `figures.box.align` | `export.js` figure paragraph `alignDocx(figures.box?.align \|\| "center")` | default stays centred (no change without `box`); PDF/editor already used `box.align` |
| D5 | template-level (no engine change): MCBÜ opts in to `typography.lineSpacing.baseline: "word"` | `templates/mcbu.js` | Word puts the extra leading of 1.5 lines below the text; without the opt-in the 1.5-spaced lines were drawn 1.33 mm lower than single lines (first baseline 30.03 vs 28.70 mm); now 28.95 mm for both; pitches unchanged |
| D6 | fix: a layout frame (absolute/anchored) at z 0 was hidden under later in-flow lines of a Word-baseline template | `specialPageBoxCss`: frames with zIndex >= 0 get `z-index: zIndex + 1` (negative unchanged) | the baseline lift makes in-flow text `position:relative; z-index:0`, which tied with the frame and painted in DOM order (layout-editor e2e: click on a dragged cover line intercepted by the next line). Order among frames is kept; export (DOCX/PDF zIndex from the model) unchanged |
