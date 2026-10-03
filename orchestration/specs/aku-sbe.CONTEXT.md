# aku-sbe — context pack
## Identity
- Registry id(s): `aku-sbe-master-tr-v1`, `aku-sbe-phd-tr-v1`; also pending (not implemented): aku-sbe-sanatta-yeterlik-tr-v1, aku-sbe-master-en-v1, aku-sbe-phd-en-v1 (source-confirmed, engine/registry gap; spec requiredVariantsPending)
- Template module: `TxtNote/frontend/src/thesis/templates/aku-sbe.js` (exports: akuSbeMaster, akuSbePhd)
- Spec: `orchestration/specs/aku-sbe.json`; checks: `orchestration/specs/aku-sbe.checks.json` (not yet); progress report: `orchestration/reports/aku-sbe.md`
## Sources
- `Butun-Sablonlar/Ege/Afyon Kocatepe Üniversitesi/Sosyal_Bilimler_Enstitusu_Tez/AKU_Sosyal_Bilimler_Enstitusu_Tez_Yazim_Kilavuzu_2026.pdf`
- Guide PDF 2026 (53 pp; cover year 2023, PDF CreationDate 2026-02-06) is the only source; no template DOCX exists.
## Rulings
- Template XML/example structure outranks guide prose (CLOSEOUT_2026-10-03 'User-directed source precedence'); both values stay in spec conflicts[]. Explicit prose wins over example-page geometry unless a spec decision says otherwise.
- Sole source is prose + examples: explicit text wins, examples used only for order/alignment/bold/caps/blank-line counts (spec conflict 'Example pages vs explicit typography', decision recorded).
- Guide's own pages/examples (11 pt, 4.83 mm pitch) are not thesis geometry.
## Key values (from spec; nothing invented)
| property | value | class | locator |
|---|---|---|---|
| Margins T/B/L/R (mm) | 25 mm / 25 mm / 30 mm / 30 mm | EXPLICIT | PDF p.10 (printed 9) §5.1 Kâğıt ve Yazı Alanı |
| Body font | Times New Roman 12 pt | EXPLICIT | PDF p.11 (printed 10) §5.2 Yazı Karakteri |
| Body line spacing | 1.5 | EXPLICIT | PDF p.11 (printed 10) §5.2 |
| Para indent mm / before pt / after pt | 12.5 / 6 / 6 | EXPLICIT | PDF p.11 (printed 10) §5.2 |
| H1 numbering | Turkish ordinal word, uppercase, + ' BÖLÜM' on its own line (BİRİNCİ BÖLÜM) | EXPLICIT | PDF p.12 (printed 11) §5.5.1 Bölüm Başlıkları |
| H1/H2/H3 size | 12 pt / 12 pt / 12 pt | INFERRED | PDF p.11 (printed 10) §5.2 Yazı Karakteri |
| H2 numbering | {2}. — '1.', '2.', … restarting in every chapter (chapter number not included) | EXPLICIT | PDF p.6 (printed 5) §2.6 iv |
| Front matter page format | roman-lower | EXPLICIT | PDF p.4 (printed 3) §2 ÖN BÖLÜM |
| Front numbering start | inner-cover = i (counted, not printed); ethics declaration = ii (first printed number) | EXPLICIT | PDF p.11 (printed 10) §5.3 |
| Table caption | above / document-wide sequential arabic: Tablo 1, Tablo 2, … (no chapter prefix) / 11 pt | EXPLICIT | PDF p.30 (printed 29) §6.5.3 Tablolar ve Şekiller |
## Open issues
- FAIL (independent-1, 2026-10-01; fixes partly landed, no recheck): F01 text colour #111111/#BFBFBF vs black; F02 KAYNAKCA title->entry exp 9.74 mm act 9.10; F03 H2-H5 continuation lines not hanging (exp ~37.5 mm EK 8, act 30.00); F04 table cells all left (exp numbers/header centred); F05 Ekler Dizini plain list (exp Sayfa+leaders); F06 DOCX TOC chapter row 24 pt vs PDF 0 pt. Report: orchestration/validation/aku-sbe/independent-1/independent-1.md
- CONFLICT: 15 in spec (decisions recorded; e.g. 'Guide version', 'Heading number punctuation'). UNKNOWN: 18 (footer distance, heading sizes INFERRED 12 pt, inner-cover vertical distances).
- Variants pending: 3 (see Identity).
## Status
- IN_PROGRESS; validation PENDING; commit null (attempt-1 self-validation 102/102 per variant is historical only). Resume note: untouched in session 2.
## Next step
- Re-run independent-1 FAILs F01-F06 (checker, failed rows only), then decide the 3 pending variants.
## Commands
- `node orchestration/tools/check.mjs --target aku-sbe` ; `--only failed` after a fix.
- Export fallback (if checker lacks coverage): `node orchestration/tools/export.mjs` (real editor PDF/DOCX path), then measure with PyMuPDF.
## Do NOT read
- Guide PDF (53 pp); orchestration/validation/aku-sbe/recheck/* (docx/pdf dumps), attempt-1.json, validate.py; orchestration/artifacts/aku-sbe/ renders. Other targets' specs/validation folders.
