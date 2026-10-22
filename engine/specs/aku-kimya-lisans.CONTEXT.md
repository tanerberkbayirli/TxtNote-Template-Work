# aku-kimya-lisans — context pack
## Identity
- Registry id(s): `aku-kimya-lisans-tr-v1`
- Template module: `engine/src/templates/aku-kimya.js` (exports: akuKimyaLisans)
- Spec: `orchestration/specs/aku-kimya-lisans.json`; checker files now present: `orchestration/specs/aku-kimya-lisans.checks.json` and `.fixture.json`; progress report: `orchestration/reports/aku-kimya-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Kimya_Bolumu_Bitirme_Tezi/AKU_Kimya_Bitirme_Tezi_Yazim_Kilavuzu_2023.pdf`
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Kimya_Bolumu_Bitirme_Tezi/AKU_Kimya_Bitirme_Tezi_Sablonu_2026.docx`
- Template DOCX 2026-02-24 (XML = primary); guide PDF 2023-12 (prose).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Template XML > prose (CLOSEOUT); 'heading gap (guide prose vs template Balk styles)' recorded in conflicts[].
- 'Devam' wrapped-title and Internet Kaynaklari group have no engine representation (UNKNOWN / hand-authored).
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins all sides (mm) | 30 mm | EXPLICIT | p.5 §2.3 |
| Inner-cover top margin (mm) | 10.02 mm | MEASURED | sectPr 1 pgMar top=568 |
| Body font | Times New Roman 12 pt | EXPLICIT | p.5 §2.2 |
| Body line spacing | 1.5 lines | EXPLICIT | p.5-6 §2.4 |
| Paragraph gap | 20.7 pt | EXPLICIT | p.5-6 §2.4/§2.6 |
| H1 / H2 case | UPPERCASE, ve/veya/ile lower-case, new page | EXPLICIT | p.7 §2.8 |
| Page number | bottom-center; Times New Roman 10 pt, no ornaments | EXPLICIT | p.6 §2.2 and p.6-7 §2.7 |
| Page number scheme | cover/onay/etik none; ÖZET.. lower roman from i; GİRİŞ.. arabic from 1; KAYNAKLAR/ÖZGEÇMİŞ/EKL… | EXPLICIT | p.6-7 §2.7 |
| Caption format | Şekil/Çizelge/Resim <chapter>.<n>, label bold, 11 pt single, justified, hanging, after 6 pt | EXPLICIT | p.13 §3.2-3.3 |
| Table borders | 0.5 pt top, header-bottom and last-row-bottom rules, no side rules | TEMPLATE | tcBorders in all 4 sample tables |
| Table cell font | 12 pt | EXPLICIT | p.5 §2.2 |
## Open issues
- No independent validation; progress lastError: cover positioning and blank DOCX header workarounds need engine review.
- CONFLICT: 7 (inner-cover top margin, footnote/table-cell font size, symbols indent, onay/etik separation). UNKNOWN: 7 (outer cover, table row height 6.2-7.0 mm, cv fields).
## Status
- IMPLEMENTED; validation PENDING (self reports deviations); commit dd2d49a. Untouched in session 2.
## Checker handoff (2026-10-04)
- Added source-backed coverage for A4/30 mm geometry, exact body font and size, line pitch, measured cover baselines, H1-H4 sizing/case, front/main numbering, and DOCX/Word validity. Fixture contains front matter, appendices, and H2-H4 sample headings.
- `source/template.pdf` is an existing official Word-rendered source reference, but the standard `source/reference/` bundle (`official-word.pdf`, `official.docx`, `reference.json`) is absent. Reuse the cached render when building reference data; do not re-render the official template.
- Root should run `node orchestration/tools/check.mjs --target aku-kimya-lisans --word` after ensuring the existing source render is cached once.
## Commands
- `node orchestration/tools/check.mjs --target aku-kimya-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF + template DOCX; orchestration/validation/aku-kimya-lisans/self-1; orchestration/artifacts/aku-kimya-lisans/*. Other targets' specs/validation folders.

- Phase 3 (2026-10-07): source-derived landmark checks enabled; report schema/PDF cross-check gates apply to every export. See `orchestration/reports/MOTOR_PHASE3_CLOSE_2026-10-07.md` for runtime, regression evidence and separately open university variants. This checkpoint does not change the university completion status.
