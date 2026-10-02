# AKÜ ISG term-project template — independent audit

**Verdict: FAIL (partial independent validation).** No production/template/spec/progress files were edited. The fresh editor/Word exports are stable relative to the previous `self-1` fixture, but two source-supported gaps remain: browser pagination sends the inner-cover city/year onto a separate sheet and shifts all Roman front-matter labels, and emitted DOCX footer section properties replace the source's 12.5 mm footer distance plus trailing empty paragraph with a 17.4 mm distance and one paragraph. The visible page-number baseline happens to match; that does not establish structural compliance. This does not satisfy the university completion gate.

## Sources and method

The official source is `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Is_Guvenligi_Tezsiz_Proje/AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc` (2022-08-02, SHA-256 `19d9d19154ad57dc88e9004fb37dfa391a434c9bed5abe633b33e6b2a5a480ed`). The audit inspected the converted Word source at `orchestration/artifacts/aku-isg-tezsiz-proje/source/isg.docx` (SHA-256 `83f5471023d51d9dcc5b78ac763274287b5d2b677063c03ea9184738cbd92c79`) and its source Word PDF `source/isg.pdf` (SHA-256 `2af466a7ca2a9b9f41f1b7783c616d4e1a969e02dedd9957cb45b66f8da64b`). The original `.doc` is listed current in the source inventory; no other guide was used for values.

The fixture is a separate copy of the existing deterministic stress fixture. I exported it through `orchestration/tools/export.mjs` and the editor's own PDF/Word buttons, then rendered the copied DOCX with hidden Word COM. The editor export reports 34 sheets, all 41 expected generated targets, `validation: []`, no template fallback and no pagination warning. The editor PDF has 34 pages; the Word PDF has 35. Each current PDF's extracted text is identical page-by-page to its stored `self-1` counterpart (34/34 and 35/35); this checks the current engine-fix-3 regression baseline for changed output, but does not clear the findings below. These page counts are fixture behavior, not requirements.

## Measured source and output

| Item | Official source | Fresh DOCX/PDF output | Result |
|---|---|---|---|
| A4 page | XML `11906×16838` twips; Word PDF `595.32×841.92 pt` | Same A4 PDF box; section sizes match | PASS |
| Outer-cover margins | SectPr 1: top/bottom 1701 twips = 30.003 mm; left 2268 = 40.005 mm; right 1418 = 25.012 mm | Output: 30.003 / 40.005 / 24.994 mm (right is 1417 twips) | PASS within 0.02 mm |
| Front-matter margins | SectPr 2: top/bottom 1418 = 25.012 mm; left/right 1701 = 30.003 mm | Output: 24.994 / 30.003 mm (1417 / 1701 twips) | PASS within 0.02 mm |
| Body margins | SectPr 3: all four margins 1701 = 30.003 mm | Output body sections use 1701 twips on all sides | PASS |
| Body font | Normal style: Times New Roman 12 pt | DOCX body runs and embedded PDF font program `TimesNewRomanPSMT`, 12 pt; bold variant `TimesNewRomanPS-BoldMT` | PASS |
| Page number style/position | Footer PAGE field, centered, 11 pt Times New Roman | PDF page-number spans are 11.0–11.04 pt TNR, centered | PASS |
| Page-number baseline | Source Word PDF: 51.624 pt from bottom = 278.88 mm from top on A4 | Editor: 51.659 pt = 278.87 mm; Word: 51.624 pt = 278.88 mm | PASS, max delta 0.02 mm |
| Footer section distance/paragraphs | SectPr footer = 709 twips = 12.506 mm. Each active source footer has PAGE paragraph then trailing empty paragraph. Word COM: PAGE paragraph TNR 11 pt, single line-spacing 12 pt, 0/0 before/after; trailing empty Alt Bilgi paragraph TNR 12 pt, single 12 pt, 0/0 before/after. | Current DOCX sections use footer = 986 twips = 17.392 mm and a single PAGE paragraph; no trailing empty footer paragraph. | **FAIL: XML differs by +4.886 mm and omits measured source paragraph.** PDF baseline matches, but this workaround does not reproduce the source properties. |

