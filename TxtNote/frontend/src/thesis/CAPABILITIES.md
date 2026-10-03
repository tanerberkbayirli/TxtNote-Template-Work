# TxtEngine capability catalog

What a thesis template can express, so you need not read engine code. Paths are relative to the template object
(`schema.d.ts` has the types; `orchestration/reports/ENGINE_EXTENSIONS.md` the history and design notes).
Lengths are mm, type sizes and spacing pt. Everything here is opt-in unless a Default says otherwise.

Legend. Support: E editor, P layout PDF, D DOCX (tick = supported, x = not, "limit" = see Need/Notes). Tests: file in
`src/lib/` named `thesis<Name>.test.js` (e.g. `AkuFbe`), `afsu-lee` = `thesis/templates/afsu-lee.test.js`, `-` = no test names the key.
`npm test` runs `src/lib/*.test.js`. The unit test `thesisCapabilities` fails when `validation.js` accepts a key missing from this file.

## 1. Template metadata and common keys
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| template identity / provenance | `schemaVersion`, `templateVersion`, `universityId`, `universityName`, `degreeType`, `language`, `status` (demo/generic/official) | strings | required | - | AfsuTip |
| official source reference | `source.type`, `source.url`, `source.documentName`, `source.verifiedAt` (official needs url or documentName + verifiedAt) | strings | required | - | AfsuTip |
| fill-in values on special pages | `placeholders` (label/type/required/defaultValue), `derived` = `totalPages` / `frontLastLabel` / `mainPageCount` | text/date/number/multiline | - | ✓✓✓ | AkuFbe, EngineExtensions, Mcbu |
| content rules (e.g. min. keywords) | `validation` with `minItems`, `separator`, `severity`, `message` | error/warning | - | editor only | Extensions |
| optional rules get engine defaults | `engineDefaults.js` (headings, tables, figures, bibliography, toc) | - | applied | ✓✓✓ | EngineDefaults |
| ids / order on any object | `id`, `type`, `order`, `title`, `label`, `kind`, `field`, `format`, `position`, `scope`, `sequence`, `number`, `mode`, `content`, `style`, `table`, `figure`, `equation`, `document`, `page`, `body`, `paragraph`, `sections`, `overrides` | see schema | - | - | AfsuLeeProposal |

## 2. Page and sections
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| paper size, orientation | `page.size`, `page.widthMm`, `page.heightMm`, `page.orientation`, `widthMm`, `heightMm`, `xMm`, `yMm` | A4 210x297 portrait | required | ✓✓✓ (landscape pages: x) | LayoutProperties |
| margins | `page.margins` `topMm` / `bottomMm` / `leftMm` / `rightMm`, `margins` | mm | required | ✓✓✓ | AfsuTip |
| different margins on one section (cover, approval...) | `sections[].overrides.page` (`margins`, `numbering`, size) | partial PageRule | inherits | ✓✓✓ | AkuFbe |
| header/footer height and distance, none on first page | `page.header`, `page.footer` `{heightMm, distanceMm, content, firstPage: "same"/"omit"}` (`header`, `footer`, `firstPage`) | mm | none | ✓✓✓ | Engine, EngineDefaults |
| Word margins differing from the editor frame | `page.docxMargins`, `page.docxContentFrame` | mm box | none | D only | - |
| drop trailing leading on last line of a page | `page.trimTerminalTextLeading` | boolean | false | ✓✓✓ | Pagination |
| section kind, required/optional/disabled | `sections[]` `type`, `title`, `status`, `group` (cover/front/body/back), `mode` (editable/static/generated), `editable` | see schema | array order | ✓✓✓ | AfsuLeeProposal |
| start section on a new page | `sections[].pageBreakBefore` | boolean | false | ✓✓✓ | AkuCografya |
| show the title as heading, TOC entry of the section | `showTitle`, `tocEntry` headings/title/none, `titleNumbering: "continueH1"` (bibliography as "6. KAYNAKLAR") | - | false/headings | ✓✓✓ | BatchB, EngineExtensions |
| show a section only if... | `visibleWhen` `{field, equals/notEquals/in}` or `{count: tables/figures/equations/<kind>, gte}` | - | always | ✓✓✓ | BatchB |
| page content anchored to bottom (text behind cover window) | `sections[].verticalAlign` top/bottom | - | top | ✓✓✓ | SpecialPages |
| block page flowing with neighbours | `sections[].standalone: false` | - | true | ✓✓✓ | afsu-lee |
| per-section style override | `sections[].overrides` `body`, `paragraph`, `headings`, `tables`, `figures`, `captionKinds`, `footnotes` | partials | inherits | ✓✓✓ | AkuFelsefe |
| per-document user layout (text boxes, guides, frames) | `ThesisLayout` (`layout.elements/additions/guides/page/sections/pages`), `layoutMode` flow/absolute/anchored | - | - | ✓✓✓ | LayoutDocument |

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
| positioned blocks | `layoutMode`, `xMm`, `yMm`, `widthMm`, `heightMm`, `zIndex`, `marginTopMm`, `marginBottomMm`, `widthPercent` | mm | flow | ✓✓✓ | LayoutDocument |
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
| authored column widths | content markup `<colgroup><col data-col-width="25.84">` (percent, one per grid column, no rowspans); NOT a template key | % | auto | E limit (typed `attr()`, Chrome 133+ only), P ✓, D ✓ (`tblGrid`, `tcW`) | TableLayout |
| three-rule / header-rule / no-border tables | `tables.borders` `{preset: threeRule/headerRules/none, widthPt}` (`borders`, not checked by `validation.js`) | - | grid | ✓✓✓ | AkuFbe |
| figure box: alignment and outer spacing | `figures.box` `{align, spaceBeforePt, spaceAfterPt}` (`box`) | - | left, 1.25 rem | ✓✓✓ | AkuFbe, DocxSpacing |
| numbered equations | `equations.numbering` `{scope, format "({chapter}.{n})"}`, `numberAlign` left/right, `equations.style`, `layoutAdjust` `{beforePt, afterPt}` (browser only), `equations` | - | off | ✓✓✓ | AkuFbe, AkuKimya |

