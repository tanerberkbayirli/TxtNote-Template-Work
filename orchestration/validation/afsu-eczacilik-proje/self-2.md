# AFSÜ Eczacılık project — real export self-check 2 (v6)

Status: **PASS (self-check, PDF measured + DOCX XML inspected). Not an independent Word render (Word COM not used).** Vertical page-number distance from the page bottom stays UNKNOWN in the source.

Export: `orchestration/artifacts/afsu-eczacilik-proje/exports/export-v6.{pdf,docx,layout.json}` from `fixture.json` (unchanged) via the real editor (`export.mjs`; 68 sheets, 30 generated targets verified). Tools in `self-2/`: `measure_pn.py`, `measure_gaps.py`, `dom_gaps.mjs` (DOM probe), outputs `pagenumber-measure.txt`, `gaps-measure.txt`.

## Checks (source: Yönerge 2024 §1.7 p.4, §1.8 p.6)

| Check | Expected (source) | Measured (v6) | Result |
|---|---|---|---|
| Page number horizontal centre | bottom centre of the page: 105.00 mm | 104.993-105.038 mm on all 66 numbered pages; Roman 1/2/3/4 chars (v, iv, iii, viii) and Arabic 1/2 digits in the fixture; 3 digits (pages 100-152) checked on a temporary startAt=95 export (104.998-105.051), template reverted | PASS (v5: 114.99 = FAIL) |
| DOCX footer centring | centre of text region = page centre | 19 numbered footers: `jc=center` + `w:ind w:right="1134"` (20.0 mm = leftMargin 40 − rightMargin 20 → region 40..170 mm, centre 105 mm), PAGE field; 2 cover footers without number; `pgMar` left 2268 / right 1134 | PASS |
| Number font | not specified (UNKNOWN) | Times New Roman 12 pt (`TimesNewRomanPSMT`), baseline 283.551 mm on every page | MEASURED (value not source-backed) |
| Figure lower edge → caption | 6 pt | 5.99 pt (image bottom 110.00 mm; caption baseline 115.41 mm; Word line model); DOCX caption `before=120` | PASS |
| Text ↔ figure+caption block | 12 pt | caption → next text 11.99 pt (v5/default: 19.3 pt FAIL); DOCX next paragraph `before=240`. Text → figure: DOCX figure `before=240`, editor margin 12 pt (PDF not measurable: the single fixture figure starts a page) | PASS |
| Table caption → table | 6 pt | 6.74 pt to outer edge of the 0.75 pt rule (0.26 mm; 6.37 pt to rule centre); DOCX caption `after=120` | PASS (≤0.5 mm; 0.26 mm to outer edge) |
| Table ↔ text | 12 pt | text → caption 12 pt (heading → table caption 30.84 pt baseline model = 12 pt gap); table → next text 12.75 pt to outer rule edge (0.26 mm); DOCX `before=240` | PASS (≤0.5 mm) |

Interpretation (INFERRED): the 12 pt gap is a Word spacing box gap, as for paragraphs; line top = baseline − 0.9336 em, line = 1.15 em × multiple.

## Engine changes (generic, opt-in, backward compatible)

1. `page.numbering.centerOnPage` (with `align: "center"`, no xMm/widthMm box): editor/print chrome box spans the full page width; DOCX footer paragraph gets an indent of |left−right| margin on the opposite side; PDF jsPDF path was already page-centred. Vertical placement unchanged. Files: `ThesisSectionPages.jsx`, `export.js`, `engine.js` (shared-page signature), `validation.js`, `schema.d.ts`.
2. `typography.lineSpacing.figureExitGap: "spacing"` (needs blockGap `paragraphPitch`): paragraph/heading/note after a captioned figure is `body.spaceAfterPt` (+ its space-before) below the caption instead of one paragraph pitch. Files: `blockGap.js`, `validation.js`, `schema.d.ts`.
3. Template: `centerOnPage: true` on all page-number rules; `figureExitGap: "spacing"`.

## Tests and regression

- `npm test`: 626 pass, 0 fail (new: `thesisPageNumberGeometry.test.js` centerOnPage case, `thesisAfsuEczacilikProje.test.js`).
- Regression, real exports with current code: aku-kimya-lisans fixture → PDF line dump identical to the stored self-1 dump (0 diff lines); mcbu-lee master fixture vs stored `fix-2/lines-master.txt`: 8 diff lines, only the page labels "I"/"II" now bold. This comes from `resolvePageNumberStyle` inheriting body weight (commit 1977a1c, after fix-2), not from these options (mcbu sets neither).

## Open

- Microsoft Word render of v6 still pending (Word unavailable). Vertical page-number distance, cover logo positions: UNKNOWN in source.
