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
| authored column widths | content markup `<colgroup><col data-col-width="25.84">` (percent, one per grid column, no rowspans); NOT a template key | % | auto | ✓✓✓: normalized literal CSS + DOM widths; D `tblGrid`, `tcW` | TableLayout, WordStructure |
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
- Named paragraph styles now have distinct Word IDs; most typography remains direct. Canonical exact/atLeast line rules, typed tab leaders, first-page and even chrome are opt-in additions (see Phase 2 notes below).

## 12. PDF and fonts
- Layout PDF reads the editor DOM (editor = PDF by construction); text drawn with embedded genuine system fonts (`model.systemFonts`).
- Required font missing: report the font actually used, never claim exact compliance.
- Math glyph fallbacks (`aliasGlyphs`) cover symbols without a Times New Roman look-alike; see `ENGINE_EXTENSIONS.md` C14-C20.

## 13. Remaining conformance work and capability gaps
| Gap | Evidence / effect | Phase |
|---|---|---|
| Footnote single-line pitch: footnotes use the `lineHeight` multiplier, not Word's pitch | afsu-tip `footnote-single-pitch` FAIL 9.74 vs 10.84 mm (engine item A4) | MOTOR 2.1 / 2.2 |
| Canonical line-spacing conformance | auto/exact/atLeast implemented; calibrated Word font matrix remains required; oversized exact PDF clipping must be measured | MOTOR 2.1 |
| Contextual/page-top spacing conformance | contextual named-style and suppressSpaceBeforeAtPageTop models implemented; forced/natural break fixture verifies Word behaviour | MOTOR 2.2 |
| Mirror indent conformance | shared resolved model, DOCX mirrorIndents + per-page browser glyph shifts; static print parity not yet measured | MOTOR 2.3 |
| Typed tab conformance | typed stops/leaders implemented; wrapped/bidirectional runs and custom decimal characters require Word comparison | MOTOR 2.4 |
| Table geometry/pagination conformance | rowHeight, per-edge borders, cantSplit, repeatHeader and vAlign implemented; exact overflow uses clipped presentation cell wrappers; Word comparison required | MOTOR 2.5 |
| Authored column widths across browsers | typed attr() dependency removed; normalized literal CSS and idempotent DOM widths implemented; Firefox/Safari runtime not exercised here | MOTOR 2.5 |
| Keep/widow pagination conformance | keepLines/widowControl reach browser fragmentation and Word; protected-paragraph fixture verifies breaks | MOTOR 2.6 |
| Section chrome/alignment conformance | first/even chrome and center/bottom alignment implemented; landscape geometry emitted but cross-render comparison required | MOTOR 2.7 |
| Footer baseline conformance | source distance, trailing blank paragraphs and source-derived baseline represented independently; Word comparison required | MOTOR 2.8 |
| Complex field validity/live refresh | PAGE, NUMPAGES, TOC, PAGEREF and optional SEQ are complex fields; every-template nested field balance tested; Word render verifies refresh/order | MOTOR 2.9 |
| Page-number landmark coverage | layout landmarks replace bottom-only searches where available; source PDFs still need explicit page-number locators | MOTOR 3.2 |
| Layout report performance/conformance | versioned editor landmarks implemented; target regression/runtime gate verifies acceptance | MOTOR Phase 3 |
| Template generation from official DOCX (`docx2spec`, `spec2template`) | templates are hand-written | MOTOR Phase 4 |

## Phase 2 opt-in additions (2026-10-03)

- Canonical `lineSpacing` `rule` auto/exact/atLeast + `value`, with known font metrics or `singleLineEm`; per-style override in editor/PDF/DOCX. Legacy models unchanged. Word acceptance matrix is the compliance gate.
- `contextualSpacing`; named styles have distinct Word IDs. `suppressSpaceBeforeAtPageTop` covers section-top CSS; continuation-column-top behaviour still needs measurement.
- `indent` `firstLineMm`, `hangingMm`, `leftMm`, `rightMm`, `mirror`; alias `mirrorIndents`. Mirror uses measured per-page glyph spans in the editor and layout PDF; Word emits mirrorIndents. Glyph shifts preserve line width, including paragraphs spanning pages. Static print parity remains unverified.
- `tabStops` `positionMm`, `align` left/center/right/decimal, `leader` none/dots/hyphen/underscore, `decimalCharacter`: measured browser spans, layout PDF and Word tabs. `tabStopMm` remains compatible.
- Paragraph `keepLines`, `widowControl`: Word flags; paged CSS fragmentation policy is applied independently.
- Tables `rowHeight` `rule` auto/atLeast/exact + `valueMm`, `cantSplit`, `repeatHeader`, `verticalAlign` top/center/bottom; `borders` `top`, `bottom`, `left`, `right`, `insideHorizontal`, `insideVertical` with `style` single/double/none/dashed/dotted, `widthPt`, `color`. Literal percentage column CSS replaces typed attr(). Exact overflowing rows remain browser-conformance-sensitive.
- Page `differentFirstPage`; chrome `firstContent`, `evenContent`, `trailingBlankLines`, footer `docxDistanceMm`; section `verticalAlign` center. Page/NUMPAGES fields and styled PAGEREF use cached complex-field runs.
- Caption numbering `liveField` emits SEQ with deterministic cached number.

Tab/border enum values: `decimal`, `hyphen`, `underscore`, `double`, `dashed`, `dotted`.

`decimalCharacter` overrides browser measurement only; Word decimal tabs use the document/environment locale. This option does not establish cross-export parity for a non-locale separator.
`rule` values: `auto`, `exact`, `atLeast`.
