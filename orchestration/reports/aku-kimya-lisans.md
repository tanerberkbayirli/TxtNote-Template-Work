# aku-kimya-lisans — AKÜ Fen Edebiyat Fakültesi, Kimya Bölümü, Lisans Bitirme Tezi

Status: **PASS (self-check)** with the documented deviations below. Registry id `aku-kimya-lisans-tr-v1` (instituteId `fef-kimya`, `undergraduate`, `official`).

## Sources and priority
- Guide `AKU_Kimya_Bitirme_Tezi_Yazim_Kilavuzu_2023.pdf` (29 pp., 2023-12), template `AKU_Kimya_Bitirme_Tezi_Sablonu_2026.docx` (2026-02-24).
- USER DECISION (binding): DOCX XML (sectPr, styles, paragraph/run properties, empty-paragraph structure, tables) and its Word render win; the guide fills what the DOCX leaves open; conflicts are recorded, never silently resolved; undefined = UNKNOWN.
- Word COM rendered the official DOCX to `orchestration/artifacts/aku-kimya-lisans/source/template.pdf` (measured geometry). LibreOffice was not needed.

## Files
`TxtNote/frontend/src/thesis/templates/aku-kimya.js`, `templates/assets/akuKimyaLogo.js` (template `image1.jpg`, md5 2cc4f4f4…), `src/lib/thesisAkuKimya.test.js` (7 tests), one Edit in `registry.js`, `orchestration/specs/aku-kimya-lisans.json` (34 rules: 22 EXPLICIT, 5 TEMPLATE, 5 MEASURED, 1 INFERRED, 1 UNKNOWN; 7 conflicts, 7 unknowns, 3 engine gaps), this report, `orchestration/validation/aku-kimya-lisans/self-1/` (fixture, real exports `kimya.pdf`/`kimya.docx`, Word render of the exported DOCX `kimya_word.pdf`, `compare.py`, compare outputs).

## Real-export measurement (template Word render vs exported PDF vs Word render of the exported DOCX)
Template p.N compared with the same page of each output (tolerance 0.5 mm; `compare-*.txt`):

| Check | Expected (template) | Chrome PDF | Word render of DOCX | Result |
|---|---|---|---|---|
| Page / margins | A4, 30 mm (cover 10.02 top) | A4, 30 mm | A4, 30 mm | PASS |
| Cover seal / logo | 30.00,10.02 26.19 mm / 148.59-182.67, 5.29-39.37 | exact | exact (10.04) | PASS |
| Cover text y | AFYON 45.21, BİTİRME TEZİ 104.87, title 138.90 | 45.20 / 104.84 / 138.92 | 45.21 / 104.87 / 138.95 | PASS |
| Cover lines after the title | student 170.15, Danışman 195.72 | -5.67 mm | -5.67 mm | DEVIATION (template's single-spaced "(Devam)" sample line is not generated) |
| Onay page lines | 30.22 / 35.90 / 53.76 / 71.55 / 108.09 | dy <= 0.03 | dy 0.00 | PASS |
| Ethics page | title 30.19 … beyan 141.53, date 156.15, İmza x 167.42 | dy <= 0.2 | dy <= 0.21 | PASS |
| ÖZET/ABSTRACT/TEŞEKKÜR/dizin titles, "Sayfa", rows, TOC indents 0/5/10/15 | y 30.19, 37.47, 44.79 …, x 30.02/35.02/40.01/45.05 | dy <= 0.04 | dy 0.00 | PASS |
| Symbols definitions | x 70.71 | 70.71 | 70.71 | PASS (terms 1.95 mm further left than the template's table cell padding: guide says 0) |
| Body font / size | TimesNewRomanPSMT 12 / bold headings 12 | same | same | PASS (embedded names read from PDF) |
| Line pitch, paragraph and heading gaps | 7.28-7.33 / 14.61 mm | 7.30 / 14.60 | 7.28-7.33 / 14.61 | PASS |
| Page number | 10 pt centred, y 280.63, ÖZET i, GİRİŞ 1 | 280.38 (box bottom 284.28), i, 1 | 279.99, i, 1 | PASS (0.25-0.64 mm: footer box rounding) |
| Bibliography | first entry 46.91 below title 30.19; hanging x 42.51 | 46.90 / 42.49 | same cadence | PASS |
| Figure image to caption | 2.58 mm | 2.58 | 2.28 | PASS (0.30 mm in the DOCX) |
| Caption 11 pt bold label, "(Devam)", equation Cambria Math 12 "(3.1)", threeRule tables | template | present | present | PASS |

`npm test`: 595 tests pass (7 new).

## Conflicts (guide vs DOCX; DOCX implemented)
1. Cover top margin: guide §2.3 3 cm vs DOCX 10.02 mm. Reproduced as template extents (cover section top 5.29 mm, right 27.33 mm + 2.67 mm text right indent; header distance 0.3 mm so Word's empty header paragraph does not push the body).
2. ÖZET/ABSTRACT tail: guide keywords then year/pages vs DOCX year/pages then keywords → DOCX order.
3. Footnotes: guide silent (general 12 pt); DOCX style `footnote text` = Normal without size → 10 pt single (INFERRED).
4. Table cell size: template samples inconsistent (12 pt vs unsized 10 pt); guide 12 pt used.
5. Symbols term indent (table cell padding 1.95 mm vs guide 0): 0 used. 6. Onay→etik filler paragraphs (47) not replicated (own page).

## UNKNOWN (not invented)
Dış Kapak layout; H3/H4 letter case; table row heights; spacing of a wrapped long title; abstract length; ÖZGEÇMİŞ field content; numbered İnternet Kaynakları group.

## Engine gaps (shared engine untouched)
No floating (wrapNone) images or negative offsets → cover emulated with section margins; export writes an empty header part per section (Word then pushes the body down on very small top margins) → worked around with `header.distanceMm: 0.3` on the cover.
