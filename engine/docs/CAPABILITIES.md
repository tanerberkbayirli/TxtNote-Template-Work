# TxtEngine capability catalog

14 October Pareto continuation: validated aggregated ChartEx column/cumulative-line caches have a text-bearing SVG preview; unknown layouts retain the source fallback. Explicit SVG direction isolates anchors from multicol RTL. The original cached picture remains the PDF representation, and DOCX retains one editable native chart. A small real browser/export control verifies that PDF image RGB pixels exactly equal the original cache. SRC09 page 91 opening passes; 11 EK-2 openings and global coverage remain open. Evidence: `orchestration/reports/ENGINE_RESUME_2026-10-14_4.md`.

14 October long-table continuation: verified long native DOCX tables use one terminal guard per physical table fragment, avoiding accumulated cell guards. Eligibility requires declared row minima greater than a page; complex cells, floating/nested tables and merges beyond two rows retain the old path. Thesis editing preserves native table paragraphs/captions rather than adding academic shells and out-of-paragraph caret pads. Real Word/Chrome controls and remaining two SRC10 page-opening failures are recorded in `orchestration/reports/ENGINE_RESUME_2026-10-14_3.md`.

14 October continuation: source DOCX preview honors explicit document default tab intervals and terminal-tab wrapping, plus inherited/disabled font kerning thresholds (`w:kern`). Line measurement uses the same kerning as rendered source runs. Controlled one-line paragraphs keep their terminal-leading guard. Independent real Word/Chrome controls and remaining long-document failures are in `orchestration/reports/ENGINE_RESUME_2026-10-14.md`; these are scoped fixes, not full layout acceptance.

14 October 2026 source-import corrections: drawing clearance skips cloning paragraphs with no active drawing; source text boxes use their own document-default bold/italic/case instead of inheriting an anchor's formatting; an empty page-section marker following a paragraph contributes no additional editor line while its original XML remains saved. Three real Word/Chrome section-marker controls are recorded under `orchestration/engine-work/resume-20261014/section-break/`. Full long-document acceptance remains open; see the current `orchestration/MISSION.md`.

User-deferred scope (11 October 2026): full long-document Word pagination parity, remaining PDF/ChartEx export, and final serial general acceptance (13-D) are explicitly postponed. These gates remain open; the engine is not certified as globally complete. The current SRC09 PDF button stops on unsupported Wingdings embedding. The 20-sample benchmark has diagnostic samples but no completed export/overall acceptance run, and no numeric performance baseline was predefined. Missions 11/12, real-Word heading numbering, bookmark/field preservation and the current SRC10 interaction proof are verified within their recorded scope. SRC08/SRC10 have now been inspected and are regression fixtures, not a blind holdout. IME evidence uses CDP composition events, not a physical OS IME.

Current handoff, 11 October 2026: portrait/landscape sections, odd/even transitions,
native footnotes/endnotes (including section numbering restarts), merged/nested and
multi-page tables, native editable OMML export, balanced imported fields and internal
links are implemented. Existing native equation content remains editable in Word;
application equation editing uses LaTeX. Unsupported source properties/layout keep
located notices and the original package. Import/model support alone is not visual
parity certification. See README's current scope and `orchestration/engine-work/final-closure/` for
fresh evidence; older phase records below do not override the final acceptance.

Mission 03 native import: **Dosya → Word içe aktar**, cancellable worker, preview,
atomic apply and persistent located report. `importThesisDocx` / `importThesisWordFile`
retain source Word sections, inherited/direct paragraph/run styles, numbering
instances/levels/overrides, relationships, notes, native objects and source bytes.
Original compressed ZIP plus per-node locators avoids ancestor-XML duplication.
All imported sections remain available in source and template modes. Source styles
are projected through scoped CSS. Unknown properties/layout are reported and kept;
native-object adapters and remaining limits are described in the current handoff below. Legacy DOC has an
explicit Word/LibreOffice `.docx` conversion route. See README "Structural Word import"
and `thesisDocxImport.test.js`; independent corpus/browser evidence is in `orchestration/engine-work/mission03`.

Mission 02 document state: `document.version`, `document.sections`, `nodes`,
`properties`, `styles`, `basedOn`, `direct`, `numbering`, `notes`, `resources`,
`references` and `source` retain semantic/native JSON independently of layout.
`document.formatMode` is `template` (default) or `source`; recorded source section
rules apply before document layout overrides. `data-txt-node-id` retains editor
identity across edits; generated pagination/line markers are not persisted.
This is model/storage support, not certification of DOCX adapters or rendering
all native objects. Tests: `thesisContentModel.test.js`; README "Persistent content
model" describes the adapter boundary and immutable edit API.

