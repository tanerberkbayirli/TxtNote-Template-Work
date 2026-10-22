# aku-sosyoloji-lisans: AKÜ Fen Edebiyat Fakültesi, Sosyoloji Bölümü, Lisans Bitirme Tezi

Status: PASS (self-check, real export) for every source-defined, measurable value; many values are UNKNOWN (guide is short).
Registry id: `aku-sosyoloji-lisans-tr-v1` (instituteId `fef-sosyoloji`). Module `templates/aku-sosyoloji.js`, test `src/lib/thesisAkuSosyoloji.test.js` (5 tests; full suite 602 pass), spec `orchestration/specs/aku-sosyoloji-lisans.json` (47 rules: EXPLICIT 20, MEASURED 11, INFERRED 8, UNKNOWN 8).

Source: one guide DOCX (Word-made). Prose = EXPLICIT. Its example pages Ek-1..Ek-6 (Word canvases with text boxes) = MEASURED (XML pPr/rPr, empty-paragraph structure, Word render). The guide's own sectPr/styles describe the guide, not the thesis, and were not used. Canvas frames are not page geometry.

## Real-export measurements (`orchestration/validation/aku-sosyoloji-lisans/self-1/`, 35 sheets; Word render of the DOCX 36 pages)
- Margins: left 45.0 mm, right edge 180.0 mm (30 mm), top 45.2, body bottom 251.0 (limit 252): PASS (expected 45/30/45/45, tol 0.5).
- Body TNR 12 pt, line pitch 20.7 pt (12 x 1.15 x 1.5), 12.5 mm first-line indent, justified, 6/6 pt: PASS. Fonts actually exported: TimesNewRomanPSMT / -BoldMT (genuine TNR), plus 11.5/14/18 pt as in the examples.
- Page numbers bottom centre, covers none, ÖNSÖZ = i ... vi, GİRİŞ = 1: PASS.
- Dış kapak baseline pitches vs Ek-1 Word render: 10.64 / 34.8 / 25.2 / 9.4 / 20.2 / 31.1 mm (identical); iç kapak vs Ek-2: 9.4 / 33.5 / 22.8 / 10.8 / 21.7 mm (identical to 0.1 mm). Word render of the exported DOCX matches the engine PDF within 0.1 mm on both covers.
- Observation: Word render shows text up to x = 181.1 mm on several pages (TOC/list rows), 1.1 mm beyond the 180 mm right margin; engine PDF stays at 180.0. Not investigated further (likely right-tab/leader handling in the DOCX export).

## Conflicts (recorded in spec and `source.notes`)
Prose 12 pt vs list/abbreviation examples 11.5 pt (example applied); `TABLOLAR LİSTESİ` (prose para 45 and Ek-3) vs `TABLOLAR DİZİNİ` (dedicated page Ek-4), with DİZİNİ selected for that page based on page-specificity; "Simgeler ve Kısaltmalar" vs KISALTMALAR DİZİNİ (example); "Sayfa" centred (Ek-4) vs right (Ek-5) (right); cover font name "Times" in examples vs Times New Roman rule (TNR); guide body (1.15 lines, 10 mm indent, 10 pt after) vs its own text rule (text rule); example-page typos/hand shifts not reproduced.

## UNKNOWN (not invented)
Heading typography/spacing/page breaks (only the Ek-3 hierarchy mirrored, INFERRED), page-number font/distance, header, footnote format, caption position/size, table borders, equations, bibliography indent/spacing, Önsöz format, appendix pages, page size. Özet/Abstract, approval and declaration pages are not in this guide and were not generated. Dış/İç kapak numbering: covers unnumbered (INFERRED from numbering.xml list grouping).

## Engine gaps
None blocking. Approximations: TOC chapter row (label + title lines) takes one 10 pt after (example has 10 pt after each line); example-page leading empty paragraphs before list titles (1/2/2, inconsistent) not reproduced.

## Optional-rule audit (2026-10-02)
The [current optional-rule audit report](../validation/aku-optional-audit/REPORT.md) and real-export artifacts record caption/bibliography/header-footer UNKNOWNs and the revised table-list title decision. Ek-4’s dedicated list page supports `TABLOLAR DİZİNİ`; para 45 and the Ek-3 TOC row remain contrary evidence for `TABLOLAR LİSTESİ`. The specificity rationale resolves the implementation choice for the page, while the generated TOC currently reuses that title. Caption label/number patterns are INFERRED from Ek-4/Ek-5 index rows only; they were not observed in caption paragraphs.
