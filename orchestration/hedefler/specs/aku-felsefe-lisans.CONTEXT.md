# aku-felsefe-lisans — context pack
## Identity
- Registry id(s): `aku-felsefe-lisans-tr-v1`
- Template module: `engine/src/templates/aku-felsefe.js` (exports: akuFelsefeLisans). Shares module aku-felsefe.js with aku-felsefe-seminer.
- Spec: `orchestration/specs/aku-felsefe-lisans.json`; checks: `orchestration/specs/aku-felsefe-lisans.checks.json` (not yet); progress report: `orchestration/reports/aku-felsefe-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Felsefe_Bolumu_Tez_ve_Seminer/AKU_Felsefe_Lisans_Bitirme_Tezi_Yazim_Kilavuzu_2019.docx`
- Guide DOCX 2019 (SHA-256 54e0dc8c..; locators = zero-based document.xml paragraph indices; cover example is a VML drawing at p130, contents example p131). Guide's own sectPr/page geometry is NOT thesis geometry.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Margins: guide text (30/30/35/20 mm) over guide-document sectPr (spec conflict 'margins: guide text vs guide sectPr').
- 6 pt before + 6 pt after is a Word collapse (not additive 12 pt); template/spec switched to collapse (8b78209). Heading/caption/bibliography typography UNKNOWN, unscored.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 35 mm | EXPLICIT | para 35-36 |
| Body font | Times New Roman 12 pt | EXPLICIT | paras 28-34 (Tez içerisinde kullanılacak metin) |
| Para before/after (pt) | 6 / 6 | EXPLICIT | paras 28-34 (Tez içerisinde kullanılacak metin) |
| Page numbering | position bottom/align center/format arabic/startAt 1 | EXPLICIT | para 60 |
| TOC example depth | 4 levels | MEASURED | para 131 contents example |
| Right margin / line spacing / indent | 20 mm / 1.5 lines / 12.5 mm (independent audit; not rules[] keys) | EXPLICIT | guide p35-36, p28-34 (REPORT.md) |
## Open issues
- FAIL (independent audit aku-felsefe-independent-2, interim): required Dis/Ic kapak missing (added in 51e8a33, selfcheck only); former additive 12/6 pt export (now 6/6 collapse); TOC example depth >=4 and symbols entry. Report: orchestration/validation/aku-felsefe-independent-2/REPORT.md; selfcheck: orchestration/validation/aku-felsefe-lisans/selfcheck-fix.md
- Cover rows measured +-0.05 mm in self-check; horizontal centre -1.2 mm unscored; TOC example irregular (UNKNOWN); Word rerender after collapse change outstanding.
- CONFLICT: 1 (margins, ruled). UNKNOWN: heading typography/numbering, captions, bibliography typography, header/footer geometry.
## Status
- FAIL; commits 8b78209, 51e8a33 (covers). Resume: needs independent-1.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- independent-1 via checker after Word rerender of corrected fixture.
## Checker handoff (2026-10-04)
- Added source-backed cover row content, 14/18/12 pt size and bold checks, plus each adjacent baseline gap measured by shared conformance from cached official Word-rendered guide p.7; matching editor-PDF and Word-PDF checks are present.
- VML frame absolute position and horizontal centering remain UNKNOWN/unscored; the cover `Times` vs prose `Times New Roman` face conflict remains explicit.
## Commands
- `node orchestration/tools/check.mjs --target aku-felsefe-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide DOCX; orchestration/validation/aku-felsefe-independent-2/{official-guides,*.pdf,*.docx,source-*.py outputs}; orchestration/artifacts/aku-felsefe-lisans/. Other targets' specs/validation folders.
