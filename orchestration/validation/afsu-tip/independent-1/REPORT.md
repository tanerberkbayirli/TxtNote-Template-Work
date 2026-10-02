# afsu-tip independent-1 — FAIL (2026-10-03, independent Sonnet validator; evidence files in this folder)
- A1 FAIL Onay (EK 9): Üye→ONAY expected 26.92 mm, actual 4.86 mm (Δ −22.06). Template `spaceAfterPt: 62.5` on a row group is ignored by PDF and DOCX.
- A2 FAIL centred special-page lines (cover, iç kapak, headers, TOC title): official examples centre at 105.5 mm (sheet centre, even EK 11/12 with 4 cm block); export 112.5 (text-block centre). Δ +7.0 mm.
- A3 FAIL İçindekiler "Sayfa"→first row: expected 9.41 mm, actual 4.87 (Δ −4.54).
- A4 FAIL editor-PDF footnote single spacing: line pitch 5.97 vs 4.87 mm (Word correct). Engine.
- A5 FAIL DOCX table rows +4.51 mm/row in Word (trHeight+tcMar); multi-page table caption stranded; Word 36 vs 34 pages. Engine.
- CONFLICT unrecorded: Tıp and DHF guide copies have different example geometry (EK 7 student 169.78 vs 139.46 mm; Danışman 206.29 vs 173.55; T.C. 52.96 vs 59.10; EK 9 ONAY 248.81 vs 239.01). DHF entry uses Tıp geometry.
- Also: template note says EKLER TOC row has no page number but export prints "21"; Vancouver numbering not generated (citationStyle label only, undocumented engine gap).
PASS: margins, fonts (TNR only), 1.5 pitch, indent, headings and H→H gaps, EK 7/EK 8 baselines ≤0.03 mm, Özet/Abstract headers ≤0.04 mm, figure/table gaps, page numbers centred 105.0, TOC labels match.
