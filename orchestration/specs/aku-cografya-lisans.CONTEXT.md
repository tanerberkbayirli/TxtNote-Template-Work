# aku-cografya-lisans — context pack
## Identity
- Registry id(s): `aku-cografya-lisans-tr-v1`
- Template module: `TxtNote/frontend/src/thesis/templates/aku-cografya.js` (exports: akuCografyaLisans)
- Spec: `orchestration/specs/aku-cografya-lisans.json`; checks: `orchestration/specs/aku-cografya-lisans.checks.json` (exists); progress report: `orchestration/reports/aku-cografya-lisans.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Cografya_Bolumu_Bitirme_Tezi/AKU_Cografya_Bitirme_Tezi_Yazim_Kilavuzu_2024.pdf`
- Template DOCX 2024-03-31 (XML = primary, wins conflicts); guide PDF 2024-03-11 (prose, 23 pp).
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Template wins (integrationResolution 2026-10-03): paragraph gap = template before/after 6/6 pt collapse (9.42 mm baseline gap), no extra empty line; page numbering from template sectPr (ethics ii, OZET iii; guide said ethics unnumbered, OZET i).
- Body first-line indent decided 12.5 mm (template + guide's own Word body agree; prose ambiguous). Heading indent 0. Bibliography single; 'KAYNAKLAR' fixed title.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L (mm) | 25 mm / 25 mm / 30 mm | EXPLICIT | p.2 2.3 |
| Body font | Times New Roman 12 pt | EXPLICIT | p.2 §2.2 |
| Body line spacing | 1.5 | EXPLICIT | p.2 §2.2 |
| Paragraph before/after (pt) | 6 / 6 | TEMPLATE/EXPLICIT | body paragraphs #237-#239,#285-#296 w:spacing w:bef… |
| H1 size / bold | 12 pt / true | EXPLICIT | p.4 §2.8 |
| Page number position | bottom | EXPLICIT | p.3 §2.7 |
| Front format | roman-lower | EXPLICIT | p.3 §2.7 |
| Figure caption | Şekil / below / {chapter}.{n} | EXPLICIT | p.6-7 §3 |
| Table caption | Tablo / above / {chapter}.{n} | EXPLICIT | p.6-7 §3 |
## Open issues
- FAIL (independent-2, 2026-10-03; 19 PASS/1 FAIL): table-line-spacing - official tables single (template 11 pt ~4.65 mm pitch); export PDF row pitch 9.37 mm, Word 13.85 mm. Partly fixed in 7981c44; remaining = cell padding decision (engine default 6 pt top/bottom -> ~8.7 mm). Report: orchestration/validation/aku-cografya-lisans/REPORT-independent-2.md
- INFO: 3-line-title cover year spills to p.2; table cell 12 pt vs template 11 pt (fixed in 7981c44).
- CONFLICT: 26 in spec (decisions recorded). UNKNOWN: 19 (outer cover, footer distance, TOC leader/indent, footnotes).
## Status
- IMPLEMENTED; self PASS, independent-2 FAIL (1); commits 4b31444, 7981c44. Needs orchestrator decision on template-level cell padding.
## Next step
- Orchestrator decides cell-padding option (official pitch ~4.65 mm), then independent-3 via checker.
## Commands
- `node orchestration/tools/check.mjs --target aku-cografya-lisans` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF + template DOCX; orchestration/artifacts/aku-cografya-lisans/{render,source/docx}; orchestration/validation/aku-cografya-lisans/renders. Other targets' specs/validation folders.
