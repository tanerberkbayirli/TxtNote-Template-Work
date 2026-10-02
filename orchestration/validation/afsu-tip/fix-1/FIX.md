# afsu-tip fix-1 (template level; real exports tip/dhf/bap .pdf/.docx + Word renders *.word.pdf, tolerance 0.25 mm)
Changed: TxtNote/frontend/src/thesis/templates/afsu-tip.js (GEO per guide copy, SHEET centring), src/lib/thesisAfsuTip.test.js, orchestration/specs/afsu-tip.json. Shared engine untouched.
| Item | Expected | Measured editor PDF | Word | Result |
| A1 Üye->ONAY Tıp (EK 9) | 26.92 | 26.91 | 26.93 | PASS |
| A1 Üye->ONAY DHF (EK 9, own copy) | 63.30 | 63.30 (rel. to wrapped title: all EK 9 steps within 0.06) | 63.34 | PASS |
| A2 centred lines centre | 105.5 | 105.45-105.54 (cover, iç kapak, approval, headers, TOC title) | 105.46-106.07 (trailing-space glyphs in Word) | PASS |
| A3 Tıp title->Sayfa / Sayfa->row | 7.65 / 9.41 | 7.65 / 9.41 | 7.67 / 9.44 | PASS |
| A3 DHF | 6.94 / 9.44 | 6.93 / 9.44 | 6.95 / 9.44 | PASS |
| DHF EK 7 baselines (own copy) | 59.10 ... 263.60 | all within 0.01 | - | PASS |
| Tıp EK 7/EK 8 baselines | unchanged | unchanged (line-dump compare vs independent-1: only p4 ONAY/DEKAN +22.05, p8 TOC intended) | Word +0.22..0.26 offset is pre-existing (identical in independent-1 export) | PASS (see note) |
Method: Sayfa line height = 9.41 mm / 13.8 pt = 1.9327 (pageHeadingStyle.lineHeight; its space-after is not applied by the engine), İÇİNDEKİLER spaceAfter 7.89 pt (Tıp) / 5.87 pt (DHF). Üye->ONAY via a real spacer block. Centring via negative left/right indents (flow) and box x 25..186 (absolute).
Not changed: EK 6 outer cover (schematic frame, INFERRED); DHF EK 11/12 only first-baseline offset taken from DHF copy (0.65 / -2.87 mm).
Template note corrected (EKLER row prints a page number, EK 13 has none: engine gap); Vancouver numbering documented as engine gap in the spec.
Engine items left: A4 (editor footnote pitch), A5 (DOCX table rows), Vancouver numbering, per-title TOC rows without page numbers, pageHeading space-after.
