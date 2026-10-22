# Thesis template engine

19 October 2026: SRC09 source Word/editor A1/A2 gates closed (180/180, 0/157, identical blank sheets, corrected coverage 0.99511). Native cached-index tabs, content-control section marks and logical floating-frame height are corrected. Supported SVG labels export as visible searchable text with their real font/baseline. This is scoped acceptance; overall SRC09 certification is not granted. [Evidence and method distinction](../../reports/SRC09_A1_A2_KAPANIS_2026-10-19.md); current tasks are only in [Missions.md](../../Missions.md).


16 October 2026 export update: source DOCX export preserves source formatting while writing live edits; cross-section fields and source header pictures survive export. PDF graphics, clipping and orthogonal rotated labels are transferred, and normal academic PDF keeps measured editor typography. Fresh saved SRC09 exports are 180 pages in editor, PDF and Word before/after field update. This is scoped export validation; broader source-import/coverage acceptance remains open. See [implementation and evidence](../../reports/EXPORT_DUZELTMELERI_2026-10-16.md).

Current locations (13 October 2026): production sources are in `engine/src/` at the project root; documentation is here under `engine/docs/`. Use [GOREVLER.md](../../orchestration/GOREVLER.md) for status. Dated acceptance statements below are historical and do not supersede that mission.

The engine retains its existing dependencies on application helpers in `TxtNote/frontend/src/lib/` and `config/`. Its DOCX runtime bridge uses the application's `docx` classes so Node exporters and imported components keep the same identities; Vite also deduplicates shared runtime packages.

14 October 2026: source drawing clearance avoids cloning unrelated paragraphs, source text-box defaults are isolated from body anchors, and empty page-section markers following plain paragraphs keep Word's zero additional line height. These changes preserve source nodes and native XML. Current long-document measurements and open gates are in `orchestration/MISSION.md`; historical scope notes below are not current status.

The continuation also keeps controlled single-line paragraphs with their terminal-leading guard, imports explicit document default tab intervals, wraps terminal source tabs without carrying the preceding word, and honors inherited `w:kern` font-size thresholds in both preview and line measurement. Small real Word/Chrome controls are recorded in `orchestration/engine-work/resume-20261014/`; long-document acceptance remains open.

The next continuation moves the terminal guard to a presentation-only wrapper for verified long native tables, while short/complex/floating tables retain their existing path. Thesis editing also preserves native Word tables instead of adding academic caption shells and caret pads outside their paragraphs. Four real Word/Chrome table controls, three merged-table regressions and exact HTML undo are recorded in `orchestration/engine-work/resume-20261014-3/`. SRC10 now has two open page openings; full acceptance remains open.

Cached aggregated ChartEx Pareto charts (one clustered-column series and its owned cumulative line) now have a text-bearing SVG preview. Duplicate categories are aggregated, values sorted descending and the cumulative line ends at 100%; invalid caches and unknown layouts retain the source fallback. Native chart/package data remain editable on DOCX export. Explicit SVG text direction prevents the multicol container's RTL direction from reversing label anchors. SRC09's page 91 opening now passes; remaining chart styles, shape geometry and global text coverage remain open. Evidence: `orchestration/engine-work/resume-20261014-4/`.

