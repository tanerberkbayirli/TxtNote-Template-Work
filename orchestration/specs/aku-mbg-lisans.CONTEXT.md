# aku-mbg-lisans — context pack
## Identity
- Registry id(s): `aku-mbg-lisans-tr-v1`
- Template module: `engine/src/templates/aku-mbg.js` (exports: akuMbgLisans)
- Spec: `orchestration/specs/aku-mbg-lisans.json`; checker files now present: `orchestration/specs/aku-mbg-lisans.checks.json` and `.fixture.json`; progress report: `orchestration/reports/aku-mbg-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Kilavuzu_2025.pdf`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/MBG_Lisans_Bitirme_Tezi/AKU_MBG_Lisans_Bitirme_Tezi_Sablonu_2025.docx`
- Template DOCX 2025-02-27 (XML = primary); guide PDF 2025-05-13 (prose).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Template XML > prose (CLOSEOUT).
- Guide-silent items taken from template only by style inheritance (footnote 10 pt) and kept UNKNOWN.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 30 mm / 30 mm / 30 mm | EXPLICIT | PDF p.4 §2.3 |
| Body font | Times New Roman 12 pt | EXPLICIT | PDF p.4 §2.2 |
| Body line spacing | 1.5 | EXPLICIT | PDF p.5 (printed 3) §2.4 |
| Para indent / blank line between | 0 / true | EXPLICIT | PDF p.4 §2.4 |
| H1 line spacing | 1.5 | TEMPLATE | Balk1 w:spacing line=360 auto (Balk2/3 inherit); Ba… |
| H1 size / bold | 12 pt / true | EXPLICIT | PDF p.5 §2.7 |
| Page number position | bottom | EXPLICIT | PDF p.5 §2.6 |
| Front format / start | roman-lower / section abstract/value 1/label i | EXPLICIT | PDF p.5 §2.6 |
| Figure caption | Şekil / below / scope chapter/format {chapter}.{n}/example Şekil 2.1 | EXPLICIT | PDF p.11 §3.2 |
| Table caption | Çizelge / above | EXPLICIT | PDF p.11 §3.2 |
## Open issues
- Cached official Word reference is now present at `orchestration/artifacts/aku-mbg-lisans/source/reference/official-word.pdf` (27 pages). On physical page 1, logo row begins at y=10.0189 mm; first four baselines are 43.949, 52.458, 60.967, 103.565 mm. The report's old values were glyph bottoms; root owns correcting the checker rows to these baselines.
- The previous real Word export put the logo at 17.3919 mm because empty header parts were emitted. The exporter now omits header parts document-wide only when no section uses header content, first/even header content, or a top page number. Root must verify the fresh Word output.
- The cached source first baseline (43.949 mm) is 1.216 mm above the prior editor output (45.165 mm); the logo-row gap was reduced from 4.29 to 3.074 mm based on that measured source discrepancy. Fresh export validation is pending.
- No independent validation exists; prior attempt was self-1.
- CONFLICT: 15 in spec (cover top margin, bibliography hanging, abstract order, ethics name size, CV presence). UNKNOWN: 10 (outer-cover layout, footnotes, abstract limits, appendix heading style).
## Status
- Implementation remains candidate; source evidence now cached and generic header-part omission/logo-gap correction need root's new editor/Word verification. Do not carry prior self-1 PASS as an independent result.
## Checker handoff (2026-10-04)
- Added source-backed coverage for A4/30 mm geometry, exact body font and size, line pitch, fixed inner-cover baselines, H1-H4 sizing, page-number starts/formats, cover/page labels, and DOCX/Word validity. Fixture contains all target front-matter fields and H2-H4 sample headings.
- Official source render/reference exists and was cached once; no source artifact was changed.
- Root should run `node orchestration/tools/check.mjs --target aku-mbg-lisans --word`; cover baseline checks must use the measured baselines listed above, not line glyph bottoms.
## Commands
- `node orchestration/tools/check.mjs --target aku-mbg-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF + template DOCX; orchestration/validation/aku-mbg-lisans/self-1 dumps; orchestration/artifacts/aku-mbg-lisans/*. Other targets' specs/validation folders.

- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