The DOCX has 20 section-property elements generated for page flow; their unique margin signatures are the three expected cover/front/body geometries above. The 20 repeated section entries do not create a margin mismatch. The source has three `sectPr` blocks, page-number transitions lower-Roman from 1 in the front matter and decimal from 1 in the body, and `titlePg` to suppress cover/inner-cover footer display.

## FAIL — inner-cover flow changes front-matter pagination

The fixture title is `Çevrimiçi Öğrenme Ortamlarında Dijital Okuryazarlık Düzeyi`; it wraps to two lines. The source and current Word render fit the full inner cover on PDF page 2. Word prints ethics as `ii` on page 3, as does the official source PDF. The browser/editor PDF places only `Afyonkarahisar, 2026` on a new page 3 and starts ethics as `iii` on page 4. The remaining front-matter labels are likewise one higher in the editor than in the source/Word render; body numbering restarts at 1 in both output paths.

Measured in the current Word PDF, the inner-cover city/year baseline is 270.80 mm from page top, within the 272.00 mm text-area bottom for the 25 mm front margin. In the editor PDF, that line appears at 28.96 mm from the top of its separate continuation page. The template positions this last line at baseline 261.1 mm for a one-line title. The two-line title wrap adds roughly one 16 pt, 1.5-spaced title line (about 9.7 mm), leaving the browser line box extending below the page's text-area edge even though Word permits the glyph baseline. This points to terminal line-box leading as the likely engine cause; `pageLayout.js` already has the generic `trimTerminalTextLeading` capability, but it is not enabled for this section and was not changed or tested here. Treat this causal explanation as INFERRED; the page split and label difference are MEASURED.

The old report statement that a two-line title also overflows in Word is contradicted by this fresh Word COM render and should be corrected. Do not treat source blank-title placeholder geometry as proof about longer user titles.

## Headings and numbering — source conflict preserved

The converted source body contains these directly evidenced samples: `1. GİRİŞ` (paragraph 256, style `Balk1`); `2. LİTERATÜR BİLGİLERİ` and `3. DEĞERLENDİRME, TARTIŞMA ve SONUÇ` (paragraphs 267 and 277, style `T1`); `2.1.` / `3.1.` (paragraphs 270 and 280, `Balk2`); and `2.1.1.` / `3.1.1.` (paragraphs 273 and 283, `T2`). The output uses numbered heading text at levels 1–4. The stress fixture also includes numerals inside authored subheading names, so duplicated visible numerals are fixture-content artifacts and are not scored as a template numbering defect.

Source XML/style evidence conflicts for level 1: `1. GİRİŞ` uses `Balk1` (12 pt bold, 1.5 line-spacing, 12 pt before, and rendered at the left text edge on source PDF page 11); the other two numbered major headings use `T1` (single line, 6/6 pt in the style). The current template applies its common H1 treatment across headings and does not preserve this per-heading source discrepancy. Classify this as **CONFLICT**, not as an unqualified pass or an invented universal rule. H2 `Balk2` and H3 `T2` sample structure supports the emitted 12 pt bold hierarchy and numbering prefixes; H4 appears only in a paragraph labeled `ÖRNEK (GEÇİCİ TASLAK) PLAN`, so H4 requirements remain **INFERRED / unscored**. The source draft plan's restart statement does not override the actual rendered body pages.

## Remaining source limits

Caption wording, position, type size and numbering remain UNKNOWN; the official template has no caption paragraph sample. Do not infer those from the list-of-tables/figures pages. Other undocumented special typography is not scored here.

## Reproduction artifacts

- `source-audit.py` inspects the source/current DOCX section properties, paragraph/style XML, footers, and the source/editor/Word PDFs; it writes `baseline.json` including text-chunk font, baseline matrix and page-size measurements.
- `inspect-footer.ps1` opens the converted source read-only in invisible Word COM and records paragraph style, font, line spacing, and spacing for the source footer, including the empty terminal paragraph.
- `fixture.json`, `overrides.json`, `isg.pdf`, `isg.docx`, `isg.layout.json`, and `isg.docx.pdf` are the fresh independent export/render. `render/` contains inspected source/Word/editor page images.

Word COM rendering and source inspection have ended; the Word process was closed by the scripts. No production files were edited, no tests or progress metadata were changed, and nothing was committed.