The same continuation preserves the original ChartEx cache image in layout PDF (a small exported PDF's decoded RGB pixels equal the source cache), while DOCX exports one native chart. A fresh SRC09 run also passes 20 real insert/undo cycles and payload save/reopen: author HTML and saved model remain equal, and the reopened document has 180 pages. This is scoped interaction acceptance; performance targets, long-document outputs and global layout acceptance remain open.

User-deferred scope (11 October 2026): full long-document Word pagination parity, remaining PDF/ChartEx export, and final serial general acceptance (13-D) are explicitly postponed. These gates remain open; the engine is not certified as globally complete. The current SRC09 PDF button stops on unsupported Wingdings embedding. The 20-sample benchmark has diagnostic samples but no completed export/overall acceptance run, and no numeric performance baseline was predefined. Missions 11/12, real-Word heading numbering, bookmark/field preservation and the current SRC10 interaction proof are verified within their recorded scope. SRC08/SRC10 have now been inspected and are regression fixtures, not a blind holdout. IME evidence uses CDP composition events, not a physical OS IME.

## Current implementation and acceptance scope (11 October 2026)

Source Word sections retain portrait/landscape geometry, first/even/odd page chrome,
numbering restarts and odd/even section transitions (Mission 06). Table adapters
support merged/nested cells, row height/splitting, repeated headers, continuation
captions and tables taller than a page. Native OMML stays editable in DOCX; browser
MathML is its preview, and native equation editing is performed in Word. Authored
LaTeX remains the application's editable equation format. Inline/block equation
presentation and table continuation stamps never become stored content.

Footnotes/endnotes remain real Word notes, including section restart numbering.
Generated lists use persistent targets; imported balanced fields and internal links
are preserved, with located export issues for broken or unknown targets. Unknown
citation fields remain fields. Source formatting and university-template adaptation
are distinct modes; template mode intentionally replaces template-owned styles.

These are implementation capabilities, not a blanket claim of matching every Word
feature. Source notices still identify unsupported layout/properties. SmartArt/chart
style equivalence, complex floating-object placement and arbitrary PDF reconstruction
require the documented acceptance scope. Full long-document pagination and final
acceptance results are recorded in `orchestration/engine-work/motor.md`, `orchestration/GOREVLER.md` and
`orchestration/engine-work/final-closure/`; older phase counts below are historical evidence.

During typing, authored DOM and save callbacks update immediately; whole-document
compilation is coalesced after a 200 ms pause. Pagination/export readiness is revoked
on the first edit and is restored only after the latest compiled generation passes
the unchanged fixed-point confirmations. Pending/failed formula rendering cannot
publish ready. The performance runner records 20 real insert/delete samples,
input-to-frame opportunities, settling, memory, payload save/reopen and actual exports;
no numeric performance cutoff was declared in the original baseline.

### Structural Word import (Mission 03)

**Dosya → Word içe aktar** reads DOCX in a cancellable Web Worker. The preview
lets the user inspect located notices and choose source/template formatting before
replacing the current document in one note update. Cancel and invalid-file/legacy
DOC paths leave the current note intact. Both workspace and canvas editors support
the atomic update. Legacy `.doc` users receive the Word/LibreOffice Save As `.docx`
route before any binary bytes are interpreted as text. The academic editor's older
Mammoth adapter remains independent.

`importThesisDocx(bytes, {fileName, formatMode})` produces the persistent model;
`importThesisWordFile(file, note, {useWorker, signal})` installs it. Body section
boundaries use final-paragraph `pPr/sectPr` and final `body/sectPr`, retaining page
size/orientation/margins, numbering starts (including zero), break types and inherited
header/footer relationship references. Every source section remains editable in
source mode and is retained when adapting to a university template.

Paragraph/run styles retain defaults, IDs, `basedOn`/linked style data, raw properties,
effective source values and separate direct edits. Word toggle semantics and explicit
false are preserved; theme Latin fonts are resolved. Numbering retains abstract
definitions, instances, levels and restart overrides. Lists, tables/merge geometry,
images/relationships, native OMML, rich foot/endnotes, bookmark identities and cached
fields remain model data. Alternate-content branches are both preserved with one
branch active. Text-box content uses valid inline HTML projections so browser parsing
does not eject or duplicate nested paragraphs.

Source mode projects recorded per-node styles through scoped CSS; template mode
projects direct author overrides while retaining source values. Unsupported layout
and properties have `source.unsupported` notices with package/XML locators and a
downloadable report. Native equation, note, table, picture and field adapters now include the work from
Missions 05–12; current support and located limitations are summarized below.
Structural import alone does not establish Word/PDF pixel parity. Source body defaults with unmeasured font programs remain explicit
font-metric notices. A source package is provenance, not a shortcut to export edits.

The original compressed package is retained once as `source.packageBase64` with
SHA256; parts carry size/type metadata, and native nodes carry source locators and
raw properties instead of duplicating complete ancestor XML. Imports reject invalid
XML, DTD/entities, traversal/duplicate ZIP entries, packages beyond 64 MB compressed
or 128 MB expanded/10,000 entries. External media/embedded payloads are not executed
or fetched; approved raster media is projected from local package bytes. UTF-8 and
BOM-marked UTF-16 XML are supported.

Verification: `thesisDocxImport.test.js`, `orchestration/engine-work/mission03_sources.py` (independent
lxml/ZIP oracle), `verify_mission03_sources.mjs`, `verify_mission03_dom.mjs`,
`verify_mission03_browser.mjs`; frozen results live in `orchestration/engine-work/mission03/`.
OOXML semantics references: [section properties](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.sectionproperties?view=openxml-3.0.1),
[bold toggles](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.bold?view=openxml-3.0.1),
[level overrides](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.leveloverride?view=openxml-3.0.1).

### Persistent content model (Mission 02)

`researchData.thesis.document` is a version-1 semantic tree (`contentModel.js`),
independent of the template's schema version and measured layout. Sections retain
their IDs, native properties and ordered nodes. Runs, nested/merged tables, lists,
images, equations, notes and cross-reference/bookmark attributes retain their
structure. The document also stores source styles/inheritance, numbering, rich
note bodies, relationship resources, reference targets and opaque source parts.
Only acyclic JSON with finite numbers is accepted; unsupported versions and
duplicate identities are diagnosed rather than silently flattened.

The existing `note.content` and `thesis.sectionContent` are editor compatibility
projections. `prepareThesisNote` reconciles them at shell edits, sync save/load and
compilation. Empty HTML means deletion; missing HTML on model-only inputs is
reconstructed. `data-txt-node-id` binds native properties across edits and moves
between sections; pasted duplicate IDs receive new model identities. Unchanged
legacy content retains its authored text and formatting; presentation-only markup
is cleaned on admission. Non-thesis notes are unaffected.
Deleted native payloads are held in `retainedNodes` outside active content so HTML
undo can restore their properties by ID; they are never rendered as live objects.
`mainSectionId` binds the ordinary note body by meaning; `sectionKeys` binds other
stored section keys. A template may name its mainContent section "introduction";
shadow section HTML is retained separately and never substituted for that body.
Model annotations and HTML attribute ordering do not reset the editor's live undo
stack or caret. New academic object IDs derive from model IDs when available.
`installContentDocument` admits structured adapter output; `editContentNode`
performs immutable native edits and regenerates the compatibility view. Adapters
must use these APIs when changing the model, rather than patching a stale model
under newer compatibility HTML. Original source parts are provenance, not a claim
that an edited DOCX can be emitted by copying the original package unchanged.

`document.formatMode` separates `template` (legacy default) from `source`.
The editor's **Tez bilgileri → Belge biçimi** selector saves that preference.
Source mode uses recorded `section.properties.rules` before user layout overrides;
template mode uses the selected university rules without deleting source data.
`resolveContentStyle` resolves defaults → basedOn → selected style → direct edits
in source mode, and template style → direct edits in template mode. Style cycles
are reported. Native adapters supply the styles/rules; Mission 02 does not certify
Mammoth import, native Word-object rendering or Word export (Missions 03 and 05–12).

Persistence removes generated page gaps, line/mirror/tab stamps, repeated
continuation rows and table fragmentation markers while preserving authored
attributes such as `data-thesis-eq-numbered` and `data-thesis-style`.
Equation toolbar and KaTeX children are regenerated from preserved `data-latex`;
their transient DOM is excluded from persistence, preventing block children of
inline widgets from escaping their paragraph when saved HTML is reparsed.
Tests: `thesisContentModel.test.js`, sync payload tests and the Mission 02 source
and browser acceptance harnesses under `orchestration/engine-work/`.

DOCX export finalizes document-wide drawing and paired bookmark IDs, numeric
percentage widths and Office-compatible on/off values. Live field marker styles
follow WordprocessingML element order. Page-top content frames use normal table
flow with a signed indent; other positioned frames retain their anchors. Measured
heading/figure/table page transitions are export data and never enter saved HTML.
The last-line PDF spacing correction also counts the space after a wrapped token.
These safeguards do not establish universal Word line-breaking equivalence; the
Arial acceptance cases remain the explicit typography gate.

Authored table cells use the existing `fmt-align-left/center/right/justify` classes.
They survive HTML sanitization, override `tables.cellStyle.align`, and retain table-cell
display/column geometry in editor/PDF; the parser transfers the choice to DOCX.
Inline `style="text-align:..."` is stripped during sanitization and is not a persistent
fixture format. No new template key is required. Verified by `thesisCellAlignment.test.js`.

`schema.d.ts` is schema v1. All lengths are millimetres, all font sizes and paragraph spacing are points, and line height is a multiplier. `validation.js` checks bundled definitions at load time. `engine.js` resolves global rules plus section overrides into one document model. The thesis editor, print HTML, searchable PDF and DOCX consume that model. The old AcademicEditor and its exporters remain separate.

### Measured layout report (Phase 3)

The layout PDF writer emits `ThesisLayoutReport` (types in `schema.d.ts`) through
`onLayoutReport`; the real export harness saves it under `engineLayout` in
`<export>.layout.json`. Version 1 uses a top-left page origin, mm geometry and pt
font sizes. Physical page numbers are one-based, with printed labels kept separately.
Each page records section IDs, landmark bounds, text excerpts, actual exported font
identities, first/last baselines, line count and median baseline pitch. Single-line or
box-only landmarks have an explicit null pitch; no font is inferred for an empty box.

Landmarks include special blocks, headings, captions, index rows, table rows/cells,
footnotes/areas and page numbers. Structural containers inherit their descendants'
text metrics without duplicating PDF text operations. Spanning boxes are clipped
into each physical sheet, excluding page gaps. Body baseline extrema exclude text
inside table cells, special blocks and footnotes. IDs use section/kind/source anchor
or a deterministic ordinal; repeated anchors receive an instance suffix. They are
stable across exports of identical input, not guaranteed across arbitrary content edits.

The checker uses these measured landmarks with source-derived expected values.
Every run validates the report contract and independently samples actual PDF glyph
origins at 0.25 mm; font embedding and Word checks continue to inspect actual files.
Use `check.mjs --verify-layout-ids` for an independent repeat export/ID comparison.
This diagnostic does not alter editor pagination or PDF/DOCX drawing semantics.

### Special pages (Task 8)

Cover, approval, declaration/ethics and similar pages are ordinary template sections with a `blocks` layout; there is no second page list and no per-university component. `specialPages.js` is the only interpreter: `resolveSpecialPage` turns blocks + `thesis.values` metadata into a render tree (final text and style per node), `specialPageHtml`/`specialPageCss` render it (no style attributes, CSP-safe) and `flattenSpecialPage` feeds the current PDF/DOCX writers. Block types: `text` (static, `{{KEY}}` still accepted), `metadata` (`field`, `prefix`, `suffix`, `fallback`; date fields are localized), `spacer` (`heightMm`), `separator` (`widthPercent` = line length in a column, `thicknessPt`, `align`) and `group` (`direction: column|row`, `gapMm`, inherited `style`, children may set `widthPercent` = their share of the row). In a row a separator fills its own box. Row shares may shrink but never grow past the content box (`specialPageRowWidths` gives the same widths to DOCX), so a row never crosses the page margin. Any block may set `marginTopMm/marginBottomMm`. Typography inherits template body → section `overrides.body` → group `style` → block `style`. Margins and numbering use the section's existing `overrides.page`; order uses `order`/array position and optional pages use `status: "optional"`. A section with `blocks` is always its own physical page group, so it takes part in the page model and roman/arabic restarts like any other group, while its content never enters an editable body. Metadata edits recompile the model, so the page updates live; the layout is never copied into the note. Covers use metadata blocks; the test-only fixtures in `src/lib/thesisFixtures.js` exercise cover → approval (counted, unnumbered, wider top margin) → ethics and cover → declaration → optional approval.

Block layouts must be static (including empty layouts); validation rejects editable/generated modes for special pages. Spacer margins, like group and separator margins, are applied in mm. Ordinary editable sections may still use a static `content` introduction. `image` blocks accept an embedded PNG/JPEG `source`, positive `widthMm`/`heightMm` and optional `align` (left/center/right). They use scoped CSS in the editor/print, the same measured image in the PDF, and an inline image paragraph in DOCX.

`pageLayout.js` converts resolved A4 geometry to CSS pixels at 96 dpi and owns the physical page model. `engine.js` groups sections into page flows: a section with `pageBreakBefore !== false`, a numbering restart or different page chrome starts a new page, and cover sections never share a flow with other sections.

**Overflow rule (`specialPageFit.js`).** Blocks anchored by the template (`layoutMode` absolute/anchored) are *fixed*; all other blocks are *flowing* and follow the previous one. Flowing content may grow until it reaches the next fixed block below it or the bottom margin of the content box; fixed blocks are checked against the physical page edge (they may sit in a margin). `evaluateSpecialPageFit` returns `{ overflowMm, overlaps, status: "ok" | "overflow" | "overlap" }` (overflow wins when both occur); a block fully inside another (frame around text) is containment, not overlap. `measureSpecialPageFit(root, groups, pageMetrics)` reads the rendered special-page sections, and `ThesisEditor` adds the Turkish messages (e.g. "Kapak sayfasında içerik 12,4 mm taşıyor: <bölüm adı>") to the document warnings. The report is advisory: it never blocks saving, printing or export. Never done: no clipping or hiding of overflowing content, no silent font/spacing shrinking, no automatic moving of fixed blocks; the author shortens the text or changes the template layout.

### Pagination (Task 7)

Pagination is presentation, not storage. The note still stores `note.content` plus `thesis.sectionContent` per section id; no page HTML, page count or break position is ever written. Each page group renders one `.thesis-page-flow` holding the group's unchanged `RichTextBody` instances. `thesisPagedCss` turns that flow into a single-column multicol whose `column-height` is `page.heightMm - margins.topMm - margins.bottomMm`, whose `row-gap` is bottom margin + desk gap + top margin and which uses `column-wrap: wrap; column-fill: auto`. The browser's fragmentation engine therefore breaks text by line (orphans/widows 2), keeps headings with `keepWithNext` on the next page (`break-after: avoid`), moves a table/figure that fits a page as a whole and splits longer tables by row, continues `ol` numbering, applies heading `pageBreakBefore` as a column break, and lets oversized monolithic content overflow instead of looping. Typing, deleting, font/template/window changes reflow natively; the caret, selection, focus, undo stack and DOM identity are untouched because nothing is split or re-inserted.

A ResizeObserver reads only the unscaled flow height; `pageCountFromFlowHeight` maps it to N pages (N content boxes + N−1 row gaps, rounded, clamped to `THESIS_MAX_PAGES`). `buildThesisPageModel(groups, counts)` returns one entry per physical sheet with its label (`numbering.enabled/format/startAt/restart`: none, roman or arabic), `numbering.position` (top/bottom) and `align` (left/center/right), and header/footer first-page omission. The editor draws white `.thesis-sheet` elements and their chrome from that model behind the transparent flow. Zoom is a transform on the whole stack, so every zoom level has the same page count and breaks. Print and DOCX use the page groups; the PDF (Task 9) is drawn from this page layout. Engines without `column-wrap` keep the Task 6 continuous surface.

Thesis notes use `noteType: "thesis"`. The document is the normal TxtNote note: `note.title` and `note.content` hold the title and main rich-text HTML, while `note.researchData.thesis` holds the template reference, student metadata, optional section choices and other editable section HTML. `document.js` creates and updates this state without writing into a template. Sections are template data. `compileThesisDocument` walks `orderedThesisSections(template)` (optional numeric `order`, else array position), drops `disabled` sections and `optional` ones not listed in `thesis.enabledSections`, and the editor renders whatever comes out; it has no per-section or per-university branch. Each section has a `mode`:

- `editable` — the user writes it. `mainContent` is `note.content`; every other editable section is `thesis.sectionContent[section.id]`. Identity is the stable `id`, never the position, so reordering or switching templates cannot move text between sections. Bundled templates use the same id for the same section type.
- `static` — `content` / `blocks` belong to the template and are read-only.
- `generated` — built from the document (TOC, list of figures and list of tables via generatedIndex.js). Stored user HTML is ignored.

Section titles come from the template (`title`, `toc.heading`); `showTitle` overrides whether the title is printed. Templates without `mode` keep working: `editable: true` → editable, TOC/list types → generated, `editable: false` or content/blocks → static, otherwise editable. `mode` and `editable` must agree when both are set. Existing SQLite, backup, undo and sync paths persist the note. A missing or invalid template resolves to the explicitly generic draft and displays a warning.

## Add a university template

1. Obtain a current official guide. Record its URL, document name, revision date and verification date in `source`.
2. Add a data module in `templates/`, exporting a `ThesisTemplate`. New versions need **new IDs**; keep old modules loadable for existing notes.
3. Add one metadata descriptor and dynamic `load` import in `registry.js`. Selection and the editor read that descriptor; no editor branch is needed.
4. Run `node --test src/lib/thesisEngine.test.js` from `frontend/` and `npm run build` from the repository root. Add a test fixture for any newly encountered rule.

The registry lists only real university templates. The invented test fixtures live in `src/lib/thesisFixtures.js` (test-only, not in the registry); `templates/generic.js` is the fallback. No university policy is implied by either.

### Export (Task 9)

Export is derived output; nothing (page HTML, page counts, breaks) is written to the note, and it always reads the current model, so fresh metadata is exported immediately.

- **PDF** (`layoutPdf.js`) does not paginate. It reads the editor's already paginated page stacks — every word, list marker (`::marker`), heading number (`data-thesis-number`), border, image and sheet chrome — and draws each at the same position on the same sheet as searchable text. Exact system-font embedding is requested from the font families collected from an official template's supported typography, overrides and blocks (`templateFontFamilies()` → `model.systemFonts`), the MCBÜ LEE Times New Roman rule, and explicit font families found in document-layout typography/positioned nodes. An arbitrary external CSS rule does not count as a template font request. Supported exact faces are Times New Roman, Arial, Calibri, and Cambria Math when the active host exposes an embeddable font program. Tinos is bundled as the default academic face, not a silent substitute for Times New Roman. System-font lookup is host-specific (Windows font directory in the desktop runtime, browser local-font access in Chromium); restricted/unavailable font programs cannot be embedded. Layout PDF uses a built-in Helvetica/Courier Latin-1 fallback only for matching Latin-1 text; other missing glyphs use the bundled academic face, so fallback text does not prove exact font compliance. Page count, breaks, numbering, restarts, special pages and margins come from the editor's page layout. Engines without the paged layout fall back to `buildThesisPdf(model)` in `export.js`, whose shaping and font behavior have additional limits.
- **DOCX** (`buildThesisDocx`) keeps Word semantics: one Word section per thesis section (nextPage for a new page group, continuous inside one), exact A4, section numbering/restarts and header/footer PAGE fields. Real editor paragraphs become Word paragraphs with first-line indent, before/after spacing, line height and explicit alignment. Shift+Enter becomes an inner Word break. Legacy loose lines keep their former no-spacing export. Heading styles, including Heading4 with outline level 3, come from the resolved rules. Tables/images remain real Word objects, captions become separate paragraphs above/below them, and generated indexes use real `PAGEREF` fields with bookmarks, tab leaders and cached editor labels. The DOCX disables automatic field updates on opening and preserves cached editor results to avoid Word's update confirmation. Fields remain live: update them explicitly in Word (F9 / Update Field) after editing, and validate the actual Word render and refreshed results where relevant. Word may reflow differently from TxtNote. Inline formatting, lists, citations, bibliography, footnotes and special page blocks use the existing exporters.

## Generic extensions (Task 10A)

The thesis editor opts into real paragraph editing; the legacy AcademicEditor remains separate. Enter uses the browser's paragraph command and undo stack; Shift+Enter inserts an inner line break (Chromium may represent it as a newline under pre-wrap). Body TextStyle remains backward compatible. An optional typography.paragraph and section.overrides.paragraph apply the same unit-bearing properties: firstLineIndentMm, spaceBeforePt, spaceAfterPt, lineHeight and align. New paragraphs inherit paragraph alignment/style without promoting inline selection formatting to a paragraph style. Existing loose text/newlines are not rewritten on open. thesisSourceHtml strips presentation stamps using deterministic, idempotent string normalization; saves defensively strip them again.

Headings use the configured level map, with H1–H4 in the generic defaults. collectIndexSources produces one ordered source stream across active sections, with semantic heading counters and caption counters. Per-chapter captions use the H1 counter and its sequence, never numbers parsed from the heading title or its formatted label. Before the first numbered H1 the chapter counter is 0. Global counters use numbering.scope: document; chapter counters use scope: chapter. Existing caption keys (label, position, style, numbering, spacingBeforePt/spacingAfterPt) remain the API. captionAlignment adds left/center/right/justify/auto. Auto measures a single line as centered, multiple lines as justified; DOCX receives this measured alignment from the editor. Figure captions are editable while the image remains locked.

A generated section can declare generatedIndex: { kind: toc | figures | tables, title, levels, maxDepth, includePageNumbers, leader: dots | none, pageNumberAlignment, indentMm, style }. Older tableOfContents/listOfFigures/listOfTables section types resolve to the same rule automatically. Other generated section types retain their title/empty placeholder. Indexes are selectable/copyable, have no RichTextBody, and never enter source state.

renderedIndexPages reads anchor text rects from the existing browser-fragmented page flow, divides by the exact stack transform and resolves the group/page against buildThesisPageModel. It returns both the visible label (including roman numbering or blank unnumbered pages) and the physical page. resolveGeneratedIndexes creates a view model only. The editor measures/render-updates until stable, with a six-update cap and a visible warning retaining the last measured result if convergence fails. Source edits, image/font loads, flow resizing and zoom trigger measurement. Generated rows, anchors and calculated page numbers are never stored in note.content or thesis state. No pagination engine is added.

Optional pages still use status: optional with enabledSections. visibleWhen accepts exactly one declarative equals/notEquals/in operator and a metadata field; degreeType also resolves the document degree. No expressions or JavaScript are accepted. validation is a map of metadata/section fields to { minItems, separator?, severity?, message? }. The compiler returns semantic errors/warnings and the editor displays their count/message. These advisory rules never block saving or exporting.

## Current boundary

PDF continues to read the actual paginated editor DOM. Exact-font checks must inspect the exported PDF font program and glyph coverage; a requested family outside the font-embedding request path is not proof of embedding. A requested font unavailable to the active host or restricted from embedding is a reported limitation/FAIL for that font requirement, never a metric-compatible substitute PASS. Engines without column-wrap use the existing continuous/fallback writer; they cannot resolve real generated index page labels, which remain blank rather than estimated. DOCX contains bookmarked `PAGEREF` fields and preserves cached results on opening; explicitly update fields in Word to rebuild them using its own pagination. DOCX XML inspection confirms stored declarations and field structure, not the final rendered page geometry; use real Word output when the criterion depends on Word pagination or glyph metrics.

Footnotes: see Task 10A.1 below. The legacy academic “Tez” skeleton is still present and separate.

## Page-bottom footnotes (Task 10A.1)

A note is drawn at the bottom of the physical page on which its reference is rendered. `footnotes.js` is the only interpreter; it has no university knowledge.

- **Template data.** `typography.footnotes` (and `section.overrides.footnotes`) accept the usual TextStyle keys (fontFamily, fontSizePt, fontWeight, italic, lineHeight, align, characterSpacingPt, spaceBeforePt/spaceAfterPt between notes, indents) plus `placement: pageBottom | sectionEnd`, `maxAreaPercent` (10–90, default 50) and `separator: { enabled, widthPercent, thicknessPt, spaceBeforePt, spaceAfterPt }`. Defaults: body font, 9 pt, line height 1.2, left, a 33 % × 0.5 pt rule with 6 pt/3 pt spacing. A guide that requires e.g. Times New Roman 10 pt sets that in its template; DOCX footnotes use the same rule.
- **Ownership.** The page of a note is the page of its `sup.academic-footnote` rect in the existing fragmented flow (unscaled, divided by the stack transform), never a guess from numbers. Numbering stays the existing per-body `data-fn-index`; order is document order.
- **Body capacity, no second paginator.** The browser's multicol still breaks every page. For a page with notes of height H the body must end at `contentHeight − H`. The block crossing that limit gets one presentation attribute: a splittable block gets `data-thesis-fn-stamp="reserve"` (a `box-decoration-break: clone` bottom padding via typed `attr()`, so its first fragment stops above the notes and its lines continue on the next page; a negative margin cancels the padding after its last fragment; when that padded block still has three or more fragments, the padding would shorten every middle page too, so a transient full-width float spacer `data-thesis-fn-spacer` (stripped from saved HTML) is inserted at the first line leaving the note page instead and only the first fragment is shortened, as in Word, which reserves note space on the reference's page alone; DOCX no longer estimates this reserve and relies on Word's native footnote layout); a monolithic block (heading with keep-with-next, figure, table row, a one-line paragraph) gets `data-thesis-fn-stamp="break"`. The notes themselves are an absolutely positioned, non-editable area on the sheet layer (`.thesis-footnote-layer`), measured by a hidden twin with identical CSS. Engines without `column-wrap`, clone padding or typed `attr()` keep the section-end list.
- **Word rule and stabilization.** Every reference on a page gets at least the start of its note. If a reference line plus its note does not fit, the body ends above that line and the reference moves to the next page with its note. Pages are processed in order (a page only depends on earlier ones); a page whose references, note texts, carried continuation and stamp geometry are unchanged keeps its stamp without relayout, a page whose text merely shifted moves its stamp to the new crossing block. Stamps are in-memory records, never stored. The editor's generated-index loop now lays out notes first and then reads index pages, under one signature and the same six-update cap (warning "Dizin/dipnot sayfalaması kararlı hale gelmedi"). A 24 ms frame budget lets long documents re-lay later pages progressively while typing stays responsive; an unfinished pass is not an iteration.
- **Long notes.** The note area never exceeds `maxAreaPercent` of the page body. A note that does not fit is split at a word boundary (leaving room for the first word of each later note on that page); the remainder continues at the top of the next page's area, unlabelled, before that page's own notes. A continuation longer than the rest of the group adds continuation-only pages after the body (1 px spacers in the flow). Nothing is clipped or overlaps and the loop is bounded.
- **Persistence.** `thesisSourceHtml` strips `data-thesis-fn-*`; note areas, heights, page assignments and spacers are view state. The note stores only the existing reference markup (`data-fn-id`, `data-fn-text`).
- **PDF/DOCX.** The layout PDF reads the same DOM, so notes, separator and page count match the editor. DOCX keeps real Word footnotes (`FootnoteReferenceRun`); Word places them itself.
- **Limits.** Loose legacy text outside paragraphs is one block and requires separate source/layout validation. Paragraphs spanning three or more fragments use the first-fragment spacer described above; note reservation does not intentionally repeat on later pages. A monolithic block taller than the space above the notes at the very top of a page cannot move and is left in place. Print (`buildThesisPrintHtml`) is unchanged and does not render notes.

## First official template: MCBÜ (Task 10B)

`templates/mcbu.js` is Manisa Celal Bayar Üniversitesi, Lisansüstü Eğitim Enstitüsü, built only from the institute's examples/rules PDF (`ShareFileGallery-GTSM221020251445.pdf`, recorded in `source`). It is data: one module exports a master's and a doctoral variant (registry ids `mcbu-lee-master-tr-v1`, `mcbu-lee-phd-tr-v1`) that differ in their degree lines and the doctorate-only ÖZGEÇMİŞ (`visibleWhen degreeType = phd`). Every page — İç Kapak, Taahhütname, ÖZET/ABSTRACT headers and footers, the Önsöz signature — uses the generic block renderer; nothing in the engine or editor names the university. Choices where the PDF is silent or contradicts itself are commented in the template.

It needed these generic, opt-in extensions (existing templates are unaffected):

- `section.standalone: false` on a blocks section: the block layout flows with its neighbours under the normal `pageBreakBefore` rule, so fixed lines can sit above/below an editable section on one page (ÖZET header → editable abstract → keywords).
- `section.tocEntry`: `"title"` lists the section title as an unnumbered level-1 TOC row with its real page label (front matter in Roman numerals, generated and special sections included); `"none"` keeps the section and its headings out of the TOC. The anchor of a generated/special section is its flow section element.
- `generatedIndex.pageHeading` / `pageHeadingStyle` (a "Sayfa" column heading) and `matchHeadingTransform` (TOC rows read like their rendered headings, e.g. uppercase chapters).
- `tables.cellStyle`: cell typography (single spacing, centered names/values) in editor, PDF and DOCX; the type size stays inherited.
- `tables.cellPadding: { topMm, bottomMm, leftMm, rightMm }` (opt-in, also in `overrides.tables`): cell padding in editor CSS, PDF and DOCX `w:tcMar`; absent keys of the object are 0, no key = previous defaults.
- Authored table column widths: `<colgroup><col data-col-width="25.84">...</colgroup>` (percent; inline source styles are stripped). Normalized literal CSS and idempotent DOM widths replace typed `attr()`, preserving editor, PDF and DOCX (`tblGrid`, `tcW`) geometry. One `col` per grid column; tables with rowspans fall back to equal columns in DOCX.
- `captionNumberingChoices`: document-wide numbering methods the author picks in the thesis panel (`thesis.captionNumbering`); applied to figures and tables together.
- Registry `displayName` (selection label) and official sources identified by `documentName` when there is no public URL.

Fixes found on the way: template HTML (section titles, special pages, indexes) is rendered through a memoized wrapper so React does not re-inject it (and drop the TOC anchors) on unrelated re-renders; measured caption auto alignment now outranks the base caption rule; thesis figure captions are document black.

### MCBÜ source limits and open specifications

The supplied 12-page `ShareFileGallery-GTSM221020251445.pdf` contains examples on pages 1–10 and general rules on pages 11–12. The template and both degree variants are already registered in the existing creation and editor selectors. The examples establish the inner cover, declaration, abstracts and preliminary indexes; they do not establish every submission requirement. Treat `status: "official"` as source provenance, not a claim that every rule or export has passed compliance.

- **Guide revision:** `2024-02-22` is the PDF's creation/modification date. The existing `source.revisionDate` records that date, but the document does not identify it as a policy revision. A confirmed guide revision and current official download URL remain unavailable from the supplied file; the filename's date is not proof of either.
- **Abstract spacing:** page 4 asks for single spacing with a blank line between paragraphs, then asks for 1.5 spacing and a 12.5 mm first-line indent. The implementation uses the latter paragraph rule. Institute clarification is needed to settle the contradiction.
- **Preface spacing:** page 6 asks for single spacing and blank lines between paragraphs, while page 11 includes preface/thanks in the general 1.5-spacing rule. The implementation follows the dedicated example. This remains a source conflict.
- **Bibliography spacing:** page 11 exempts references from the general 1.5-spacing rule without supplying a replacement. The current single-spacing setting is an implementation choice requiring confirmation. The guide lets the author choose one consistent citation method; it does not mandate APA or Chicago.
- **Page-number placement:** Roman preliminary numbering and Arabic body numbering are explicit; exact position/alignment are not. Bottom-center placement follows the guide's examples and is not an independently stated requirement.
- **Other submission pages:** this file supplies an inner-cover example but no outer-cover or jury/approval-page specification. Their required status and layout cannot be established from this source, so no such pages have been invented. The thesis spine is a binding item, not a document page.

Export verification is separate from these source gaps. The current PDF path can embed genuine Times New Roman, Arial, Calibri, and Cambria Math when those families are collected from official template typography/overrides/blocks or explicit document-layout requests (and the host exposes an embeddable font program). Tinos remains the bundled academic fallback/default and does not satisfy a source requirement for Times New Roman. Cambria Math availability is host-dependent and missing exact math fonts may trigger glyph aliases. PDF/DOCX results must be inspected for the actual export host and variant. DOCX XML checks verify structure, not rendered Microsoft Word fidelity. Keep those limits visible when reporting readiness.

## MCBÜ final polish (Task 10B.1)

Four generic, opt-in additions; templates that do not use them are unchanged.

- `typography.lineSpacing: { mode: "word", singleLineEm }`: a stored lineHeight is Word's "n lines". Editor/print CSS (and so the layout PDF) draw n × `singleLineEm` × font size; DOCX writes Word's own auto spacing (240 × n) instead of the "at least" pitch. MCBÜ uses Times New Roman's 1.15 em, measured in the official PDF (single 13.8 pt, 1,5 satır 20.7 pt at 12 pt); its empty-line gaps use the same Word line. Default/omitted: the old CSS multiplier.
- `typography.justify: "word" | "browser"`: default `"word"` uses per-line fitting for TNR/Arial/Calibri, including the measured last-word compression limit and no kerning. `"browser"` keeps Chromium breaking. Editor/PDF share last-line spacing: natural when it fits, compressed when overfull. Specialized tab/math/break paragraphs retain their earlier path. See CAPABILITIES.md "Word justified-line fitting".
- Per-chapter caption numbers before the first numbered chapter (an unnumbered introduction) leave out the `{chapter}` part (`Şekil 1`, then `Şekil 1.1` in chapter 1) instead of `0.1` (`formatCaptionNumber`).
- Special page blocks accept `visibleWhen: { anyFilled: [fields] }`; a block or group is left out when none of those metadata values is filled (MCBÜ's optional İkinci Danışman / Co-Supervisor line with its empty line).
- Placeholders may be `derived: "totalPages"`: not offered as an input, a stored value is ignored, and the value is resolved by `resolveGeneratedIndexes` from the measured page counts of the current layout pass (the same bounded fixed point as the generated indexes, so a 99 → 100 reflow re-measures instead of looping). PDF reads the editor layout; DOCX carries the export-time snapshot (Word does not update it).

## Engine extensions, batch B (structures)

Opt-in template keys, documented in `schema.d.ts` and `orchestration/reports/ENGINE_EXTENSIONS.md`; a template that does not use one is unchanged.

- `captionKinds` (B1): further figure kinds ("Resim 4.1") with their own counter, rule and list (`generatedIndex.kind`); `<figure data-caption-kind>` is source markup.
- `tables.continuation` (B2): caption ("Çizelge 3.1 (Devam) …") and header row above every continuation fragment of a split table. `tableContinuation.js` measures the page starts after layout and injects presentation rows (`tr[data-thesis-cont]`, never stored); Word splits the table at the measured rows.
- `equations` (B3): numbered display equations, number flush right (`data-thesis-eq`, presentation), counters per chapter or document.
- `numbering.sequence: "ordinal-tr-upper"` / `placement: "ownLine"` (B4): "BİRİNCİ BÖLÜM" above the chapter title; `levelStyles[n].align/includePageNumber` for centred TOC rows without page numbers.
- `generatedIndex.levelStyles.unnumbered` (AKÜ SBE): row style of the unnumbered title rows (ÖZET, GİRİŞ, KAYNAKÇA, …) of any level, winning over the level style so that numbered chapter rows (`levelStyles[1]`: centred, no page number) and title rows can differ; `generatedIndex.unnumberedAfterNumberedSpaceBeforePt`: extra space above the first unnumbered title row that follows numbered rows (back matter after the chapters). Footnote reserve stamps no longer double the gap when the stamped block's `margin-bottom` collapses into the next block's `margin-top` (Word-additive spacing).
- `footnotes.numbering: "document"` (B5), `visibleWhen: { count, gte }` (B6), `typography.paragraphStyles` + `<p data-thesis-style>` (B7).
- `textTransformExceptions`: lower-case words inside uppercase/capitalized headings (`transformExceptions.js`; wrapper spans are never stored).

Proofs: `src/lib/thesisBatchB.test.js` (unit), `tests/batchb-measure.py` (real PDF/DOCX export per scenario), `tests/batchb-ui.mjs` (editor behaviour); fixtures in `tests/batchb-fixture.mjs` are served by `tests/thesis-batchb.html` through the editor's `templateRegistry` prop.

## Page numbering: `omitOnChapterStart`

`page.numbering.omitOnChapterStart` (opt-in, default off) hides the number on every page that opens a chapter while still counting it. A chapter-opening page is the page on which a level-1 heading with a forced page break starts, or the first content of a page group. The editor measures those pages from the rendered flow (`chapterStartPageIndexes`), the sheet chrome omits the label, and the layout PDF (drawn from the editor DOM) follows. In DOCX each later chapter becomes its own next-page Word section with `titlePg`, a number-free first-page header/footer and continued page numbering. Contents/list page labels keep the counted number. The legacy fallback PDF writer (`export.js` `pdfChrome`) does not implement it.

## Phase 2 typography model

New templates can use `typography.lineSpacing: { rule: "auto" | "exact" | "atLeast", value }` or per-TextStyle `lineSpacing`. Auto values are line counts; exact/atLeast values are pt. Font-program metrics are available for Times New Roman, Arial and Calibri. Supply source-measured `singleLineEm` for other fonts; an unknown auto/minimum pitch throws rather than guessing. Legacy modes retain their old pitches. Real Word/export matrix measurements remain required for conformance.

`contextualSpacing` suppresses adjacent same-style paragraph gaps. Named paragraph styles get separate Word style IDs; collapse/max and additive are retained. `suppressSpaceBeforeAtPageTop` suppresses section-top paragraph spacing in CSS; physical continuation-page tops remain dependent on browser column fragmentation and require validation.

`indent: { firstLineMm, hangingMm, leftMm, rightMm, mirror }` normalizes the legacy indent keys. Mirror emits Word mirrorIndents. The editor measures each text fragment's physical page and shifts glyph spans horizontally on even pages by right minus left. Plain and hanging mirror indents preserve line width. With a positive first-line indent, Word also narrows even-page fragments by that indent; `paragraphMirror.js` inserts a transient right float to reproduce that wrapping and strips it from saved source. Layout PDF reads the resulting text rectangles. The real-export MIRF fixture compares all wrapped lines over odd/even pages (`engine-word-structure/check-20261004-1529.json`: 76 lines, maximum glyph-extent delta 0.116 mm; baseline/left/right checks PASS at 0.25 mm). Static print parity remains unverified.

`tabStops: [{ positionMm, align: "left" | "center" | "right" | "decimal", leader: "none" | "dots" | "hyphen" | "underscore", decimalCharacter? }]` replaces the single-stop limitation. Stops are paragraph-origin positions, matching Word. Browser tabs measure real following text, render leaders, and preserve a literal tab in source. Font loading triggers remeasurement and pagination; print measures its own DOM. Wrapped TOC-like tab rows are measured in the completed structure fixture. Bidirectional runs remain UNKNOWN because the engine has no paragraph-direction model.

Custom `decimalCharacter` affects browser measurement only; Word decimal tabs use its locale. Oversized exact-line text is measured in the 146-check parity fixture; the engine no longer applies per-line CSS clipping, matching Word PDF export.

## Phase 2 structural model

`tables.rowHeight: { rule: "auto" | "atLeast" | "exact", valueMm? }` maps to Word row-height properties. `cantSplit` and `repeatHeader` control fragmentation/repeated headers, and `verticalAlign` selects top/center/bottom cells. Per-edge `borders` accept top/bottom/left/right/insideHorizontal/insideVertical objects with style, widthPt and color; omitted edges retain the existing preset/default behaviour. Exact-height cells use an idempotent `txt-table-cell-content` presentation wrapper so overflowing content clips instead of expanding CSS's minimum cell height. Source serialization removes the wrapper and resolved column styles.

The row model matches measured Word geometry: `atLeast` is a content minimum (cell margins and the collapsed rule add on top), while `exact` fixes the row at `valueMm` from the row top (rule and top margin included) to the text area's bottom — the bottom margin hangs below, so rows pitch `valueMm + cellPadding.bottomMm`. Oversized exact rows clip at the text area's edge and overflow-aligned content falls back to the top, as Word renders them. A `double` rule paints at three times its width in Word, so the CSS width is tripled to match; Chrome's whole-pixel border rounding is absorbed into the cell top padding so row pitches keep Word's fractional rule widths. Because Chrome's multicol fragmentation repeats neither captions nor headers, `tableContinuation.js` injects the header rows in front of every measured page-start row (`repeatHeader !== false`, or the `tables.continuation` caption form); the injected rows are presentation-only and never stored.

`keepLines` and `widowControl` share paragraph rules between browser fragmentation and Word. Existing `keepWithNext` and `pageBreakBefore` remain configurable. Unit tests alone do not establish identical page breaks.

Page `differentFirstPage`, chrome `firstContent`/`evenContent`, and section `verticalAlign: "center" | "bottom"` map to first/even parts, the document even/odd setting, and Word page alignment. Chrome `trailingBlankLines` represents empty source paragraphs explicitly. `footer.distanceMm` is Word's distance from the paper edge; optional `docxDistanceMm` preserves an independently evidenced Word override for an older editor geometry model. A measured `numbering.baselineFromTopMm` positions the same number baseline in all outputs.

Chrome `{{NUMPAGES}}` becomes a complex field with an editor page-count cache; `buildThesisDocx` accepts `totalPages`. PAGE, PAGEREF and live TOC are complex fields, and caption `numbering.liveField` opts into SEQ. Every registered template is tested for balanced nested fields and absence of `fldSimple`; actual Word opening/refresh remains the real-export gate.

Regenerate the non-university acceptance document with `node orchestration/tools/word-structure-fixture.mjs`, then run `node orchestration/tools/check.mjs --target engine-word-structure --word`. It exercises overflowing rows, repeated headers, protected paragraphs, typed tabs, spanning mirror paragraphs, first/even chrome, page-top spacing and vertical page alignment through the real editor/export pipeline. Its values are engine test inputs and must never be copied into university specifications.

## Word last-line fit (`page.lastLineFit`, default "word" under the Word line-spacing model)

Word accepts the last line of a page when it fits without its extra leading (line pitch minus the single-line height); CSS needs the whole line box. Measured on AKÜ SBE (Times New Roman 12 pt, 1.5 lines, 247 mm text height): Word fits 34 lines of 7.303 mm pitch, the editor 33. With `page.lastLineFit: "word"` the engine derives `page.lastLineLeadingMm` from the body style (`wordLastLineLeadingMm`, font metrics from `WORD_FONT_METRICS`; unknown fonts give 0, never a guess) and `pageMetrics`/`thesisPagedCss` make the flow column that much taller while the row gap shrinks by the same amount (page pitch unchanged). Headings, figures, table wrappers and table cells get a trailing block of the same height cancelled by a negative margin (`::after`, `break-before:avoid`), so they need the extra room and gain no capacity. Special pages and covers ignore it; a page that shares a flow with a body section takes that section's allowance. On a page with page-bottom notes the allowance does not apply (Word keeps full line boxes above the notes; measured on AFSÜ Eczacılık). `page.lastLineFit: "off"` opts out. Footnote limits follow the taller column (notes stay at the physical bottom). Per-style leading (MEASURED vs Word, engine-word-pagefit): Word grants a line only its own extra leading (auto multiples: (n-1) single lines; single 0; exact and at-least 0), so `page.lastLineLeadingMm` is the largest allowance of the body and every `typography.paragraphStyles` entry, and each paragraph style with a smaller one pads every fragment bottom by the difference (`box-decoration-break:clone` padding plus a cancelling `::after`, native padding is captured by reserve stamps; break stamps retain their native guard). Limits: blocks that are not paragraph styles (captions, block quotes, list items) use the column allowance (UNKNOWN versus Word); lines with larger-font runs inside one paragraph matched Word in the fixture (18 pt runs in single-spaced lines). It is the default whenever `typography.lineSpacing` uses the Word model (`mode: "word"` or `rule`), because Word applies the rule to every document; verified twice at checkpoint `8176503` with `check.mjs --all --word` (pagefit 205 PASS, parity 146 PASS, structure 130 PASS; all ten real targets have no FAIL; justification remains 17 PASS / 3 explicitly deferred Arial FAIL). The 23 table-tail and three combined paragraph-style/note cases are included; a kept reference paragraph limits note area and splits its note before moving the whole paragraph. Two split-note checks verify counts/pages/baselines (four reference-page lines, maximum 0.016 mm); horizontal note text-box widths/indentation have a MEASURED residual outside those checks. Historical Word render drift up to 0.367 mm remains documented in the pagefit context, so these runs do not establish universal render determinism.

`wordBaseline: true` on positioned special-page text opts into Word baseline paint correction while preserving its page anchor. Existing blocks retain their calibrated placement. `tables.cellStyle.firstLineIndentMm` carries a reviewed cell indent to editor/PDF/Word; absent means the legacy zero indent.

Layout text alignment defaults to the physical page edges (`page`); `content` uses the page margins and `box` keeps the existing text box. The command preserves the vertical position and clears local paragraph indents when targeting the page. Custom highlight colors on special-page text are emitted in the scoped block stylesheet so preview and print do not depend on a mounted rich-text editor.

Repeated alignment commands retain the authored Y anchor of positioned blocks; measured rectangles already include the Word baseline paint offset and must not be fed back into that anchor. Paragraph and heading alignment classes override template alignment, with first-line indentation suppressed for center/right commands. Headings carry their own alignment class rather than acquiring a nested wrapper; existing saved wrappers remain supported.
## Controlled PDF import (Mission 04)

`importThesisPdf(buffer, {fileName, signal, onProgress, ocrLanguage, forceOcr})`
returns a version-1 content document. `importThesisPdfFile(file, note, options)`
returns a staged note. The editor applies it atomically after the user reviews
the source preview and acknowledges remaining notices. Cancellation and errors
leave the current note intact. Academic notes use the same preview and route
through the multi-page editor after applying, in both Canvas and DocumentPane.

Every physical PDF page gets a section, including blank pages. PDF.js tokens
retain page/point geometry; lines and paragraphs, font sizes, heading candidates,
whitespace-based reading order and ruled table cells are inferred. Images are
cropped from rendered paint boxes; scan residual regions are uncertain image
candidates. Upper/lower margin text is stored separately and can be reclassified
as body text in the preview. Table cells and paragraph text, item roles and item
order can be corrected before applying. The persistent report contains page
locators and downloadable JSON. Original PDF bytes, previews and original tokens
remain alongside corrected content; `acknowledged` never means `reviewed: true`.

Tesseract.js runs Turkish/English OCR locally for image-only or mixed pages and
optionally every page. Deskew and 90/180/270-degree retries keep the original
preview. PDF.js resources, OCR worker/core and language data are bundled under
`public/pdf-assets` and `public/ocr`; their provenance, licenses and SHA256 values
are inventoried in `orchestration/engine-work/mission04/bundled-assets.json`. No OCR upload or runtime
CDN request is needed. Limits: 64 MB input, 1000 pages and 12 million rendered
pixels per page. Password-protected PDFs require an unencrypted copy. The desktop
CSP allows self-hosted workers and WebAssembly compilation.

PDF is a drawing format. Formula semantics, vector drawings, borderless or
complex tables, exact fonts, arbitrary reading order and source page/pixel parity
are not guaranteed. Unrecognized content remains in the original PDF/preview;
OCR and extracted structure require review. Acceptance uses the frozen 43-page
SRC02 example and 3-page synthetic EDGE_SCAN; the Task 13 holdouts remain unused.
Exact page/token preservation and independent character/table/image diagnostics
do not prove perfect OCR or lossless reconstruction of all PDF object semantics.

## Font and line fitting (Mission 05)

Known TNR/Arial/Calibri paragraph runs use `wordLineLayout.js` and the pure
`wordLineFit.js` budget. Actual run styles are measured at 1000 px and scaled;
per-line space compression reproduces the final-word limit measured in Word.
Long tokens are split into transient glyph fragments so the remaining suffix
and following words receive a correct fit calculation. These presentation spans
and wbr opportunities are stripped by `thesisSourceHtml` and never become authored
breaks. Native IDs and styles stay on their original elements. Remeasurement
preserves selection, is idempotent and defers during IME composition.

`renderedFonts.js` includes native inline families in layout-PDF font requests.
Actual font programs and embedding permissions are checked by the existing system
font loader. Unsupported or unavailable PDF families fail explicitly; document
warnings name missing rendered fonts. See `orchestration/engine-work/mission05/README.md` for exact
Word, font, editor and source-excerpt evidence and remaining scope limits.


## Page-fit rules added at the 12.10.2026 long-document closure (MEASURED vs real Word)

- **DOCX footnote separator.** Without `w:footnotePr` references in `settings.xml` Word ignores the package's separator footnotes and draws its
  built-in one (a 12 pt Normal paragraph, 13.8 pt tall in Times New Roman), 4.3 pt taller than the editor's reserved
  `spaceBeforePt + thicknessPt + spaceAfterPt` (9.5 pt by default) and moved a two-line fragment to the next note page (AFSÜ p.22, 36 vs 37 pages).
  `finalizeThesisDocx` now writes the template's separator as a paragraph (top border = rule, right indent = `widthPercent`, exact line = space after,
  space before = `spaceBeforePt`) and references both separator ids in `settings.xml`. Check: `AFSÜ` 94 PASS / 0 FAIL, master and PhD.
- **Imported paragraphs and the terminal-leading allowance.** Word grants a page's last line only its own extra leading (single 0, exact/at-least 0,
  auto multiples (n-1) single lines). The flow column carries the body's allowance, so `importedContentCss` guards every imported body paragraph
  with `padding-bottom = --thesis-col-lead - own` plus a cancelling `::after` margin (the same mechanism as template paragraph styles). Source: a
  single-spaced `TableofFigures` "Source:" line at the bottom of a 1.5-spaced SRC10 page moved to the next page in Word, not in the editor.
- **List text start.** The text of a list item with suffix "tab" starts at the first explicit tab stop after the marker, when one lies before
  the hanging indent (Yaşar `GvdeMetni1`: stop 28.1 pt, indent 36 pt): the first line is 7.9 pt wider. `listTabShift` shifts the first line and draws the
  marker at the hanging position (bullets and single-level numbers; other lists keep their native marker).
- **`w:noWrap` cells** of autofit tables never wrap (white-space on the cell and its paragraphs, the justification fit skips them); fixed-layout
  tables ignore it, as Word does.
- **Manual page break.** A `<br>` is inline, so `break-after` on it never took effect; the paragraph that holds a page break now ends its page
  (`p:has(br[data-docx-break=page])`, the paragraph mark stays with the break as in compat mode 15).
- **First-page footer reserve** (`layoutFirstPageReserves`) keeps full line boxes above a taller title-page footer, like a page with notes: no
  terminal-leading allowance (SRC09 p.117: Word moves "6) Operasyonel" although it fits without its extra leading).
- Tools: `orchestration/engine-work/final-closure/long/compare-breaks.py` compares page openings and text coverage order-aware against the Word PDF (totals alone are not a pass).