Authored table-cell alignment uses existing `fmt-align-*` classes, overriding
`tables.cellStyle.align` in editor/PDF/DOCX without replacing table-cell display.
Inline alignment styles do not survive sanitization. Test: `thesisCellAlignment.test.js`.

What a thesis template can express, so you need not read engine code. Paths are relative to the template object
(`schema.d.ts` has the types; `orchestration/reports/ENGINE_EXTENSIONS.md` the history and design notes).
Lengths are mm, type sizes and spacing pt. Everything here is opt-in unless a Default says otherwise.

Legend. Support: E editor, P layout PDF, D DOCX (tick = supported, x = not, "limit" = see Need/Notes). Tests: file in
`src/lib/` named `thesis<Name>.test.js` (e.g. `AkuFbe`), `afsu-lee` = `thesis/templates/afsu-lee.test.js`, `-` = no test names the key.
`npm test` runs `src/lib/*.test.js`. The unit test `thesisCapabilities` fails when `validation.js` accepts a key missing from this file.

Layout evidence: `layoutPdf.js` emits a version-1 `ThesisLayoutReport` (schema.d.ts):
top-left mm geometry, pt sizes, page labels/sections, anchored landmark IDs,
special blocks/headings/captions/index rows/table rows and cells/footnotes/page numbers,
exported fonts and per-page body baselines. Structural boxes inherit text metrics and
are fragmented by physical page. `thesisLayoutReport.test.js` covers the pure model;
checker gates validate the contract and independent PDF glyph samples. See README.md
"Measured layout report" and `orchestration/tools/CHECKER.md` for selectors and limitations.

## 1. Template metadata and common keys
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| template identity / provenance | `schemaVersion`, `templateVersion`, `universityId`, `universityName`, `degreeType`, `language`, `status` (demo/generic/official) | strings | required | - | AfsuTip |
| official source reference | `source.type`, `source.url`, `source.documentName`, `source.verifiedAt` (official needs url or documentName + verifiedAt) | strings | required | - | AfsuTip |
| fill-in values on special pages | `placeholders` (label/type/required/defaultValue), `derived` = `totalPages` / `frontLastLabel` / `mainPageCount` | text/date/number/multiline | - | ✓✓✓ | AkuFbe, EngineExtensions, Mcbu |
| content rules (e.g. min. keywords) | `validation` with `minItems`, `separator`, `severity`, `message` | error/warning | - | editor only | Extensions |
| required ordered chapter titles, with source-backed alternatives | `validation.<sectionId>.headingSequence`, `headingLevel` | array of titles or arrays of allowed titles; heading level 1..6 | opt-in | editor warnings/errors, no rewriting | contentConformance |
| detect author-year citations / out-of-order first numeric references; check numbered reference rows | `validation.<sectionId>.numericCitations`, `numberedEntries` | boolean; structural checks, no bibliographic or semantic certification | opt-in | editor warnings/errors | contentConformance |
| physical page limit for a section | `sections[].maxPages` | positive integer; settled page-group count required | opt-in | editor advisory, no export blocking | contentConformance |
| optional rules get engine defaults | `engineDefaults.js` (headings, tables, figures, bibliography, toc) | - | applied | ✓✓✓ | EngineDefaults |
| ids / order on any object | `id`, `type`, `order`, `title`, `label`, `kind`, `field`, `format`, `position`, `scope`, `sequence`, `number`, `mode`, `content`, `style`, `table`, `figure`, `equation`, `document`, `page`, `body`, `paragraph`, `sections`, `overrides` | see schema | - | - | AfsuLeeProposal |

