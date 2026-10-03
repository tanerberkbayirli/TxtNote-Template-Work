# aku-felsefe-seminer (aku-felsefe-seminer-tr-v1) — self-check after cover/numbering fix (NOT a PASS; independent validator decides)

Evidence: `self-2/` (fixture with the guide example values, `fel.pdf`/`fel.docx` real editor export, `fel.word.pdf` Word COM render of the exported DOCX, `covers.py` measurement script).
Source: AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx p124 (KAPAK ÖRNEĞİ).

## Changed
- Template `aku-felsefe.js`: generated one Kapak sheet (purpose line FELSEFE SEMİNERİ), unnumbered; first following page = 1 (cover numbering restart startAt 0, new generic allowance startAt >= 0). Rows from the guide render (EXPLICIT order, MEASURED sizes): T.C. / AFYON KOCATEPE ÜNİVERSİTESİ / FEN EDEBİYAT FAKÜLTESİ / FELSEFE BÖLÜMÜ / purpose (bold 14 pt, 6 pt after), title bold 18 pt, Hazırlayan + name, Danışman + title/name, AFYONKARAHİSAR + year (bold 12 pt). New placeholders ADVISOR_TITLE, ADVISOR_NAME, SUBMISSION_YEAR.
- Engine (generic, backward compatible): `numbering.startAt` may be 0 (validation.js, pageLayout.js, export.js use `??` instead of `||`) so a restarting cover section can leave the next counted page as 1. Previous values (>=1) behave identically.

## Measured vs source (baseline y, mm from page top; tolerance 0.5)
| Check | Source | Editor PDF | Word render | Result |
|---|---|---|---|---|
| 11 cover rows (T.C. ... 2017), y | guide p7 | max |d| 0.03 | max |d| 0.04 | PASS (<=0.05) |
| sizes/fonts (14/18/12 pt bold) | 14,18,12 | identical, TimesNewRomanPS-BoldMT | identical | PASS |
| page labels | cover unnumbered, first text page 1 | cover blank, next page "1" | same | PASS |
| horizontal centre | guide 113.7 (anchored to guide margins 30/25 mm, not a thesis rule) | editor 110.0 / Word 110.57 mm text-frame centre vs guide 113.7 (delta -3.7 / -3.2) | | UNKNOWN basis (not scored) |
| body paragraph gap | 6 pt before/after (EXPLICIT) | 9.4 mm = 7.30 + 2.12 (6 pt collapsed) | 9.4 mm | PASS; DOCX `before=120 after=120 line=360` |
| margins/first-line indent 12.5 mm (709 twips) | EXPLICIT | unchanged, firstLine=709 | | PASS |

## Remaining UNKNOWN / CONFLICT
- UNKNOWN: drawn cover frame (guide group 158.75 x 228.6 mm; wider than the lisans 155 mm text frame, not reproduced) and horizontal centring basis; title letter case (example is uppercase, field is not forced to uppercase).
- TOC: the guide's contents example (lisans p131) is hand-typed and irregular (level-1 pitch 9.1 mm, sub-entries 4.87 mm, indents 38.83/43.06 mm vary within one level, chapter blocks bold centred). It is not a consistent rule and also contradicts "automatic"; the generated TOC keeps 4 levels (lisans) / generic row spacing, no source-backed delta implemented. Entry typography UNKNOWN. Not scored.
- Word paginates the full fixture longer than the editor (32 vs 30 pages lisans, 29 vs 27 seminer): pre-existing engine-fix-4 (table row height) family, not Felsefe-specific.
- Tests: npm test 658/658 pass (2 new Felsefe tests), npm run build OK.