## 9. Footnotes
| Need | Key | Values | Default | E P D | Test |
|---|---|---|---|---|---|
| footnote typography, separator | `typography.footnotes` (TextStyle keys) + `separator` `{enabled, widthPercent, thicknessPt, spaceBeforePt, spaceAfterPt}` (`footnotes`, `separator`) | - | body font 9 pt, lh 1.2, 33 %/0.5 pt | ✓✓✓ | AkuFbe, AfsuTip |
| notes at page bottom or after section | `footnotes.placement` pageBottom/sectionEnd | - | pageBottom | ✓✓✓ | AkuFbe |
| numbering per section or running | `footnotes.numbering` section/document | - | section | ✓✓✓ | AkuSbe, BatchB |
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
- Continued tables: split at editor-measured rows, caption paragraph before each fragment (Word cannot vary a repeated header row).
- Not expressed: Word style inheritance (all properties are direct), `exact`/`atLeast` line rules, tab leaders, `titlePg`, odd/even headers.

## 12. PDF and fonts
- Layout PDF reads the editor DOM (editor = PDF by construction); text drawn with embedded genuine system fonts (`model.systemFonts`).
- Required font missing: report the font actually used, never claim exact compliance.
- Math glyph fallbacks (`aliasGlyphs`) cover symbols without a Times New Roman look-alike; see `ENGINE_EXTENSIONS.md` C14-C20.

## 13. Known gaps (a source may require it; the engine cannot yet) and the plan that adds it
| Gap | Evidence / effect | Phase |
|---|---|---|
| Footnote single-line pitch: footnotes use the `lineHeight` multiplier, not Word's pitch | afsu-tip `footnote-single-pitch` FAIL 9.74 vs 10.84 mm (engine item A4) | MOTOR 2.1 / 2.2 |
| Line spacing rules `exact` and `atLeast` | only `auto` (n lines) and the CSS multiplier exist | MOTOR 2.1 |
| Spacing model: `contextualSpacing`, space suppressed at page top | additive/collapse only | MOTOR 2.2 |
| Mirror indents, one indent model | indents are separate CSS/DOCX paths | MOTOR 2.3 |
| Tab stops with leaders / center / right / decimal | only `tabStopMm`; TOC leaders emulated | MOTOR 2.4 |
| Table row-height rules, per-edge borders, cantSplit, vertical align | `borders.preset` only; padding via `cellPadding` | MOTOR 2.5 |
| Authored column widths in Firefox/Safari editor | typed `attr()` needs Chrome 133+; others fall back to auto widths | MOTOR 2.5 |
| Keep-lines / widow-orphan flags from template | only `keepWithNext`, `pageBreakBefore` | MOTOR 2.6 |
| Different first page, odd/even headers, section vAlign, landscape pages | header `firstPage` only; no landscape | MOTOR 2.7 |
| Footer distance as Word's `pgMar` footer | `footer.distanceMm` approximated | MOTOR 2.8 |
| Fields: live TOC, NUMPAGES, SEQ for captions; field-balance validity test | PAGEREF + cached labels only | MOTOR 2.9 |
| Checker `page_num` only searches the bottom 25 mm of the page | numbers placed elsewhere (top, offset boxes) are missed (tool gap, not engine) | MOTOR 3.2 |
| Engine layout report (`.layout.json`) for self-measurement | checker reverse-engineers PDFs | MOTOR Phase 3 |
| Template generation from official DOCX (`docx2spec`, `spec2template`) | templates are hand-written | MOTOR Phase 4 |
