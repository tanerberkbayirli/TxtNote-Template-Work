# AKÜ-FBE Word-render audit (source evidence complete; production validation pending)

## Scope and source

This stage measures the real Word COM export of the official AKÜ FBE DOCX and records a Word-rendered stress case. It does not validate TxtNote output or declare the template complete.

- Source DOCX copy: `orchestration/artifacts/aku-fbe/source/word-render/official.docx` (local 2025 resave of the official online 2023 template; SHA-256 `779245da7f25a8dc662a051cfd9897d318b41733e5b616b63e74553610821599`).
- Source Word PDF: `orchestration/artifacts/aku-fbe/source/word-render/official.pdf`; Word COM render, **33 pages**.
- Approved spec: `orchestration/specs/aku-fbe.json`; source priority gives explicit 2020 guide requirements precedence and uses official DOCX XML for measured structure.
- Reproducible details and evidence: `orchestration/validation/aku-fbe/word-evidence-2/report.md`.

## Main measurements

PDF coordinates use PyMuPDF 1.28.2 and 25.4/72 mm per point. `MEASURED` values are observations from this source Word PDF. PASS applies only to the named check, never to the thesis template as a whole.

| Check | Spec | Official Word PDF | Δ | Assessment |
|---|---:|---:|---:|---|
| Page size | 210 × 297 mm, ±0.5 | 209.973 × 297.011 mm | −0.027 / +0.011 mm | PASS, geometry only |
| Source section margins | 30 mm, all sides | DOCX XML `w:pgMar` 1701 twips = 30.004 mm in all four sections | +0.004 mm | MEASURED; matches 3 cm guide rule |
| Body text | Times New Roman 12 pt | TNR program embedded; 12 pt spans on p.14 | — | PASS, font/size only |
| Body line pitch | 20.7 pt ±0.2 | 20.642–20.758 pt on consecutive body lines, p.14 | −0.058 to +0.058 pt | PASS, sample only |
| Body left edge | 30.00 mm ±0.5 | x0 30.02 mm, p.14 | +0.02 mm | PASS, sample only |
| Body justified-line right edge | 180.00 mm ±0.5 | x1 180.97–181.02 mm on p.14 | +0.97 to +1.02 mm | FAIL as measured text-box geometry; section margin itself is 30.004 mm |
| Outer-cover title first baseline | 215.53 mm; print box x55–155/y210–275 | baseline 208.39 mm, p.1; first title bbox top 204.62 mm | −7.14 mm baseline; top 5.38 mm above box | FAIL against the approved measurable check; callout text also prints on the template page |
| Inner-cover baselines, first five lines | 50.38, 58.94, 93.02, 127.10, 135.61 mm | 50.43, 58.98, 93.07, 127.14, 135.65 mm | +0.04 to +0.05 mm | Within 0.5 mm |
| Inner-cover baselines, name onward | name 161.15; advisor 186.71; co-advisor 212.28/220.80; dept 246.37; date 263.39 mm | name 158.35; advisor 183.92; co-advisor 209.49/218.01; dept 243.58; date 260.60 mm | −2.79 to −2.80 mm | **CONFLICT**: guide-derived spec and official Word-rendered template differ beyond tolerance; preserve both values |
| Approval title / sentence / advisor / first juror | 33.96 / 48.48 / 92.30 / 114.19 mm | 34.55 / 49.16 / 92.98 / 114.87 mm, p.3 | +0.59 / +0.68 / +0.68 / +0.68 mm | FAIL against spec tolerances (0.5 mm) |
| Approval juror row pitch | 14.29 mm | 14.29 mm average across five sample rows, p.3 | approximately 0 mm | MEASURED; sample count is five |
| Abstract header baselines | 33.96, 41.16, 55.72, 75.23, 82.56, 89.85, 97.17, 104.45, 111.78, 126.38 mm | 33.96, 41.24, 55.85, 75.32, 82.64, 89.92, 97.26, 104.54, 111.86, 126.47 mm, p.5 | +0.00 to +0.13 mm | Within 0.5 mm; placeholder title lines observed |
| TOC heading / “Sayfa” | 33.96 / 41.23 mm; right edge 180.00 mm | 33.96 / 41.24 mm; “Sayfa” x1 181.10 mm, p.8 | 0 / +0.01 mm baseline; +1.10 mm edge | Baselines within tolerance; right-edge check FAIL |
| Figure/table caption | 11 pt; line pitch 12.65 pt | 11.04 pt; p.17 wrapped caption pitch 12.71 pt | +0.04 / +0.06 pt | PASS, sampled caption only; table-rule/image gap not measured |
| Page number | center 105 mm; baseline 283.7 mm; TNR 10 pt | center 105.465 mm; baseline 283.803 mm; TNR 9.96 pt, p.14 | +0.465 / +0.103 mm; −0.04 pt | Within tolerance; p.1–4 unnumbered, p.5 is i, p.14 is 1 |

