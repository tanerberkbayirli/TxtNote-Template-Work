# aku-felsefe-seminer — context pack
## Identity
- Registry id(s): `aku-felsefe-seminer-tr-v1`
- Template module: `engine/src/templates/aku-felsefe.js` (exports: akuFelsefeSeminer). Shares module aku-felsefe.js with aku-felsefe-lisans.
- Spec: `orchestration/specs/aku-felsefe-seminer.json`; checks: `orchestration/specs/aku-felsefe-seminer.checks.json` (not yet); progress report: `orchestration/reports/aku-felsefe-seminer.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/AKU_Felsefe_Seminer_Hazirlama_Kilavuzu_2019.docx`
- Seminar guide DOCX 2019 (SHA-256 03eec8c6..; cover example VML at p124; bibliography examples from p59).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Margins: guide text (30/30/30/20 mm) over guide-document sectPr (spec conflict).
- 6/6 pt collapse (not additive 12/6); page numbering says 'from preface' though seminar has no Onsoz -> start scope UNKNOWN.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 30 mm | EXPLICIT | para 38-39 |
| Body font | Times New Roman 12 pt | EXPLICIT | paras 31-37 (Seminer içerisinde kullanılacak metin) |
| Para before/after (pt) | 6 / 6 | EXPLICIT | paras 31-37 (Seminer içerisinde kullanılacak metin) |
| Page numbering | position bottom/align center/format arabic/startAt 1 | EXPLICIT | para 52 |
| Right margin / line spacing / indent | 20 mm / 1.5 lines / 12.5 mm (independent audit) | EXPLICIT | guide p38-39, p31-37 (REPORT.md) |
| Sequence / length | cover, intro-development-conclusion, bibliography; >=10 pages | EXPLICIT | guide p43-50 (REPORT.md) |
## Open issues
- FAIL (independent audit, interim): required cover missing (added in 51e8a33, selfcheck only); former 12/6 pt additive export (now 6/6 collapse); centred cover rows measured, generated-page geometry UNKNOWN. Report: orchestration/validation/aku-felsefe-independent-2/REPORT.md; selfcheck: orchestration/validation/aku-felsefe-seminer/selfcheck-fix.md
- CONFLICT: 1 (margins, ruled). UNKNOWN: heading/caption/bibliography typography, header/footer geometry, numbering start scope.
## Status
- FAIL; commits 8b78209, 51e8a33. Resume: needs independent-1.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- independent-1 via checker after Word rerender of corrected fixture.
## Checker handoff (2026-10-04)
- Added source-backed cover row content, 14/18/12 pt size and bold checks, plus each adjacent baseline gap measured by shared conformance from cached official Word-rendered guide p.7; matching editor-PDF and Word-PDF checks are present.
- VML frame absolute position and horizontal centering remain UNKNOWN/unscored; the cover `Times` vs prose `Times New Roman` face conflict remains explicit.
## Commands
- `node orchestration/tools/check.mjs --target aku-felsefe-seminer` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide DOCX; orchestration/validation/aku-felsefe-independent-2/*; orchestration/artifacts/aku-felsefe-seminer/. Other targets' specs/validation folders.
