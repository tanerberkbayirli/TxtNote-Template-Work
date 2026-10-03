# aku-fbe — context pack
## Identity
- Registry id(s): `aku-fbe-master-tr-v1`, `aku-fbe-phd-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-fbe.js` (exports: akuFbeMaster, akuFbePhd)
- Spec: `orchestration/specs/aku-fbe.json`; checks: `orchestration/specs/aku-fbe.checks.json` (not yet); progress report: `orchestration/reports/aku-fbe.md`
## Sources
- `orchestration/official-sources/aku-fbe/AKU_FBE_Tez_Sablonu_online_2023.docx`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Enstitusu_Tez/AKU_Fen_Bilimleri_Tez_Sablonu_2025.docx`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Fen_Bilimleri_Enstitusu_Tez/AKU_Fen_Bilimleri_Tez_Yazim_Kilavuzu_2020.pdf`
- (supplementary) `orchestration/official-sources/aku-fbe/Fen_Bil_Ens_Tez_LaTeX_Sablon_2020.rar`
- Template DOCX 2023-12-20 (official FBE; XML = primary) and its 2025 resave (identical, supplementary); guide PDF 2020 (prose); LaTeX .rar 2020 supplementary.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Word source/template evidence governs; historical BLOCKED rationale discarded (progress lastError).
- Template XML > guide prose (CLOSEOUT); 2011 guide superseded by 2020 guide (spec conflict 'body font').
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 30 mm | EXPLICIT | p.5 §2.3 |
| Body font | Times New Roman 12 pt | EXPLICIT | p.5 §2.2 |
| Body line spacing | 1.5 | EXPLICIT | p.5-6 §2.4 |
| Word line model | mode word/singleLineEm 1.15 | MEASURED | p.32 single-spaced 12 pt pitch 13.80 pt; p.5 1.5-sp… |
| Para first-line indent / blank line | 0 / true | EXPLICIT | p.5 §2.4 |
| H1 size / bold | 12 pt / true | EXPLICIT | p.7 §2.8 |
| Page number position | bottom | EXPLICIT | p.6 §2.7 |
| Front format | roman-lower | EXPLICIT | p.7 §2.7 |
| Front start | section abstract-tr/value 1 | EXPLICIT | p.7 §2.7 |
| Figure caption | Şekil / below / scope chapter/format {chapter}.{n}/sequence arabic | EXPLICIT | p.13 §3.2 |
| Table caption | Çizelge / above | EXPLICIT | p.13 §3.2 |
## Open issues
- FAIL (attempt-5, 2026-10-01): DOCX section margins sec1 54.998 vs 30 mm (+25), sec3 left/bottom/right 31.097/27.323 vs 30 (+1.094/-2.681); 89-char title fixture wraps 6 lines (exp 4). Report: orchestration/validation/aku-fbe/attempt-5.md
- FAIL (word-evidence-2, 2026-10-02): body right edge 180.97 vs 180 (+0.97); outer-cover title baseline 208.39 vs 215.53 (-7.14); approval baselines +0.59/+0.68/+0.68/+0.68 mm. Report: orchestration/validation/aku-fbe/word-evidence-2/report.md
- CONFLICT: 18 in spec (right margin, page-number vertical position, approval pitch/box, chapter->first-paragraph gap, OZGECMIS vs EKLER order). UNKNOWN: 16 (footnotes, max title length, approval co-advisor slot).
## Status
- IN_PROGRESS; validation FAIL; commit 6d73e66. Resume note: untouched in session 2.
## Next step
- Fix DOCX section margins (sec1/sec3) and cover/approval baselines, then run checker failed rows.
## Commands
- `node orchestration/tools/check.mjs --target aku-fbe` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF 2020; orchestration/validation/aku-fbe/{work,work2,renders,attempt-4-proof,attempt-5-equation-repro}; orchestration/artifacts/aku-fbe/source/word-render/; the LaTeX .rar. Other targets' specs/validation folders.
