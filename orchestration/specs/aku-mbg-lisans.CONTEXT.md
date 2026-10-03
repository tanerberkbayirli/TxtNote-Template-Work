# aku-mbg-lisans — context pack
## Identity
- Registry id(s): `aku-mbg-lisans-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-mbg.js` (exports: akuMbgLisans)
- Spec: `orchestration/specs/aku-mbg-lisans.json`; checks: `orchestration/specs/aku-mbg-lisans.checks.json` (not yet); progress report: `orchestration/reports/aku-mbg-lisans.md`
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
- No independent validation exists; no FAIL recorded. Only self-1.
- CONFLICT: 15 in spec (cover top margin, bibliography hanging, abstract order, ethics name size, CV presence). UNKNOWN: 10 (outer-cover layout, footnotes, abstract limits, appendix heading style).
## Status
- IMPLEMENTED; self PASS (attempt-1), independent pending; commit 4b31444. Untouched in session 2.
## Next step
- Run checker for independent validation (no report yet).
## Commands
- `node orchestration/tools/check.mjs --target aku-mbg-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF + template DOCX; orchestration/validation/aku-mbg-lisans/self-1 dumps; orchestration/artifacts/aku-mbg-lisans/*. Other targets' specs/validation folders.
