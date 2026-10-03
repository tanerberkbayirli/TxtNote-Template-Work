# aku-sagbil — context pack
## Identity
- Registry id(s): `aku-sagbil-master-tr-v1`, `aku-sagbil-phd-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-sagbil.js` (exports: akuSagbilMaster, akuSagbilPhd)
- Spec: `orchestration/specs/aku-sagbil.json`; checks: `orchestration/specs/aku-sagbil.checks.json` (not yet); progress report: `orchestration/reports/aku-sagbil.md`
## Sources
- `orchestration/official-sources/aku-sagbil/AKU_Saglik_Bilimleri_Tez_Yazim_Kilavuzu_2022.pdf`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/AKU_Saglik_Bilimleri_Enstitusu_Tez_Kilavuzu_2015.pdf`
- Guide PDF 2022 (10.02.2022; cover prints 2020) primary; 2015 guide historical-superseded. No template DOCX in repo.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- 2022 guide governs; 2015 guide not used (spec conflict 'Guide version/date').
- Explicit prose > example-page geometry; 6 conflicts + 1 unknown in section reconciliation still open (progress lastError).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins L/T/B (mm) | 30 mm / 30 mm / 30 mm | EXPLICIT | PDF p.4 (printed p.2), §2.3 |
| Body font | Times New Roman 12 pt | EXPLICIT | PDF p.4 (printed p.2), §2.2 |
| Body line spacing | 1.5 | EXPLICIT | PDF p.4 (printed p.2), §2.4 |
| Para first-line indent (mm) | 0 mm | EXPLICIT | PDF p.4 (printed p.2), §2.4 |
| H1 style | bold, uppercase (size UNKNOWN) | EXPLICIT | PDF p.5 (printed p.3), §2.7 |
| H2/H3 case | Title case; ve/veya/ile lowercase | EXPLICIT | PDF p.5 (printed p.3), §2.7 |
| Page number position | bottom | EXPLICIT | PDF p.4 (printed p.2), §2.3 |
| Front format | roman-lower | EXPLICIT | PDF p.5 (printed p.3), §2.6 |
| Table caption position | above | EXPLICIT | PDF p.11 (printed p.9), §2.14 |
| Figure caption position | below | EXPLICIT | PDF p.11 (printed p.9), §2.14 |
| Table/figure min font | minimum 8 pt for tables/figures/formulas | EXPLICIT | PDF p.4 (printed p.2), §2.2 |
## Open issues
- FAIL (independent-1, 2026-10-01; 8 FAIL/7 CONFLICT): R10 4th-level heading not bold; R14 190-char title -> approval spills to stray page 4; R15 approval title baseline 36.08 vs 33.95 (-2.13 mm); R23 TOC page numbers right-aligned (centre 177.9 vs ~172.7); R24 TOC missing Onay/Etik rows; R33 equation label 'Denklem 2.1:' absent; R35 footnote 7.5 pt PDF vs 10 pt; R37 EKLER heading/first Ek not on same page. Report: orchestration/validation/aku-sagbil/independent-1/independent-1.md
- CONFLICT: 21 in spec (Onsoz/Icindekiler order, keyword label, bibliography size/spacing, 'aralik' meaning). UNKNOWN: 25 (page-number distance/font, heading sizes, footnote size).
## Status
- IN_PROGRESS; validation PENDING; commit null. Resume note: untouched in session 2.
## Next step
- Fix R14/R15 approval overflow and R35 footnote size, then rerun failed rows.
## Commands
- `node orchestration/tools/check.mjs --target aku-sagbil` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDFs (2022, 2015); orchestration/artifacts/aku-sagbil/{render,source/pages,export}; orchestration/validation/aku-sagbil/recheck/*. Other targets' specs/validation folders.
