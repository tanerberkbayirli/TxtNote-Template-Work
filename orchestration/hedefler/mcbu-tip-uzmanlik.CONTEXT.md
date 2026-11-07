> Tarihsel hedef kaydı: aşağıdaki durumlar, komutlar ve kararlar kendi tarihlerine aittir; güncel görev veya kaynak önceliği talimatı değildir. Önce [BASLA.md](../BASLA.md), [rapor dizini](../raporlar/README.md) ve hedefin güncel kaynak kaydı değerlendirilir. Eksik tarihsel kanıt yolu güncel doğrulama sayılmaz.

# mcbu-tip-uzmanlik — context pack

## Latest decision checkpoint — 2026-10-15 thesis research
User authorized published thesis examples to resolve the four aggregated UNKNOWN decisions. LEE: guide G[10]/G[32] 9/1 blank lines corroborated by Bölükbaşı 2025; abstract count = physical PDF total (88/88, last Arabic 76). Tıp: bottom-centre numbering and 14 pt title corroborated by Çöldür 2018. Original counter-evidence retained. These scoped application decisions are not institutional approval; other source-silent properties remain documented. Evidence: `orchestration/validation/mcbu-thesis-research-20261015/decisions-v2.json`. Fresh validation: 94 PASS, 0 FAIL/UNKNOWN/SKIPPED; evidence `orchestration\validation\mcbu-thesis-research-20261015\acceptance\mcbu-tip-uzmanlik\check-20261015-1142.json`. Historical statuses below do not override this checkpoint.

## Current checkpoint — 2026-10-15
Fresh real editor/Word validation: 94 PASS, 0 FAIL, 1 required UNKNOWN (guide currency/conflicts), 1 INFO. Chapter-opening number suppression is verified in PDF, Word and refreshed Word. Added English thesis title, required chapter/citation/bibliography checks and measured preface/Turkish-abstract page-limit warnings. TOC refresh no longer creates a blank page (30/30/30 pages). The 2026-10-02 status/open-issue notes below are historical; no claim is made for the fallback PDF writer. Evidence: `orchestration/validation/mcbu-final2-20261015/mcbu-tip-uzmanlik/`. Current report: `orchestration/reports/MCBU_DUZELTMELER_VE_KABUL_2026-10-15.md`. University confirmation remains required; the old guide PDF could not be downloaded again (403).
## Identity
- Registry id(s): `mcbu-tip-uzmanlik-tr-v1`
- Template module: `engine/src/templates/mcbu-tip.js` (exports: mcbuTipUzmanlik)
- Spec: `engine/specs/mcbu-tip-uzmanlik.json`; checks: `engine/specs/mcbu-tip-uzmanlik.checks.json` (not yet); progress report: `orchestration/reports/mcbu-tip-uzmanlik.md`
## Sources
- `Butun-Sablonlar/Ege/Manisa Celal Bayar Üniversitesi/Tip_Fakultesi_Uzmanlik_Tezi/MCBU_Tip_Fakultesi_Uzmanlik_Tez_Yazim_Kilavuzu.pdf`
- Guide PDF (PDF metadata 2014-08-27; text undated; former name 'Celal Bayar Universitesi'); no template. KAYNAK.md/README.md supplementary.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Prose is the requirement; guide's own body pages not used as geometry (only Ek-1/Ek-2 example structures).
- Page number bottom-centre (general rule) over the single top-right example mention; cover title 14 pt prose over example; '5 harf bosluk' = 5 Arial 12 spaces = 5.88 mm (alternative ~10-12 mm).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins L/R/T (mm) | 40 mm / 25 mm / 30 mm | EXPLICIT/INFERRED | p.2 §1.2 |
| Body font | Arial string 12 pt | EXPLICIT | p.2 §1.3 |
| Body line spacing | 1.5 lines | EXPLICIT | p.2 §1.3 |
| Para indent (mm) | 5.88 mm | INFERRED | p.2 §1.3 |
| H1 numbering / caps | I. format; true bool | EXPLICIT/MEASURED | p.3 §V |
| Front / main numbering | none enum / arabic enum | EXPLICIT | p.2 §1.4 |
| Captions position | above enum / below enum | EXPLICIT | p.2 §1.5 |
| Caption numbering | document, Arabic ('Tablo 1', 'Şekil 1') format | EXPLICIT | p.2 §1.5 |
| TOC title / leader | İÇİNDEKİLER string; none enum | EXPLICIT | p.3 §V |
## Open issues
- FAIL (known gap): chapter-opening pages must carry no number (EXPLICIT guide p.2 s1.4); opt-in numbering.omitOnChapterStart (9c605e3) implemented, self-check shows sheets 5,9,13,... unnumbered in PDF; DOCX uses titlePg - not verified in Word; fallback PDF writer lacks it. Report: orchestration/validation/mcbu-tip-uzmanlik/selfcheck-chapter-numbers.md
- CONFLICT: 10 (page-number position, cover title size, cover distances, 5-letter indent, guide currency vs LEE guide). UNKNOWN: 12 (footer distance, h2-h4, captions, tables, footnotes, equations, abstract/approval layouts).
## Status
- Self-check 52/52 on tested checks (commits 4b31444, 9c605e3); independent validation pending.
- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
## Next step
- Independent validation via checker incl. Word render of titlePg sections.
## Commands
- `node engine/tools/check.mjs --target mcbu-tip-uzmanlik` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node engine/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Historical reading boundary (not a current instruction)
- Guide PDF; orchestration/validation/mcbu-tip-uzmanlik/self-1 (tip.pdf/docx/layout.json); orchestration/artifacts/mcbu-tip-uzmanlik/. Other targets' specs/validation folders.
