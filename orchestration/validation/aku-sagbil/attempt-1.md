# aku-sagbil validation, attempt 1

Real export path (ThesisEditor PDF/Word buttons) for aku-sagbil-master-tr-v1 and aku-sagbil-phd-tr-v1 (Edge 154, 36-page fixture, artifacts in orchestration/artifacts/aku-sagbil/export). Checks: orchestration/validation/aku-sagbil/measure.py -> attempt-1.json (58 checks, 29 per variant): **58 PASS, 0 FAIL**.

Checked against the 2022 guide (not the stale spec measurableChecks): A4; 30 mm margins (left x0 30.0, right x1 180.0, DOCX pgMar 30 mm); embedded genuine Times New Roman regular+bold TrueType programs; body 12 pt, pitch 20.7 pt (+-0.2); page number bottom centre TNR 11 pt, GIRIS = 1; H1 bold 12 pt left uppercase, own page, numbering; bibliography 11 pt single, 12.5 mm hanging; TOC SAYFA bold right, no leader; OZET at text-block top centred; DOCX line=360, font, footer sz 22/centre. Example baselines (Ornek 1, 2, 4) reproduced within 0.1 mm (MEASURED, not stated requirements).

## Not PASS-able / needs human decision
- CONFLICT: front numbering. 2.6 text: OZET = i; Ornek 8: OZET = IV. Implemented Ornek 8 (OZET iv); check marked PASS only against that reading.
- CONFLICT: inner-cover sizes (3.2.2 14 pt vs Ornek 2 note 12 pt), caption size (12 vs 11), list titles (SEKILLER DIZINI vs SEKILLER), EKLER number/labels (7 vs 8, EK 1 vs 8.1). Implemented as documented in template.source.notes.
- UNKNOWN (non-source choices, NOT_SPECIFIED): page-number distance (12.5 mm), heading/caption/figure/table spacing details, footnote size/thickness, equation placement, front-title offsets, CV layout beyond Ornek 14.
- Spec errors found against the PDF: toc.leader "dotted" (Ornek 8 has none); englishAbstract keyword label "Key words:" (PDF prints "Keywords:").
- Limitation: approval/ethics pages are counted but unprinted, so they cannot be listed with a page number in the contents (Ornek 8 lists II, III); they are omitted from the TOC. Jury >5 members (rows 5/6) may push the approval box to a second page.
- Export harness exits non-zero only because of Vite "504 Outdated Optimize Dep" console errors; PDF/DOCX are produced.
