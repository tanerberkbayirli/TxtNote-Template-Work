# selfcheck-fix-3 - aku-matematik-lisans (after independent-2 FAILs)

Real export: self-3/mat.{pdf,docx,word.pdf} (dev server 5173, Chrome; Word COM own instance PID 12100, Quit in finally). fixture self-3/fixture.json = indep2 fixture + symbols as a table (th row "Simgeler", rows, th row with blank paragraph + "Kisaltmalar", rows). Reference: official.word.pdf.

| check | official | before | after ED (editor PDF) / WD (Word) | status |
|---|---|---|---|---|
| lists pitch (Sekil p7) | 7.30 mm (line=360, after=0), wrapped lines too | gap 6.98, wrapped 4.87 | ED 7.30/7.30/7.30; WD 7.28/7.32/7.28 | PASS |
| symbols text x0 | 31.97 | 30.00 | ED 31.89 / WD 31.93 (-0.08/-0.04) | PASS |
| symbols rules | below Simgeler cells, below Kisaltmalar cells, below last row | none | WD rules at 49.49 / 69.14 / 83.91 mm (official 49.49 / 113.26 / 177.27 on its own table length, same pattern); DOCX tcBorders bottom sz=4 on both header rows + tblBorders bottom | PASS |
| gap last symbol -> "Kisaltmalar" | 9.89 (after a sub/superscript row) | none (4.87) | ED 9.73 / WD 9.73 (blank paragraph in header cell) | PASS (-0.16) |

Changes: templates/aku-matematik.js (listRule 1.5/0/0; symbols: tab/hanging removed, overrides.tables headerRules); NEW generic tables.borders.preset "headerRules" (engine.js CSS: rule under header-only th rows + last row, no top rule; export.js: same in DOCX); spec conflict record rewritten (both values, ruling XML > prose).
Notes: the blank row above "Kisaltmalar" is author content (empty paragraph in that th cell). A table in this section still carries the editor's caption unless removed by the author (not template-controlled). Mid-table th row is also emitted with w:tblHeader (Word repeats only leading header rows).
Tests: aku-matematik tests updated (+1 symbols test, list assertions) ; mutation (border-bottom -> top) fails the test; npm test 661/661; npm run build OK.
