# engine-fix-4 — NOT DONE (agent stalled 2026-10-03, watchdog)
Goal: (1) editor-PDF footnote single-spacing pitch (Tıp 5.97 vs 4.87 mm; Ecz 4.98 vs 4.06 mm), (2) DOCX table row height (+4.5 mm/row in Word),
(3) stranded multi-page table caption in Word, (4) DOCX TOC rows after=240 line=360 vs editor 7.30 mm. Source: afsu-tip/afsu-eczacilik-proje independent-1 REPORT.md.
State: partial, unverified edits to export.js and pdfmeasure.py saved as UNVERIFIED-partial.patch and reverted from the tree.
before/ and after/ folders hold its intermediate exports (not trusted). Restart the task from scratch or review the patch first.

## 2026-10-03 table items (items 2 and 3 of the goal list) — DONE by integrator (code uncommitted)
Root cause (2): DOCX `trHeight atLeast` was set to line box + 2x6 pt cell padding + border, but Word ADDS tcMar and the border to trHeight
(Word COM: aku-cografya old rows 13.97/13.76 mm vs PDF 9.37). Cell paragraphs were already exact (cellStyle over body, spacing 0/0, firstLine 0).
Fix: `export.js` tableDocx trHeight = resolved line box only (margins/border then add up as the editor's padding/border do).
Item 3: table caption above a table now also gets `keepLines` (keepNext was already present); continued captions untouched.
Template: `aku-cografya` tables.cellStyle fontSizePt 12 -> 11 (official template XML: tables#1,#2 w:sz=22, no w:spacing => single; guide allows 8-12; template XML wins).
Tests: thesisDocxSpacing.test.js +2 (cell/trHeight/tcMar/paragraph spacing; caption keepNext+keepLines; mutation-checked). npm test 660/660, build OK.
Measured (real export; tables/ dir; Word row Y via COM Information(6); Word ExportAsFixedFormat hung >17 min so no Word PDF):
- aku-cografya: PDF row pitch 8.68 mm; Word 8.89-9.10 mm (before: 13.76-13.97). Pages PDF 33 / Word 32 (before fix Word 36 vs PDF 33).
- afsu-tip: PDF 9.10 mm; Word 9.31-9.53 mm (+0.2 mm/row residual: border/rounding). Pages PDF 34 / Word 34.
Remaining (not done): official example rows are ~4.65 mm pitch (no cell padding) while the editor's default academic cell padding (6 pt top/bottom) gives ~8.7 mm in both PDF and
Word; matching needs a cell-padding option (tables.borders.preset gives zero vertical margin) — template/spec decision, escalated. Residual 0.2 mm Word>PDF per row.
