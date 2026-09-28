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