These measurements compare the source template’s Word output with the approved spec; they do not authorize changing the spec to match the template. The inner-cover geometry conflict and the approval/cover deviations require the implementation orchestrator to adjudicate against guide pages and XML evidence before any production fix.

## Long-title and seven-juror Word experiment

`word-evidence-2/prepare_fixture.py` made a copy of `official.docx` using the exact existing 89-character `phd.long89.fixture.json` title in the outer cover, inner cover, abstract, and approval sentence, then added two Member/affiliation pairs. The source package hash remained unchanged. The copy changes only `word/document.xml`; the other 25 ZIP members are byte-identical, all four section properties are canonical-XML identical, and the 11 existing explicit page breaks and four section break types are unchanged. The approval sample has a President plus six Members (seven jurors total).

Rendered through the existing invisible Word COM `render.ps1`:

- **33 pages**, same total count as the official render. A same page count does not mean equivalent content pagination.
- Outer-cover date remains on p.1 at baseline 264.914 mm.
- Inner-cover date remains on p.2 but moves from 260.600 to 263.432 mm (**+2.832 mm**); no cover date spills to another page.
- The long outer-cover title line extends x=34.93–176.06 mm, outside the source print box x=55–155 mm.
- All seven jurors remain on approval p.3. The director name and title move from p.3 to p.4 (test baselines 42.848 and 50.130 mm).
- Ethics heading begins on the same p.4 after the director block.

### Approval-to-ethics boundary evidence

In source `word/document.xml`, the approval form is a single top-level `w:tbl`; the director name/title paragraphs are in its second cell. The ethics heading is a body paragraph immediately after the table with one empty body paragraph between them. The heading has no direct `w:pageBreakBefore`, `w:keepNext`, or `w:br`; there is no `w:sectPr` between the approval table and ethics heading. The approval/ethics span closes at the later body paragraph `Öğrencinin Adı SOYADI` (`w:sectPr w:type="oddPage"`): its section geometry is 1701 twips on all edges, 709-twip header/footer distances, and gutter 0. The preceding section break is before the approval table. The document has four `w:sectPr` elements and 11 explicit page-break `w:br` elements elsewhere, none at the approval-to-ethics boundary. This XML structure explains why Word lets the approval table’s director row flow onto p.4 and then starts the ethics material on that same page.

The stress PDF’s page count and flow are MEASURED. Whether TxtEngine should reproduce this natural shared-page behavior is an implementation requirement to resolve; no separate forced-page rule appears at this DOCX boundary.

## Unknown or unmeasured in this source pass

- Approval double-border frame coordinates and line-weight geometry were not measured from PDF vector paths.
- Caption/table-rule and figure/image separation, footnote geometry, body bottom edge, and every remaining `measurableChecks` row were not re-measured here.
- The sample DOCX contains instructional callouts on its cover and special pages; those textboxes are not thesis content. PDF boxes from those callouts are excluded from content geometry judgments unless called out above.
- No TxtNote/TxtEngine export was generated or compared in this stage. No production file, spec, progress record, or template was edited.