## 2. Page and sections
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| paper size, orientation | `page.size`, `page.widthMm`, `page.heightMm`, `page.orientation`, `widthMm`, `heightMm`, `xMm`, `yMm` | A4 210x297 portrait | required | ✓✓✓ (portrait and landscape; Mission 06) | LayoutProperties |
| margins | `page.margins` `topMm` / `bottomMm` / `leftMm` / `rightMm`, `margins` | mm | required | ✓✓✓ | AfsuTip |
| different margins on one section (cover, approval...) | `sections[].overrides.page` (`margins`, `numbering`, size) | partial PageRule | inherits | ✓✓✓ | AkuFbe |
| header/footer height and distance, none on first page | `page.header`, `page.footer` `{heightMm, distanceMm, content, firstPage: "same"/"omit"}` (`header`, `footer`, `firstPage`) | mm | none | ✓✓✓ | Engine, EngineDefaults |
| Word margins differing from the editor frame | `page.docxMargins`, `page.docxContentFrame` | mm box | none | D only | - |
| Fixed-height Word flow text box, page-anchored independently of section margins | `page.docxContentFrame.heightMm` (plus `xMm`, `yMm`, `widthMm`) | mm box; height opts in | floating-table frame | D only | AkuFbe |
| drop trailing leading on last line of a page | `page.trimTerminalTextLeading` | boolean | false | ✓✓✓ | Pagination |
| Word last-line fit (terminal leading) | `page.lastLineFit` (derived `page.lastLineLeadingMm`) | "word" / "off" | "word" under the Word line-spacing model, else off | ✓✓✓ | Pagination |
| section kind, required/optional/disabled | `sections[]` `type`, `title`, `status`, `group` (cover/front/body/back), `mode` (editable/static/generated), `editable` | see schema | array order | ✓✓✓ | AfsuLeeProposal |
| start section on a new page or the next odd-numbered (right-hand) page | `sections[].pageBreakBefore` | boolean (new page) / `"oddPage"` / `"evenPage"` (next odd/even physical page; blank parity page is unlabelled and counted before a numbering restart) | false | ✓✓✓ | AkuCografya, ThesisPagination |
| show the title as heading, TOC entry of the section | `showTitle`, `tocEntry` headings/title/none, `titleNumbering: "continueH1"` (bibliography as "6. KAYNAKLAR") | - | false/headings | ✓✓✓ | BatchB, EngineExtensions |
| show a section only if... | `visibleWhen` `{field, equals/notEquals/in}` or `{count: tables/figures/equations/<kind>, gte}` | - | always | ✓✓✓ | BatchB |
| page content anchored to bottom (text behind cover window) | `sections[].verticalAlign` top/bottom | - | top | ✓✓✓ | SpecialPages |
| block page flowing with neighbours | `sections[].standalone: false` | - | true | ✓✓✓ | afsu-lee |
| per-section style override | `sections[].overrides` `body`, `paragraph`, `headings`, `tables`, `figures`, `captionKinds`, `footnotes` | partials | inherits | ✓✓✓ | AkuFelsefe |
| per-document user layout (text boxes, guides, frames) | `ThesisLayout` (`layout.elements/additions/guides/page/sections/pages`), `layoutMode` flow/absolute/anchored | - | - | ✓✓✓ | LayoutDocument |
| per-document special-page text highlight | `layout.elements[id].style.highlight` (preset id or `#rrggbb`; rendered as a live inline run for metadata blocks) | - | none | ✓✓✓ | LayoutDocument, SpecialPages |

## 3. Page numbering
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| number position, alignment, format | `page.numbering` `{enabled, position top/bottom, align, format arabic/roman-lower/roman-upper}` (`enabled`, `position`, `align`, `format`, `numbering`) | - | required | ✓✓✓ | AfsuTip |
| numbering restarts / starts at n | `numbering.restart`, `numbering.startAt` (per section via `overrides.page.numbering`) | int | - | ✓✓✓ | AkuCografya |
| counted page but number not printed | `numbering.enabled: false` + `numbering.indexLabelWhenHidden` | boolean | false | ✓✓✓ | AkuFbe |
| no number on chapter first pages | `page.numbering.omitOnChapterStart` | boolean | false | ✓✓✓ | OmitOnChapterStart |
| number font differs from body | `numbering.style {fontFamily, fontSizePt}` | - | body | ✓✓✓ | AkuFbe |
| number baseline / box at exact position | `numbering.baselineFromTopMm`, `numbering.xMm` + `numbering.widthMm` (together) | mm | edge placement | ✓✓✓ | PageNumberGeometry |
| centre on paper when margins differ | `numbering.centerOnPage` (align center, no box) | boolean | false | ✓✓✓ | PageNumberGeometry, AfsuEczacilikProje |

