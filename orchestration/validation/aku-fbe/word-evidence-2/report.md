# AKÜ FBE Word evidence 2

**Scope:** official source DOCX/PDF and one long-title, seven-juror Word COM stress copy. This is source evidence only; no production template was edited and no overall PASS is claimed.

## Sources and reproduction

- Official Word-render copy: `orchestration/artifacts/aku-fbe/source/word-render/official.docx`, SHA-256 `779245da7f25a8dc662a051cfd9897d318b41733e5b616b63e74553610821599`.
- Official Word PDF: `orchestration/artifacts/aku-fbe/source/word-render/official.pdf`, 33 pages.
- Approved spec: `orchestration/specs/aku-fbe.json`; primary guide `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf`.
- Test copy: `official-long89-seven-jurors.docx`; rendered PDF: `official-long89-seven-jurors.docx.pdf` (33 pages). The exact 89-character title comes from `attempt-4-proof/phd.long89.fixture.json`.
- Rebuild the copy with `prepare_fixture.py`; render with the adjacent copy of the existing invisible Word COM `render.ps1`; measure both PDFs with `measure_word_pdf.py` using PyMuPDF 1.28.2.

The fixture changes only `word/document.xml`; all other 25 DOCX package members are byte-identical. All four `sectPr` values, 11 explicit page-break elements, and the section break types remain unchanged. It replaces the 3 title fields and approval sentence; adds two Member/affiliation pairs (President + 6 Members = 7 jurors). The official DOCX was not modified.

## Results

| Finding | Evidence and status |
|---|---|
| PDF page geometry | 209.973 × 297.011 mm; spec 210 × 297 ±0.5 mm. **MEASURED; PASS for page size only.** |
| Section margins | Four sections have 1701 twips on each edge = 30.004 mm; guide p.5 §2.3 explicitly requires 3 cm. **MEASURED / EXPLICIT; agrees.** |
| Main body type and pitch | Page 14 body spans are embedded Times New Roman 12 pt; consecutive-line pitch 20.642–20.758 pt vs 20.7 ±0.2. **MEASURED; PASS for sampled font/size/pitch.** |
| Body right edge | Sampled justified body-line glyph boxes reach x=180.97–181.02 mm vs spec 180 ±0.5. **MEASURED; FAIL for sampled PDF text-box edge; XML margin remains 30.004 mm.** |
| Outer-cover title | Official source first baseline 208.39 mm vs spec 215.53 (−7.14 mm); glyph box top 204.62 mm is above the spec’s 210 mm print-box boundary. **MEASURED; FAIL against check `outer-cover-box`.** The template also prints callout text. |
| Inner-cover conflict | First five lines match spec within 0.05 mm. From student name onward, Word-render baselines are 2.79–2.80 mm above spec: e.g. name 158.35 vs 161.15, advisor 183.92 vs 186.71, department 243.58 vs 246.37, date 260.60 vs 263.39. **CONFLICT:** preserve guide-derived spec and official DOCX render values. |
| Approval geometry | Title/sentence/advisor/first juror baselines are 34.55/49.16/92.98/114.87 mm vs 33.96/48.48/92.30/114.19; deltas +0.59/+0.68/+0.68/+0.68 mm exceed 0.5 mm. Juror pitch averages 14.29 mm. **MEASURED; baseline checks FAIL, pitch agrees.** |
| Abstract, TOC, caption, page number | Abstract header baselines differ +0.00 to +0.13 mm; TOC heading/Sayfa baselines differ 0/+0.01 mm; caption size/pitch 11.04/12.71 pt vs 11/12.65; page number center/baseline/font 105.465 mm/283.803 mm/9.96 pt vs 105/283.7/10. **MEASURED; within tolerance except TOC Sayfa right edge x1=181.10 vs 180.00 (+1.10 mm).** |
| Long-title dates | Outer date stays p.1 at baseline 264.914 mm. Inner date stays p.2 and moves from 260.600 to 263.432 mm (+2.832 mm). Neither date spills. **MEASURED; pagination behavior only.** |
| Long-title outer-cover geometry | First title line extends x=34.93–176.06 mm vs the source print box x=55–155 mm. **MEASURED; outside the supported source box.** |
| Seven-juror approval flow | All seven jurors remain on p.3; director name/title move p.3→p.4 at baselines 42.848/50.130 mm. Total PDF remains 33 pages, but content pagination differs. **MEASURED.** |
| Approval→ethics boundary | Approval is one top-level `w:tbl`; director paragraphs are in its second cell. Ethics heading is a body paragraph after the table with one empty paragraph between; no direct `pageBreakBefore`, `keepNext`, or `br`, and no `sectPr` between the table and heading. The shared approval/ethics section closes at `Öğrencinin Adı SOYADI` with `w:sectPr w:type="oddPage"`; margins are 1701 twips on every edge, header/footer distances 709 twips, gutter 0. **MEASURED XML; no explicit new-page rule at this boundary.** |

Approval frame vector geometry, table-rule/image gaps, body bottom, and remaining spec checks are **UNKNOWN in this pass**. The full partial-audit record is `../word-render-audit.md`.
