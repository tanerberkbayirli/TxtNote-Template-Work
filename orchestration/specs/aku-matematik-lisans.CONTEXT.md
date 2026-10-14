# aku-matematik-lisans — context pack
## Identity
- Registry id(s): `aku-matematik-lisans-tr-v1`
- Template module: `engine/src/templates/aku-matematik.js` (exports: akuMatematikLisans)
- Spec: `orchestration/specs/aku-matematik-lisans.json`; checks: `orchestration/specs/aku-matematik-lisans.checks.json`; progress report: `orchestration/reports/aku-matematik-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Matematik_Bolumu_Bitirme_Tezi/AKU_Matematik_Lisans_Tez_Sablonu_2025.docx`
- Template DOCX only (2025-10-21; XML = primary). No guide PDF; approval/ethics/abstract pages are absent from the template (not generated).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Lists paragraph: user-directed XML-over-prose precedence applied in spec as line=360 after=0 (7.30 mm/line); independent-2 judged the earlier template implementation as ruling opposite (fixed in 7981c44).
- Body/bibliography TNR (Calibri = paste residue); table cell 12 pt (UNKNOWN requirement).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 30 mm | MEASURED | word/document.xml sectPr (all 3 sections) w:pgMar |
| Body font | Times New Roman 12 pt | MEASURED | styles.xml Normal w:rFonts |
| Body line spacing | 1.5 | MEASURED | document.xml body paragraphs w:spacing w:line=360 a… |
| Para indent / before | 0 / 0 | MEASURED | document.xml body paragraphs have no w:ind |
| H1 style | TNR 12 bold, left, 1.5 lines, 0 pt before/after, no indent | MEASURED | styles.xml Balk2 + document.xml direct w:spacing li… |
| Page number position | bottom-center | MEASURED | footer2/3.xml jc=center, PAGE field |
| Front / main format | lower-roman / arabic start 1 | MEASURED | sectPr#2 w:pgNumType |
| Caption label+numbering | Şekil 2.1 / Çizelge 3.1 / Resim 4.1 (chapter.n, space only) | MEASURED | document.xml caption paragraphs |
| Caption font | 11 pt | MEASURED | caption runs w:sz=22; call-out: 'Şekil başlıklarını… |
| Table borders | three horizontal rules 0.5 pt (top, under header, bottom), no verticals | MEASURED | tblBorders per cell w:sz=4, left/right nil |
## Open issues
- FAIL (independent-2, 2026-10-03; both fixed in 7981c44/selfcheck-fix-3, not re-verified): lists.entry.spacing exp 7.30 mm/line incl. wrapped, act single+6 pt (wrapped 4.87, delta -2.43); symbols.table exp x0 31.97 + 3 bottom rules + blank row, act 30.00 no rules. Report: orchestration/validation/aku-matematik-lisans/REPORT-independent-2.md
- Progress lastError (older): table note->next heading exp 14.09 act 14.60 (+0.51 mm).
- CONFLICT: 5 (all ruled). UNKNOWN: 8 (h2-h4 caps, row height, footnotes, appendices, CV, multi-line title).
## Status
- DONE (Tier 1, AGENTS §28A) 2026-10-03: checker --word check-20261003-1617 PASS 46 / FAIL 0. 0.1 cause: checker fixture lacked the symbols table (no engine regression); fixture now a table with authored widths <col data-col-width> (new engine capability).
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- Done. Reopen only if `check.mjs --all` regresses.
- Phase 3 pilot (2026-10-07): three additive landmark checks (H1 baseline/size, introduction heading-to-body gap) reuse existing source expectations/tolerances. Fresh default export: 7/7 selected checks PASS, including three existing PDF checks and independent glyph consistency. Evidence: `orchestration/reports/MOTOR_PHASE3_PILOT_2026-10-07.md`. Full target/Word regression and whole-target runtime gate were not rerun or claimed; historical next step superseded by the Phase 3 closure above.
## Commands
- `node orchestration/tools/check.mjs --target aku-matematik-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Template DOCX; orchestration/validation/aku-matematik-lisans/{self-1,independent-*.json}; render/indep2/ PDFs. Other targets' specs/validation folders.