## 4. Typography and paragraph spacing
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| body font, size, weight, italic, colour | `typography.body` `fontFamily`, `fontSizePt`, `fontWeight`, `italic`, `color` (#rrggbb), `decoration`; exact face embedded (`systemFonts`) | - | required | ✓✓✓ | AkuMatematik |
| line height | `lineHeight` (multiplier of font size) in any TextStyle | 0-5 | 1.2 body | ✓✓✓ | AfsuTip |
| Word "n lines" line spacing | `typography.lineSpacing` `mode: "word"` + `singleLineEm` (TNR 1.15); DOCX writes `auto` 240 x n (`lineSpacing`, `mode`, `singleLineEm`) | - | "multiplier" | ✓✓✓ | AkuCografya, WordBaseline |
| Word baseline placement | `lineSpacing.baseline: "word"` (extra leading below text) | css/word | css | ✓✓✓ | WordBaseline |
| paragraph spacing before/after | `spaceBeforePt`, `spaceAfterPt` (`beforePt`, `afterPt` where nested) | pt | 0 | ✓✓✓ | DocxSpacing |
| Word-additive vs CSS-collapsed spacing | `lineSpacing.paragraphSpacing: "additive"/"collapse"` | - | collapse | ✓✓✓ (DOCX writes whole gap on next paragraph, F1) | AkuFbe, DocxSpacing |
| gap after figure / table / note equals one paragraph pitch | `lineSpacing.blockGap: "paragraphPitch"` + `figureExitGap`, `noteExitGap` ("pitch"/"spacing") | - | off | ✓✓✓ | AfsuEczacilikProje, AkuMatematik |
| first-line / left / right / hanging indent | `firstLineIndentMm`, `leftIndentMm`, `rightIndentMm`, `hangingIndentMm` | mm | 0 | ✓✓✓ | AkuCografya, AkuFelsefe |
| paragraph alignment | `align` left/center/right/justify | - | left | ✓✓✓ | AfsuTip |
| Word-style justified line fitting | `typography.justify: "word"` (default) \| `"browser"` (old breaking). Justified styles of TNR/Arial/Calibri get `word-spacing:-(space em x fraction)` + `font-kerning:none`; other styles get `word-spacing:0` (`justify`) | - | "word" | PDF/editor ✓ (last line natural spacing: PDF only), DOCX unchanged (Word does it natively) | EngineWordJustify |
| letter spacing | `characterSpacingPt` | pt | 0 | ✓✓✓ | LayoutProperties |
| typed tab stop (symbols list) | `tabStopMm` (single stop, no leader) | mm | - | ✓✓✓ | AkuMatematik, EngineExtensions |
| first paragraph after heading differs (no indent) | `typography.paragraph.firstAfterHeading` | partial TextStyle | - | ✓✓✓ | AkuSagbil |
| named paragraph styles (table note, quote) | `typography.paragraphStyles` + `<p data-thesis-style="id">` | partial TextStyle per id | - | ✓✓✓ | BatchB |
| text transform; lower-case words inside caps | `textTransform`, `textTransformExceptions` (["ve","ile"]) | single words | none | ✓✓✓ (exceptions: headings, TOC, Word; other elements limit) | AkuCografya, AfsuTip |
| page-break / keep flags | `pageBreakBefore`, `pageBreakUnlessAfterHeading`, `keepWithNext` | boolean | false | ✓✓✓ | AkuFbe |
| typography block itself | `typography`, `headings`, `heading` | - | - | ✓✓✓ | AfsuTip |

## 5. Headings
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| level 1-5 format | `typography.headings.<1-5>` (TextStyle + `numbering`) | - | engine default | ✓✓✓ | AfsuTip |
| heading numbering "1.2", suffix | `numbering.format` ("{n}.{n}"), `numbering.suffix`, `numbering.enabled` | - | - | ✓✓✓ | AkuFelsefe |
| Roman / alpha / ordinal counters | `numbering.sequence` arabic / roman-* / alpha-* / `ordinal-tr-upper` | - | arabic | ✓✓✓ | AkuCografya, AkuFelsefe |
| "BİRİNCİ BÖLÜM" on its own line | `numbering.placement: "ownLine"` (`placement`; `inline` default) | - | inline | ✓✓✓ | BatchB |
| chapter heading starts a page; not if right after another heading | `pageBreakBefore`, `pageBreakUnlessAfterHeading` | boolean | false | ✓✓✓ | AkuSbe |

## 6. Special pages (blocks)
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| cover, approval, declaration pages as fixed geometry | `sections[].blocks` (static, standalone physical page) | block tree, depth <= 4 | - | ✓✓✓ | SpecialPages, AkuFbe |
| block kinds | `type` image / text / metadata / spacer / separator / group; `value`, `source`, `field`, `prefix`, `suffix`, `fallback`, `markup: "inline"` (`**bold**`) | - | - | ✓✓✓ | SpecialPages |
| positioned blocks | `layoutMode`, `xMm`, `yMm`, `widthMm`, `heightMm`, `zIndex`, `flowHeightMm` (0 = no flow slot), `marginTopMm`, `marginBottomMm`, `widthPercent` | mm | flow | ✓✓✓ | LayoutDocument |
| rows / columns, gaps | `group` `direction`, `gapMm`, `minHeightMm`, `verticalAlign` top/center/bottom | - | column | ✓✓✓ | AkuFbe |
| framed cell (double / thick-thin rule) | `group.border` `{outerPt, gapPt, innerPt, paddingMm, color, docx {style, sizePt, sides}}` | - | none | ✓✓✓ (CSS frame symmetric; per-side only D) | AkuFbe |
| block shown only when fields empty / filled | `visibleWhen` `{anyFilled}` / `{noneFilled}` | field names | always | ✓✓✓ | AkuFbe |
| separator line, spacer | `separator` (`thicknessPt`, `lengthPercent`), `spacer` | - | - | ✓✓✓ | SpecialPages |

## 7. Generated indexes (contents, lists)
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| TOC / list of tables / figures / caption kind | `sections[].generatedIndex` `{kind toc/figures/tables/<kind>, title, levels, maxDepth}`; template-level `toc` `{heading, levels, showPageNumbers}` | - | - | ✓✓✓ (D: PAGEREF fields) | AkuFbe, AfsuTip |
| page numbers, leader, alignment | `generatedIndex` `includePageNumbers`, `leader` dots/none, `leaderFlow` flex/inline, `pageNumberAlignment`, `pageColumnWidthMm`, `pageHeading`, `pageHeadingStyle`; `toc.levels`, `toc.showPageNumbers`, `showPageNumbers` | - | dots | ✓✓✓ | AkuFbe, AfsuTip |
| indent / hanging of wrapped entries | `indentMm`, `hanging` "label" or mm, `labelStyle`, `matchHeadingTransform` | - | - | ✓✓✓ | AkuCografya, BatchB |
| per-level row style, rows without number | `levelStyles.<n>` `{weight, lineHeight, spaceBeforePt, leftIndentMm, align, includePageNumber:false}` (`includePageNumber`) | - | - | ✓✓✓ | AkuSbe |
| extra gap before first back-matter row | `unnumberedAfterNumberedSpaceBeforePt` | pt | 0 | ✓✓✓ | AkuSbe |
| list only from n items | `visibleWhen.count` + `gte` | - | - | ✓✓✓ | BatchB |
| limit: leaders are emulated, not Word tab stops | - | - | - | limit | - |

## 8. Captions, tables, figures, equations
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| caption label, position, number format | `tables` / `figures` `{label, position above/below, numbering {scope document/chapter, format, sequence}, style}` | - | engine default | ✓✓✓ | AkuCografya |
| printed label "Şekil 2.1." / bold label / hang | `labelFormat`, `labelStyle`, `hangingIndent` "label"/mm, `captionAlignment`, `spacingBeforePt`, `spacingAfterPt` | - | "{label} {number}." | ✓✓✓ | AkuCografya, AkuKimya |
| other numbered kinds (Resim) | `captionKinds.<id>` + `<figure data-caption-kind>` | CaptionRule | - | ✓✓✓ | BatchB |
| author picks numbering method | `captionNumberingChoices` | - | - | ✓✓✓ | - |
| split table repeats caption "(Devam)" + header row | `tables.continuation.format` ({label} {number} {title}) | - | off | ✓✓✓ (D: split at editor-measured rows) | AkuCografya, TableLayout |
| table cell typography | `tables.cellStyle` (partial TextStyle) | - | body | ✓✓✓ | AkuSbe, DocxSpacing |
| table cell padding | `tables.cellPadding` `{topMm, rightMm, bottomMm, leftMm}` (missing edge = 0; `overrides.tables.cellPadding` replaces the object) | mm | 6/8 pt (borders.preset 0 / 1.9 mm) | ✓✓✓ (DOCX `w:tcMar`) | TableLayout |
| authored column widths | content markup `<colgroup><col data-col-width="25.84">` (percent, one per grid column, no rowspans); NOT a template key | % | auto | ✓✓✓: normalized literal CSS + DOM widths; D `tblGrid`, `tcW` | TableLayout, WordStructure |
| three-rule / header-rule / no-border tables | `tables.borders` `{preset: threeRule/headerRules/none, widthPt}` (`borders`, not checked by `validation.js`) | - | grid | ✓✓✓ | AkuFbe |
| figure box: alignment and outer spacing | `figures.box` `{align, spaceBeforePt, spaceAfterPt}` (`box`) | - | left, 1.25 rem | ✓✓✓ | AkuFbe, DocxSpacing |
| numbered equations | `equations.numbering` `{scope, format "({chapter}.{n})"}`, `numberAlign` left/right, `equations.style`, `layoutAdjust` `{beforePt, afterPt}` (browser only), `equations` | - | off | ✓✓✓ | AkuFbe, AkuKimya |

## 9. Footnotes
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| footnote typography, separator | `typography.footnotes` (TextStyle keys) + `separator` `{enabled, widthPercent, thicknessPt, spaceBeforePt, spaceAfterPt}` (`footnotes`, `separator`) | - | body font 9 pt, lh 1.2, 33 %/0.5 pt | ✓✓✓ | AkuFbe, AfsuTip |
| notes at page bottom or after section | `footnotes.placement` pageBottom/sectionEnd | - | pageBottom | ✓✓✓ | AkuFbe |
| numbering per section or running | `footnotes.numbering` section/document | - | document (one running stream as in Word; "section" restarts per editable body in editor/PDF only) | ✓✓✓ | AkuSbe, BatchB |
| max note area | `footnotes.maxAreaPercent` 10-90 | % | 50 | E P ✓, D x | - |

## 10. Bibliography
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| heading, entry style, hanging indent | `bibliography` `{heading, style, hangingIndentMm, citationStyle}` | - | engine default | ✓✓✓ | AfsuTip, AfsuLeeProposal |
| bibliography numbered as next chapter | `titleNumbering: "continueH1"` | - | - | ✓✓✓ | EngineExtensions |

## 11. DOCX-specific behaviour
- Index page numbers are `PAGEREF` fields with the editor's label cached (snapshot of editor pagination; Word repaginates itself).
- Paragraph gap is written as max, not sum: whole intended gap on the next paragraph's space-before (F1). Caption below a table keeps with the last row (F2).
- Runs name the template's exact font face; `w:ind`, `w:tcMar`, `tblGrid` are written from the same keys as the editor.
- When no section uses header text, first/even header content, or a top page number, Word header parts/references are omitted document-wide; when any section needs a header, blank parts remain available to prevent cross-section inheritance.
- Continued tables: split at editor-measured rows, caption paragraph before each fragment (Word cannot vary a repeated header row).
- Named paragraph styles now have distinct Word IDs; most typography remains direct. Canonical exact/atLeast line rules, typed tab leaders, first-page and even chrome are opt-in additions (see Phase 2 notes below).

## 12. PDF and fonts
- Layout PDF reads the editor DOM (editor = PDF by construction); text drawn with embedded genuine system fonts (`model.systemFonts`).
- Required font missing: report the font actually used, never claim exact compliance.
- Math glyph fallbacks (`aliasGlyphs`) cover symbols without a Times New Roman look-alike; see `ENGINE_EXTENSIONS.md` C14-C20.

## 13. Remaining conformance work and capability gaps
| Gap | Evidence / effect | Phase |
|---|---|---|
| Typed tab: bidirectional runs, non-locale decimal character | UNKNOWN: the engine has no paragraph-direction (`w:bidi`) model, so a Word comparison would not test an engine behaviour; Word's decimal tab uses the Windows regional decimal separator, which a deterministic check cannot change (`decimalCharacter` overrides the browser measurement only). Left/center/right/decimal stops, leaders and wrapped TOC-like rows are MEASURED equal (<=0.5 mm) | MOTOR 2.4 |
| Authored column widths across browsers | typed attr() dependency removed; normalized literal CSS and idempotent DOM widths implemented; Firefox/Safari runtime not exercised here | Platform validation |
| Unnamed-block terminal allowance | UNKNOWN: captions, quotes and list items outside named paragraphStyles use the column allowance; the accepted named-style fixture does not establish their own terminal leading | Documented residual |
| Split-note horizontal placement | MEASURED residual: note text-box widths/indentation differ between editor and Word. The new split-note checks cover line counts, pages and baselines (four reference-page lines, maximum 0.016 mm); horizontal placement is outside that acceptance scope | Documented residual |
| Justification follow-ups | Deferred B3.6: editor last-line preview remains compressed; custom Word line breaker is unimplemented. engine-word-justify remains 17 PASS / 3 FAIL (Arial 10/12 pt) in both final runs | Explicitly deferred |
| Official-source PDF locators | Engine page-number landmarks are covered; independent official-source PDFs still require explicit locators when authoring source expectations | Source authoring |

| Additional source structures/variants beyond the ADU Sagbil Tier 1 pilot | source profile and preserved gaps require review before registration | University queue after MOTOR Phase 4 |

Template validation also accepts generated-index kind `appendices` and section-level
`minWords` / `minWordsByHeading` rules. These are source-driven requirements: the
appendix index reuses the generic index collector and page anchors, while minimum
word counts are advisory checks for authored sections and heading groups.

## Phase 2 opt-in additions (2026-10-03)

- Canonical `lineSpacing` `rule` auto/exact/atLeast + `value`, with known font metrics or `singleLineEm`; per-style override in editor/PDF/DOCX. Legacy models unchanged. Word acceptance matrix (`engine-word-parity`: TNR/Arial/Calibri x 10/11/12 pt x auto single/1.15/1.5/2, exact, atLeast + oversized exact 24/14, 12/8, 18/10; pitch and first baseline vs Word PASS, 146/0) is the compliance gate. MEASURED Word model: `exact` baseline at 0.8 x value, `atLeast` shortfall above the text, `exact` glyphs are not clipped in Word's PDF export (engine no longer emits `overflow:clip`). Residual: Calibri 11/12 pt first baseline +0.3 pt vs Word (within 0.25 mm).
- `contextualSpacing`; named styles have distinct Word IDs. `suppressSpaceBeforeAtPageTop` is measured against Word on forced/natural page-top fixtures in the completed 130-check structure gate.
- `indent` `firstLineMm`, `hangingMm`, `leftMm`, `rightMm`, `mirror`; alias `mirrorIndents`. Mirror uses measured per-page glyph spans in the editor and layout PDF; Word emits mirrorIndents. Glyph shifts preserve line width, including paragraphs spanning pages. MEASURED vs Word (`engine-word-structure`): even-page shift = `rightMm - leftMm` for plain and hanging indents (hanging keeps its offset on the new left edge, right limit = first-line start of the odd page); positive first-line + mirror also matches (even pages wrap narrower by the first-line indent: transient right float per even-page fragment). B3.4 is measured complete in `engine-word-structure/check-20261004-1529.json`: MIRF 76 wrapped lines over odd/even pages, maximum glyph-extent delta 0.116 mm; baseline/left/right PASS at 0.25 mm.
- `tabStops` `positionMm`, `align` left/center/right/decimal, `leader` none/dots/hyphen/underscore, `decimalCharacter`: measured browser spans, layout PDF and Word tabs. `tabStopMm` remains compatible.
- Paragraph `keepLines`, `widowControl`: Word flags; protected-paragraph and page-bottom guards are measured in the completed structure/pagefit gates.
- Tables `rowHeight` `rule` auto/atLeast/exact + `valueMm`, `cantSplit`, `repeatHeader`, `verticalAlign` top/center/bottom; `borders` `top`, `bottom`, `left`, `right`, `insideHorizontal`, `insideVertical` with `style` single/double/none/dashed/dotted, `widthPt`, `color`. Literal percentage column CSS replaces typed attr(). Row geometry follows measured Word semantics: `atLeast` is a content minimum, `exact` spans the row top to the text area's bottom (bottom margin added below), `double` rules paint at 3× declared width, and Chrome's whole-pixel border rounding is compensated in the cell top padding. `repeatHeader !== false` repeats header rows at every continuation fragment in the layout (Chrome's multicol repeats nothing) to match the DOCX `w:tblHeader` rows.
- Page `differentFirstPage`; chrome `firstContent`, `evenContent`, `trailingBlankLines`, footer `docxDistanceMm`; section `verticalAlign` center. Page/NUMPAGES fields and styled PAGEREF use cached complex-field runs. Landscape pages (`page.orientation: "landscape"` with physical `widthMm`/`heightMm`) emit `w:pgSz` with the physical width/height (the docx library swaps them for LANDSCAPE, so they are passed swapped); `engine-word-structure` compares page size, margins/text box and the number baseline vs Word. `footer.trailingBlankLines` now also lifts the page number and footer text in the editor/PDF by one body-font single line per blank paragraph (measured vs Word at 0-3 blank lines, distances 8-17.5 mm). Fields (`engine-word-structure` variant `fields`): Word updates every field (TOC, PAGEREF, SEQ, PAGE, NUMPAGES) via COM; cached results equal Word's refreshed results, page order and labels match.
- Caption numbering `liveField` emits SEQ with deterministic cached number.

Tab/border enum values: `single`, `decimal`, `hyphen`, `underscore`, `double`, `dashed`, `dotted`.

Tab leaders follow Word's measured model: glyphs sit on a page-edge grid of whole advances (Word advances in 1/600 in units, e.g. hyphen 12 pt = 3.96 pt) and only glyphs ending inside the tab are drawn; `engine-word-structure` compares leader extent and glyph count vs Word (TOC-like wrapped rows with hanging indent, left/center/right/decimal with dots/hyphens/underscores).

`decimalCharacter` overrides browser measurement only; Word decimal tabs use the document/environment locale. This option does not establish cross-export parity for a non-locale separator.
`rule` values: `auto`, `exact`, `atLeast`.

## Phase 2 B3 measured closure (2026-10-04)

Implementation checkpoint `8176503`; both `orchestration/validation/phase2-close/final-run-1.json` and `final-run-2.json` cover 14 targets: 897 PASS, 3 explicitly deferred Arial FAIL, 17 INFO, no SKIPPED/CONFLICT. Mandatory B3.1–B3.5 gates PASS: pagefit 205, structure 130, parity 146; all ten university targets have no FAIL. Both full runs completed without export failures or retries. This is measured fixture compliance, not universal Word determinism or completion of every university variant.

Per-style terminal allowance is auto pitch minus the measured single line (single/exact/atLeast = 0). The flow carries the largest allowance; smaller styles guard each fragment. Reserve stamps retain captured native padding and cancellation; break stamps keep the native guard. Kept reference paragraphs constrain available note area so Word-like note splitting can retain the paragraph. The 205-check matrix includes 23 native-table tail checks, three combined style/note cases and two split-note vertical checks; native and wrapped source tables share the same block-gap model. Historical Word render drift up to 0.367 mm remains recorded in the pagefit context; cause is not established.

## Word justified-line fitting (Mission 05, 2026-10-09)

`wordLineFit.js` applies Word's measured per-line compression budget:
`min(.25 * gaps * space, .36 * (lastWord + space) - gaps * .04 pt)`.
A paragraph-wide constant cannot implement that last-word limit. The original
J03/J04 Arial cases now pass the unchanged exact-line and 0.25 mm last-word
checks. A fresh baseline preserves the three former failures.

`wordLineLayout.js` measures actual inherited/direct run styles at 1000 px and
scales back to the original point size, avoiding Canvas's small-size rounding.
Independent Word binary searches at 0.05 pt resolution verify unbroken-token
advances for Times New Roman, Arial and Calibri. Oversized tokens have transient
nowrap fragments and break opportunities; their suffix participates in the next
line's fit. Only real whitespace contributes a compression gap. Known families
use no kerning for justified and left alignment, matching the exported DOCX.
Existing line spacing, baseline and tab mechanisms remain shared.

Plain-text presentation spans stay inside their original native runs. They do
not clone authored IDs or become source breaks. Serialization strips both spans
and transient wbr elements. Selection survives remeasurement; composition skips
rewriting until compositionend. A short final line retains natural spacing; an
overfull final line is compressed as in Word. Editor and PDF share these positions.

The eight-case source/emphasis/URL matrix has identical editor/PDF/Word line
strings (204 lines); all 22 checks pass. The six independent Word regression
targets pass 617 checks, including original justification, style precedence,
line spacing, tabs/structure and page fit. Evidence and bounded coverage are in
`orchestration/engine-work/mission05`; source excerpts do not certify full 180-page thesis pagination.

PDF export includes font families actually rendered by native inline runs,
verifies genuine embedded SFNT name tables and embedding permissions, and rejects
unsupported/missing families. The editor's document warnings name unavailable
families. The availability probe is a diagnostic, not font identity proof.
TNR/Arial/Calibri regular, bold, italic and bold-italic FontFile2 programs were
verified. Other fonts and arbitrary Unicode shaping are not Word-parity certified;
paragraphs with tabs, math, explicit breaks or specialized mirror floats retain
their existing specialized paths. No acceptance tolerances were relaxed.

### Phase 4 official-source pilot and reusable presets

`docx2spec.py` + `spec2template.mjs` generate reviewed source-derived drafts,
checks/fixtures/context and an explicit unmapped-property inventory. ADU Sagbil
master/TR is the measured Tier 1 pilot; other variants and arbitrary replacement
text on positioned pages require review.
`orchestration/specs/template-families.json` inventories official ADU Sagbil,
AKU FBE and AFSU LEE structures: two candidate families (Heading/TOC 1–9 vs 1–3).
The reviewed `wordFlowPreset` shares Word flow/additive spacing semantics and
font-program metrics already in the engine. Every university supplies its own
margins, sizes, spacing and page requirements. Theme/conditional table styles and
109 preserved ADU property groups remain explicit review inventory.
Positioned text can opt into `wordBaseline`; table cells can opt into
`cellStyle.firstLineIndentMm`. Both preserve existing template defaults.
## Mission 04: controlled PDF/OCR import

Implemented: all physical pages represented in the content model; PDF text
geometry and editable paragraphs/headings; inferred multi-column order; ruled
tables with editable cells; native raster image crops and uncertain scan regions;
separate upper/lower margin content; local Turkish/English OCR including mixed
pages and rotated scans; staged source preview, corrections, cancel/apply and
persistent located notices. Academic PDF notes retain all imported sections when
opened or reloaded through either production editor router. Original PDF bytes
and token evidence remain stored. Source/template format selection is available.

Evidence: `orchestration/engine-work/mission04/README.md`. Acceptance has two development PDFs,
46 physical pages, UI persistence/cancellation and production CSP checks.
This establishes the controlled import workflow within that corpus. Arbitrary
PDF reconstruction, perfect OCR, vector drawing semantics, borderless table
semantics, native math reconstruction and Word/PDF visual parity remain unverified.
The scan case is synthetic. Review acknowledgement does not clear uncertainties.

Mission 06: when even/odd chrome is active, Word aligns ordinary numbering restarts to physical parity. Explicit odd/even sections round conflicting restart numbers upward. Native plain header/footer text, PAGE and NUMPAGES fields are projected from imported sections; richer objects retain located notices.

