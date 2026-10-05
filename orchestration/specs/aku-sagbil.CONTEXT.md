# aku-sagbil — context pack
## Identity
- Registry id(s): `aku-sagbil-master-tr-v1`, `aku-sagbil-phd-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-sagbil.js` (exports: akuSagbilMaster, akuSagbilPhd)
- Spec: `orchestration/specs/aku-sagbil.json`; checks: `orchestration/specs/aku-sagbil.checks.json`; progress report: `orchestration/reports/aku-sagbil.md`
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
- Prior independent-1 FAILs: H4 bold (fixed locally); TOC missing approval/ethics rows (fixed via `tocEntry:title` + counted hidden Roman labels); first appendix not sharing EKLER page (fixed via conditional H2 page break).
- Fresh 1754 run's approval spill was fixture-driven: the fixture's actual document title remained long because the top-level `title` did not match its short THESIS_TITLE value. Normal master/PhD fixtures now use the short title in both places; each retains five example jurors. Re-export needed before interpreting page parity.
- Equation caption remains an engine gap: the model/editor stores only math and a numbered flag; it has no description text or mixed-style label/description block. Keep the existing numberAlign path unchanged unless an optional source-configured caption is present.
- Caption 12 pt follows explicit §2.14 body-size prose; example 11 pt remains recorded as a conflict in `conflicts[]`.
- Front-matter number chronology remains CONFLICT; no exact Roman start is asserted.
- Other retained conflicts/unknowns: 21 conflicts and 25 UNKNOWN entries in the source audit.
## Status
- Template edits and source-backed checks/fixtures are prepared locally; this worker did not run real exports or Word output validation.
- Normal master/PhD fixtures use a short title in the actual document title and THESIS_TITLE value, no co-advisor, and five jurors; stress `t80` remains unchanged. PDF checks cover both editor and Word-rendered output.
- Checker rows now target the fixture's actual H4 text (no synthetic number prefix); centered no-leader TOC parsing is opt-in. The source-approved Example 8 labels for hidden approval/ethics pages (ii/iii) are checked only as contents labels while the pages remain physically unprinted; §2.6's preliminary-numbering conflict is retained. `t80` page-count/label parity remains checked, not waived.
## Next step
- Root serializes real exports/Word. Resolve supported Tier 1 failures from fresh output; title overflow remains Tier 2 UNKNOWN.
## Commands
- `node orchestration/tools/check.mjs --target aku-sagbil` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDFs (2022, 2015); orchestration/artifacts/aku-sagbil/{render,source/pages,export}; orchestration/validation/aku-sagbil/recheck/*. Other targets' specs/validation folders.
