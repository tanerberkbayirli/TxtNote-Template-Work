# afsu-dis-hekimligi — context pack
## Identity
- Registry id(s): `afsu-dis-hekimligi-uzmanlik-tr-v1`
- Template module: `engine/src/templates/afsu-tip.js` (exports: afsuDisHekimligiUzmanlik). Variant of the afsu-tip family (module afsu-tip.js, export afsuDisHekimligiUzmanlik). Spec file orchestration/specs/afsu-dis-hekimligi.json does NOT exist although progress.json points at it; use afsu-tip.json (covers both guide copies).
- Spec: `orchestration/specs/afsu-dis-hekimligi.json` (NOT PRESENT); checks: `orchestration/specs/afsu-dis-hekimligi.checks.json` (not yet); progress report: `orchestration/reports/afsu-tip.md`
## Sources
- `Butun-Sablonlar/Ege/Afyonkarahisar Sağlık Bilimleri Üniversitesi/Tip_Dis_Hekimligi_Uzmanlik_Tezi/AFSU_Dis_Hekimligi_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu_2021.pdf`
- DHF guide PDF 2021-09-21 (32 pp) = second export of the same guide as the Tip PDF; body text identical; appendix example geometry differs (GEO.dhf).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Inherits afsu-tip rulings (example wins over prose; see afsu-tip.CONTEXT.md). English faculty wording: only 'Faculty of Medicine' given (EK 12) - DHF English name UNKNOWN.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L/R (mm) | 25/25/40/25 | EXPLICIT | afsu-tip.json page.margins (p.4 s2.2, EK 1 p.16) |
| Body | TNR 12, 1.5, indent 12.5 mm, justify | EXPLICIT | afsu-tip.json body.* |
| H1 | 14 pt bold uppercase centred, new page | EXPLICIT | afsu-tip.json heading1 |
| Page numbering | bottom centre; Roman from ic kapak; Arabic from giris | EXPLICIT | afsu-tip.json page.numbering |
## Open issues
- FAIL (afsu-tip independent-1, applies to DHF too): A1 Onay -22.06 mm; A2 centre +7.0 mm; A3 TOC 'Sayfa' row -4.54 mm; A4 footnote pitch 5.97 vs 4.87 mm (engine); A5 DOCX table rows +4.51 mm/row (engine). Report: orchestration/validation/afsu-tip/independent-1/REPORT.md
- DHF-specific geometry (EK 7/8/9/11/12/13) not separately validated; no DHF-specific report exists.
## Status
- IN_PROGRESS; validation FAIL (shared with afsu-tip); commit 4ff8e65.
## Next step
- Wait for engine-fix-4, then run checker for the DHF variant after afsu-tip.
## Commands
- `node orchestration/tools/check.mjs --target afsu-dis-hekimligi` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Both guide PDFs; orchestration/validation/afsu-tip/*; orchestration/artifacts/afsu-tip/ (shared). Other targets' specs/validation folders.
